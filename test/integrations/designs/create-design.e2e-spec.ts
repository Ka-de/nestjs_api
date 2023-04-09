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
import { Storage } from '../../../src/shared/storage';

describe('Create Design', () => {
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
  });

  afterEach(async () => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('designs').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
    Storage.reset();
  });

  it('should fail when title is not provided', async () => {
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({});

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"title" is required'
    });
  });

  it('should fail when description is not provided', async () => {
    const { title } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({ title });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"description" is required'
    });
  });

  it('should fail when materials is not provided', async () => {
    const { title, description } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({ title, description });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials" is required'
    });
  });

  it('should fail when no materials is provided', async () => {
    const { title, description } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({ title, description, materials: [] });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials" must contain at least 1 items'
    });
  });

  it('should fail when materials fabric is not provided', async () => {
    const { title, description } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({ title, description, materials: [{}] });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body).to.deep.include({
      success: false,
      message: '"materials[0].fabric" is required'
    });
  });

  it('should fail when materials colors is not provided', async () => {
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({
        title, description, materials: [{
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

  it('should fail when duration is not specified', async () => {
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({ title, description, materials });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);    
    expect(response.body.message).deep.includes('"duration" is required');
  });

  it('should fail when invalid duration is provided', async () => {
    const { title, description, materials } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({ title, description, materials, duration: -3 });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);    
    expect(response.body.message).deep.includes('"duration" must be a positive number');
  });

  it('should succeed when the data sent is valid', async () => {
    const { title, description, materials, duration } = createDesignStub(fixture.image);
    const response = await request(httpServer)
      .post(`/designs`)
      .set('authorization', authorization)
      .send({ title, description, materials, duration });

    expect(response.status).to.equal(HttpStatus.CREATED);    
    expect(response.body.payload).deep.includes({ title, description });
  });
});