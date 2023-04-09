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
import { TransactionActions } from '../../../src/domains/transactions/dto/transaction.actions';

describe('Get Wallet', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let user: any;
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
    await fixture.requestPassword(user.email);
  });

  afterEach(async() => {
    await dbConnection.collection('users').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should main balance as 0 when empty', async () => {        
    const response = await request(httpServer)
      .get('/wallets')
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);          
    expect(response.body.payload).to.deep.include({
      main: 0
    });
  });

  it('should the accurate wallet balance', async () => {  
    await fixture.updateWallet(user, 5000, TransactionActions.CREDIT, 5000);      
    const response = await request(httpServer)
      .get('/wallets')
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.OK);          
    expect(response.body.payload).to.deep.include({
      main: 5000
    });
  });
});