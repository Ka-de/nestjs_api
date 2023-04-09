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

describe('Complete Order Job', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let user: any;
  let authorization: string;
  let design: any;
  let order: any;
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
    design = await fixture.createDesign(user);
    order = await fixture.createOrder(user, design);
    authorization = await fixture.login(user);
  });

  afterEach(async() => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('transactions').deleteMany({});
    await dbConnection.collection('cartitems').deleteMany({});
    await dbConnection.collection('designs').deleteMany({});
    await dbConnection.collection('orders').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should fail when invalid id is sent', async () => {        
    const response = await request(httpServer)
      .patch(`/orders/${1}/complete-job`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    expect(response.body).to.deep.include({
      success: false,
      message: '"id" is not a valid uuid'
    });
  });

  it('should fail when order is not found', async () => {   
    const id = order._id.toString().split('').reverse().join('');  
               
    const response = await request(httpServer)
      .patch(`/orders/${id}/complete-job`)
      .set('authorization', authorization);       

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);      
    expect(response.body).to.deep.include({
      success: false,
      message: 'Order not found'
    });
  });

  it('should fail when user did not make order', async () => {        
    const newUser: any = await fixture.createUser({ email: 'new@mail.com', phone: '1233456789' });
    const newAuthorization = await fixture.login(newUser);
    const response = await request(httpServer)
      .patch(`/orders/${order._id}/complete-job`)
      .set('authorization', newAuthorization);    
    
    expect(response.status).to.equal(HttpStatus.UNAUTHORIZED);      
    expect(response.body.message).to.equal('You are not authorized');
  });

  it('should cancel order successfully', async () => { 
    const response = await request(httpServer)
      .patch(`/orders/${order._id}/complete-job`)
      .set('authorization', authorization);    
    
    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.message).to.equal('Congrats, Job completed successfully');
  });
});