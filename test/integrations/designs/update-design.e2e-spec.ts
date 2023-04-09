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
import { createDesignStub } from '../../stubs/design.stubs';

describe('Update Design', () => {
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
    await dbConnection.collection('properties').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should fail when invalid id is sent', async () => {        
    const response = await request(httpServer)
      .patch(`/designs/${1}`)
      .set('authorization', authorization);

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    expect(response.body).to.deep.include({
      success: false,
      message: '"id" is not a valid uuid'
    });
  });

  it('should fail when design is not found', async () => {   
    const id = design._id.toString().split('').reverse().join('');  
               
    const response = await request(httpServer)
      .patch(`/designs/${id}`)
      .set('authorization', authorization);      

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);      
    expect(response.body).to.deep.include({
      success: false,
      message: 'Design not found'
    });
  });

  it('should fail to update the design when user is not the owner', async () => {   
    const newUser: any = await fixture.createUser({ email: 'user@mail.com', phone: '12234567899' });
    const newauthorization = await fixture.login(newUser);

    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', newauthorization);

    expect(response.status).to.equal(HttpStatus.UNAUTHORIZED);      
    expect(response.body).to.deep.include({
      success: false,
      message: 'You are not authorized'
    });
  });

  it('should fail when empty materials is provided', async () => {
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({ materials: [] });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials" must contain at least 1 items'
    });
  });

  it('should fail when materials fabric is not provided', async () => {
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({ materials: [{}] });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].fabric" is required'
    });
  });

  it('should fail when materials colors is not provided', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].colors" is required'
    });
  });

  it('should fail when no materials colors is provided', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric,
          colors: []
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].colors" must contain at least 1 items'
    });
  });

  it('should fail when materials colors value is not provided', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric,
          colors: [{}]
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].colors[0].value" is required'
    });
  });

  it('should fail when materials colors images is not provided', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric,
          colors: [{
            value: materials[0].colors[0].value
          }]
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].colors[0].images" is required'
    });
  });

  it('should fail when no materials colors images is provided', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric,
          colors: [{
            value: materials[0].colors[0].value,
            images: []
          }]
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].colors[0].images" must contain at least 1 items'
    });
  });

  it('should fail when materials sizes is not provided', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric,
          colors: materials[0].colors
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].sizes" is required'
    });
  });

  it('should fail when no materials sizes is provided', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric,
          colors: materials[0].colors,
          sizes: []
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].sizes" must contain at least 1 items'
    });
  });

  it('should fail when materials sizes value is not provided', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric,
          colors: materials[0].colors,
          sizes: [{}]
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].sizes[0].value" is required'
    });
  });

  it('should fail when materials sizes price is not provided', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric,
          colors: materials[0].colors,
          sizes: [{
            value: materials[0].sizes[0].value
          }]
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].sizes[0].price" is required'
    });
  });

  it('should fail when invalid materials sizes price is provided', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric,
          colors: materials[0].colors,
          sizes: [{
            value: materials[0].sizes[0].value,
            price: '2e'
          }]
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].sizes[0].price" must be a number'
    });
  });

  it('should fail when materials sizes price provided less than required', async () => {
    const { materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        materials: [{
          fabric: materials[0].fabric,
          colors: materials[0].colors,
          sizes: [{
            value: materials[0].sizes[0].value,
            price: 0
          }]
        }]
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].sizes[0].price" must be a positive number'
    });
  });

  it('should fail when invalid active is provided', async () => {
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({
        active: 'something'
      });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"active" must be a boolean'
    });
  });

  it('should succeed when the data sent is valid', async () => {
    const response = await request(httpServer)
      .patch(`/designs/${design._id}`)
      .set('authorization', authorization)
      .send({ title: 'Renamed Design', active: true });

    expect(response.status).to.equal(HttpStatus.OK);    
    expect(response.body.payload).deep.includes({ title: 'Renamed Design', active: true });
  });
});