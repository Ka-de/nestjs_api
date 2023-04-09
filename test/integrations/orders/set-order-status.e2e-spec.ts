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
import { AccessRights } from '../../../src/shared/access.right';
import { OrderState } from '../../../src/domains/orders/dto/order.state';

describe('Set Order Status', () => {
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
    user = await fixture.createUser({ rights: [AccessRights.ADMIN] });
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
      .patch(`/orders/${1}`)
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
      .patch(`/orders/${id}`)
      .set('authorization', authorization);       

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);      
    expect(response.body).to.deep.include({
      success: false,
      message: 'Order not found'
    });
  });

  it('should fail when invalid status is provided', async () => {        
    const response = await request(httpServer)
      .patch(`/orders/${order._id}`)
      .send({ status: 'status' })
      .set('authorization', authorization);    
    
    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    expect(response.body.message).to.equal('"value" must be one of [ORDERED, PROCESSING, IN_TRANSIT, DELIVERED]');
  });

  it('should update order status', async () => {        
    const response = await request(httpServer)
      .patch(`/orders/${order._id}`)
      .send({ status: OrderState.DELIVERED })
      .set('authorization', authorization);    
    
    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.message).to.equal('Order status updated');
  });
});