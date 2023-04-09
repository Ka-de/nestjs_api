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
import { Storage } from '../../../src/shared/storage';
import { SortEnum } from '../../../src/shared/sort.enum';

describe('List cart items', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService;
  let user = null;
  let design = null;
  let cartItem = null;
  let authorization: string;

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
    fixture = new Fixture(dbConnection, redisCacheService, configService, );
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
    Storage.reset();
  });

  it('should get 1 cart item', async () => {        
    const response = await request(httpServer)
      .get(`/carts`)
      .set('authorization', authorization);   
    
    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
  });

  it('should get 2 cartitems', async () => {  
    await fixture.createCartItem(user, design);      
    const response = await request(httpServer)
      .get(`/carts`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(2);
  });

  it('should get reverse cartitems when sort is asc', async () => {  
    await fixture.createCartItem(user, design);      
    const response = await request(httpServer)
      .get(`/carts?sort=${SortEnum.asc}`)
      .set('authorization', authorization);      
    
    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(2);
    expect(response.body.payload[0]._id).to.equal(cartItem._id);
  });

  it('should get 1 cartitem when limit is 1', async () => {  
    await fixture.createCartItem(user, design);      
    const response = await request(httpServer)
      .get(`/carts?limit=1`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
  });

  it('should get second cartitem when offset is 1', async () => {  
    await fixture.createCartItem(user, design);      
    const response = await request(httpServer)
      .get(`/carts?limit=1&offset=1`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
    expect(response.body.payload[0]._id).to.equal(cartItem._id);
  });
});