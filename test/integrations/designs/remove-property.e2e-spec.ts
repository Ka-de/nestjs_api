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

describe('Remove Design', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let user: any;
  let design: any;
  let authorization: any;
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
    authorization = await fixture.login(user);
  });

  afterEach(async() => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('designs').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should fail when invalid id is sent', async () => {        
    const response = await request(httpServer)
      .delete(`/designs/${1}`)
      .set('authorization', authorization)
      .set('password', fixture.password);

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    expect(response.body).to.deep.include({
      success: false,
      message: '"id" is not a valid uuid'
    });
  });

  it('should fail when design is not found', async () => {   
    const id = design._id.toString().split('').reverse().join('');  
               
    const response = await request(httpServer)
      .delete(`/designs/${id}`)
      .set('authorization', authorization)
      .set('password', fixture.password);      

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);      
    expect(response.body).to.deep.include({
      success: false,
      message: 'Design not found'
    });
  });

  it('should fail to remove the design when user is not the owner', async () => {   
    const newUser: any = await fixture.createUser({ email: 'user@mail.com', phone: '12234567899' });
    const newauthorization = await fixture.login(newUser);

    const response = await request(httpServer)
      .delete(`/designs/${design._id}`)
      .set('authorization', newauthorization)
      .set('password', fixture.password);

    expect(response.status).to.equal(HttpStatus.UNAUTHORIZED);      
    expect(response.body).to.deep.include({
      success: false,
      message: 'You are not authorized'
    });
  });

  it('should remove the design', async () => {        
    const response = await request(httpServer)
      .delete(`/designs/${design._id}`)
      .set('authorization', authorization)
      .set('password', fixture.password);

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body).to.deep.include({
      success: true,
    });
  });
});