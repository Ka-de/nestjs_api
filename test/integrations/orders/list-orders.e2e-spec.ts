import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../../src/database/database.service';
import { AppModule } from '../../../src/app.module';
import { Fixture } from '../../fixture';
import { RedisCacheService } from '../../../src/redis-cache/redis-cache.service';
import { RedisCacheKeys } from '../../../src/redis-cache/redis-cache.keys';
import { SortEnum } from '../../../src/shared/sort.enum';
import { ConfigService } from '@nestjs/config';
import { expect } from 'chai';
import { AccessRights } from '../../../src/shared/access.right';

describe('List Orders', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let redisCacheService: RedisCacheService
  let user: any;
  let authorization: string;
  let design: any;
  let order: any;
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
    await redisCacheService.del(RedisCacheKeys.LIST_ORDERS, true);
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

  it('should get 1 order', async () => {        
    const response = await request(httpServer)
      .get(`/orders`)
      .set('authorization', authorization);   
    
    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
  });

  it('should get 2 orders', async () => {  
    await fixture.createOrder(user, design);          
    const response = await request(httpServer)
      .get(`/orders`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(2);
  });

  it('should get reverse orders when sort is asc', async () => {  
    await fixture.createOrder(user, design);          
    const response = await request(httpServer)
      .get(`/orders?sort=${SortEnum.asc}`)
      .set('authorization', authorization);      
    
    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(2);
    expect(response.body.payload[0]._id).to.equal(order._id);
  });

  it('should get 1 order when limit is 1', async () => {  
    await fixture.createOrder(user, design);          
    const response = await request(httpServer)
      .get(`/orders?limit=1`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
  });

  it('should get second order when offset is 1', async () => {  
    await fixture.createOrder(user, design);          
    const response = await request(httpServer)
      .get(`/orders?limit=1&offset=1`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
    expect(response.body.payload[0]._id).to.equal(order._id);
  });

  it('should get only searched orders for client', async () => {  
    const newUser: any = await fixture.createUser({ email: 'some@mail.com', phone: '11111111111' });
    const newDesign: any = await fixture.createDesign(newUser);
    await fixture.createOrder(user, newDesign);          
    const response = await request(httpServer)
      .get(`/orders?clientId=${user._id}`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(2);
    expect(response.body.payload[0].clientId).to.equal(user._id);
  });

  it('should get only searched orders for designer', async () => {  
    const newUser: any = await fixture.createUser({ email: 'some@mail.com', phone: '11111111111' });
    const newDesign: any = await fixture.createDesign(newUser);
    await fixture.createOrder(user, newDesign);          
    const response = await request(httpServer)
      .get(`/orders?designerId=${newUser._id}`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
    expect(response.body.payload[0].designerId).to.equal(newUser._id);
  });
});