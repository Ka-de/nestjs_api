import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../../src/database/database.service';
import { AppModule } from '../../../src/app.module';
import { Fixture } from '../../fixture';
import { RedisCacheService } from '../../../src/redis-cache/redis-cache.service';
import { ConfigService } from '@nestjs/config';
import { WalletsService } from '../../../src/domains/wallets/wallets.service';
import { strict as assert } from 'node:assert';
import { expect } from 'chai';
import { TransactionActions } from '../../../src/domains/transactions/dto/transaction.actions';
import { TransactionTypes } from '../../../src/domains/transactions/dto/transaction.types';

describe('Update Wallet()', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let user: any;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService;
  let walletService: WalletsService;
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
    walletService = moduleFixture.get<WalletsService>(WalletsService);
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
  });

  beforeEach(async () => {
    user = await fixture.createUser();
  });

  afterEach(async() => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('transactions').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should fail when no userId is provided', async () => {    
    await assert.rejects(databaseService.transaction(session => walletService.updateWallet({session} as any)), { message: '"userId" is required' });
  });

  it('should fail when no action is provided', async () => {    
    await assert.rejects(databaseService.transaction(session => walletService.updateWallet({ userId: user._id, session } as any)), { message: '"action" is required' });
  });

  it('should fail when no amount is provided', async () => {    
    await assert.rejects(databaseService.transaction(session => walletService.updateWallet({ userId: user._id, action: TransactionActions.CREDIT, session } as any)), { message: '"amount" is required' });
  });

  it('should fail when fund is insufficient', async () => {    
    await assert.rejects(databaseService.transaction(session => walletService.updateWallet({ userId: user._id, action: TransactionActions.DEBIT, amount: 5000, item: '', session })), { message: 'Insufficient Fund' });
  });

  it('should succeed when all is valid', async () => {    
    const transaction = await databaseService.transaction(session => walletService.updateWallet({ userId: user._id, action: TransactionActions.CREDIT, amount: 5000, item: '', session }));
    expect(transaction).to.deep.include({ type: TransactionTypes.WALLET });
  });
});
