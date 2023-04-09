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
import { SortEnum } from '../../../src/shared/sort.enum';
import { RedisCacheKeys } from '../../../src/redis-cache/redis-cache.keys';

describe('List Designs', () => {
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
    await redisCacheService.del(RedisCacheKeys.LIST_DESIGNS, true);
    user = await fixture.createUser();
    design = await fixture.createDesign(user);
    authorization = await fixture.login(user);
  });

  afterEach(async () => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('designs').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should get 1 design', async () => {        
    const response = await request(httpServer)
      .get(`/designs`);
    
    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
  });

  it('should get 2 designs', async () => {  
    await fixture.createDesign(user);      
    const response = await request(httpServer)
      .get(`/designs`);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(2);
  });

  it('should get reverse designs when sort is asc', async () => {  
    await fixture.createDesign(user);      
    const response = await request(httpServer)
      .get(`/designs?sort=${SortEnum.asc}`);      
    
    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(2);
    expect(response.body.payload[0]._id).to.equal(design._id);
  });

  it('should get 1 design when limit is 1', async () => {  
    await fixture.createDesign(user);      
    const response = await request(httpServer)
      .get(`/designs?limit=1`);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
  });

  it('should get second design when offset is 1', async () => {  
    await fixture.createDesign(user);      
    const response = await request(httpServer)
      .get(`/designs?limit=1&offset=1`);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
    expect(response.body.payload[0]._id).to.equal(design._id);
  });

  it('should get only searched designs', async () => {  
    await fixture.createDesign(user, { title: 'A new one', description: 'A new design description' });      
    const response = await request(httpServer)
      .get(`/designs?query=simp`);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
    expect(response.body.payload[0].title).to.equal('A design');
  });

  it('should get only designs by specified designer', async () => {  
    const newUser: any = await fixture.createUser({ email: 'new@mail.com', phone: '2222222222' })
    await fixture.createDesign(newUser);      
    const response = await request(httpServer)
      .get(`/designs?designerId=${user._id}`);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.success).to.equal(true);
    expect(response.body.payload.length).to.equal(1);
    expect(response.body.payload[0]._id).to.equal(design._id);
  });
});