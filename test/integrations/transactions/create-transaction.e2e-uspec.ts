import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../../src/database/database.service';
import { AppModule } from '../../../src/app.module';
import { Fixture } from '../../fixture';
import { RedisCacheService } from '../../../src/redis-cache/redis-cache.service';
import { ConfigService } from '@nestjs/config';
import { TransactionsService } from '../../../src/domains/transactions/transactions.service';
import { createTransactionStub, transactionStub } from '../../stubs/transaction.stubs';
import { strict as assert } from 'assert';
import { expect } from 'chai';

describe('Create Transaction()', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let user: any;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService;
  let transactionService: TransactionsService;
  let databaseService: DatabaseService;

  before(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        AppModule
      ],
    }).compile();

    app = moduleFixture.createNestApplication();    
    await app.init();

    dbConnection = moduleFixture.get<DatabaseService>(DatabaseService).getConnection();
    redisCacheService = moduleFixture.get<RedisCacheService>(RedisCacheService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    fixture = new Fixture(dbConnection, redisCacheService, configService);
    transactionService = moduleFixture.get<TransactionsService>(TransactionsService);
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
  });

  beforeEach(async () => {
    user = await fixture.createUser();
  });

  afterEach(async() => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('properties').deleteMany({});
    await dbConnection.collection('rents').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should fail when no amount is provided', async () => {    
    await assert.rejects(transactionService.createTransaction({} as any, user._id), { name: 'ValidationError' });
  });

  it('should fail when no title is provided', async () => {    
    const { amount } = createTransactionStub;
    await assert.rejects(transactionService.createTransaction({ amount } as any, user._id), { name: 'ValidationError' });
  });

  it('should fail when no userId is provided', async () => {    
    const { amount, title } = createTransactionStub;
    await assert.rejects(transactionService.createTransaction({ amount, title } as any, user._id), { name: 'ValidationError' });
  });

  it('should fail when no action is provided', async () => {    
    const { amount, title } = createTransactionStub;
    await assert.rejects(transactionService.createTransaction({ amount, title } as any, user._id), { name: 'ValidationError' });
  });

  it('should fail when no type is provided', async () => {    
    const { amount, title, action } = createTransactionStub;
    await assert.rejects(transactionService.createTransaction({ amount, title, action } as any, user._id), { name: 'ValidationError' });
  });

  it('should fail when no item is provided', async () => {    
    const { amount, title, action, type } = createTransactionStub;
    await assert.rejects(transactionService.createTransaction({ amount, title, action, type } as any, user._id), { name: 'ValidationError' });
  });

  it('should fail when no platform is provided', async () => {    
    const { amount, title, action, type } = createTransactionStub;
    await assert.rejects(transactionService.createTransaction({ amount, title, action, type, item: 'wslailejwlill' } as any, user._id), { name: 'ValidationError' });
  });

  it('should fail when invalid action is provided', async () => {    
    const { amount, title, platform, type, item } = createTransactionStub;    
    await assert.rejects(transactionService.createTransaction({ amount, title, platform, type, item, action: 'Sample' } as any, user._id), { name: 'ValidationError' });
  });

  it('should fail when invalid type is provided', async () => {    
    const { amount, title, platform, action, item } = createTransactionStub;    
    await assert.rejects(transactionService.createTransaction({ amount, title, platform, action, item, type: 'Sample' } as any, user._id), { name: 'ValidationError' });
  });

  it('should create transaction', async () => {
    const { amount, title, platform, action, type } = createTransactionStub;    
    const data = await transactionService.createTransaction({ amount, title, platform, action, item: 'oio80aieo31903', type }, user._id);    
    
    expect(data).to.deep.include(transactionStub);
  });
});
