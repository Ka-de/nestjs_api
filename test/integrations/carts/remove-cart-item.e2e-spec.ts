import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../../src/database/database.service';
import { AppModule } from '../../../src/app.module';
import { Fixture } from '../../fixture';
import { RedisCacheService } from '../../../src/redis-cache/redis-cache.service';
import { ConfigService } from '@nestjs/config';
import { expect } from 'chai';

describe('Remove Cart item', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let user: any;
  let design = null;
  let cartItem = null;
  let authorization: string;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService;

  before(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        AppModule
      ],
    }).compile();

    app = moduleFixture.createNestApplication();    
    await app.init();

    httpServer = app.getHttpServer();
    dbConnection = moduleFixture.get<DatabaseService>(DatabaseService).getConnection();
    redisCacheService = moduleFixture.get<RedisCacheService>(RedisCacheService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    fixture = new Fixture(dbConnection, redisCacheService, configService);
  });

  beforeEach(async () => {
    user = await fixture.createUser();
    authorization = await fixture.login(user);
    design = await fixture.createDesign(user);
    cartItem = await fixture.createCartItem(user, design);
  });

  afterEach(async() => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('designs').deleteMany({});
    await dbConnection.collection('cartitems').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should fail when invalid id is sent', async () => {        
    const response = await request(httpServer)
      .delete(`/carts/${1}`)
      .set('authorization', authorization)
      .send();

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    expect(response.body).to.deep.include({
      success: false,
      message: '"id" is not a valid uuid'
    });
  });

  it('should fail when cartItem is not found', async () => {   
    const id = cartItem._id.toString().split('').reverse().join('');  
               
    const response = await request(httpServer)
      .delete(`/carts/${id}`)
      .set('authorization', authorization)
      .send();   

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);      
    expect(response.body).to.deep.include({
      success: false,
      message: 'CartItem not found'
    });
  });

  it('should fail when access is unauthorized', async () => {    
    const newUser: any = await fixture.createUser({ email: 'new@mail.com', phone: '1234566789'});
    const newAuthorization = await fixture.login(newUser);

    const response = await request(httpServer)
      .delete(`/carts/${cartItem._id}`)
      .set('authorization', newAuthorization)
      .send({ quantity: 5 })   

    expect(response.status).to.equal(HttpStatus.UNAUTHORIZED);      
    expect(response.body.message).to.equal('You are not authorized');
  });

  it('should update the cart item successfully', async () => {        
    const response = await request(httpServer)
      .delete(`/carts/${cartItem._id}`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.message).to.equal('Cart item deleted successfully');
  });
});