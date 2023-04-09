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
import { createOrderStub } from '../../stubs/order.stubs';
import { TransactionPlatforms } from '../../../src/domains/transactions/dto/transaction.platforms';
import { TransactionActions } from '../../../src/domains/transactions/dto/transaction.actions';

describe('Create Order', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let user: any;
  let design: any;
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
  });

  afterEach(async () => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('designs').deleteMany({});
    await dbConnection.collection('orders').deleteMany({});
    await dbConnection.collection('cartitems').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
    Storage.reset();
  });

  it('should fail when delivery is not privided', async () => {
    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery" is required'
    });
  });

  it('should fail when delivery.pickup is not privided', async () => {
    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery: {} });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery.pickup" is required'
    });
  });

  it('should fail when invalid delivery.pickup is privided', async () => {
    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery: { pickup: 'pickup' } });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery.pickup" must be one of [STATION, HOME]'
    });
  });

  it('should fail when delivery.address is not privided', async () => {
    const { delivery: { pickup } } = createOrderStub;    

    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery: { pickup } });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery.address" is required'
    });
  });

  it('should fail when invalid delivery.phone is privided', async () => {
    const { delivery: { pickup, address } } = createOrderStub;    

    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery: { pickup, address } });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery.phone" must be a valid phone number'
    });
  });

  it('should fail when platform is not privided', async () => {
    const { delivery } = createOrderStub;    

    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"platform" is required'
    });
  });

  it('should fail when invalid platform is privided', async () => {
    const { delivery } = createOrderStub;    

    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery, platform: 'platform' });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"platform" must be one of [WALLET, PAYSTACK]'
    });
  });

  it('should fail when platform is not wallet and reference is not provided', async () => {
    const { delivery, platform } = createOrderStub;    

    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery, platform });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"reference" is required'
    });
  });

  it('should fail when cart is empty', async () => {
    const { delivery } = createOrderStub;    

    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery, platform: TransactionPlatforms.WALLET });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: 'Cart is empty'
    });
  });

  it('should fail when platform is wallet and wallet balance can not pay for order', async () => {
    const { delivery } = createOrderStub;    
    await fixture.createCartItem(user, design);

    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery, platform: TransactionPlatforms.WALLET });

    expect(response.status).to.equal(HttpStatus.NOT_IMPLEMENTED);
    expect(response.body).to.deep.include({
      success: false,
      message: 'Insufficient Fund'
    });
  });

  it('should succeed when valid data is provided and payment platform is not wallet', async () => {
    const { delivery, platform, reference } = createOrderStub;    
    await fixture.createCartItem(user, design);

    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery, platform, reference });

    expect(response.status).to.equal(HttpStatus.CREATED);
  });  

  it('should succeed when valid data is provided and payment platform is wallet', async () => {
    await fixture.updateWallet(user, 100000, TransactionActions.CREDIT, 100000);
    const { delivery } = createOrderStub;    
    await fixture.createCartItem(user, design);

    const response = await request(httpServer)
      .post(`/orders`)
      .set('authorization', authorization)
      .send({ delivery, platform: TransactionPlatforms.WALLET });

    expect(response.status).to.equal(HttpStatus.CREATED);
  });  
});