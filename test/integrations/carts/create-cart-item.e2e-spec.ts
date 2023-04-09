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
import { createCartItemStub } from '../../stubs/cartItem.stub';

describe('Create cart item', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService;
  let user = null;
  let design = null;
  let authorization: string;

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
    fixture = new Fixture(dbConnection, redisCacheService, configService, );
  });

  beforeEach(async () => {
    user = await fixture.createUser();
    authorization = await fixture.login(user);
    design = await fixture.createDesign(user);
  });

  afterEach(async() => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('designs').deleteMany({});
    await dbConnection.collection('cartitems').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
    Storage.reset();
  });

  it('should fail when designId is not provided', async () => {
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send();   

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"designId" is required'
    });  
  });

  it('should fail when materialId is not provided', async () => {
    const { designId } = createCartItemStub(design);
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId });   

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"materialId" is required'
    });  
  });

  it('should fail when sizeId is not provided', async () => {
    const { designId, materialId } = createCartItemStub(design);
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId, materialId });   

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"sizeId" is required'
    });  
  });

  it('should fail when colorId is not provided', async () => {
    const { designId, materialId, sizeId } = createCartItemStub(design);    
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId, materialId, sizeId });   

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"colorId" is required'
    });  
  });

  it('should fail when quantity is not provided', async () => {
    const { designId, materialId, sizeId, colorId } = createCartItemStub(design);    
    
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId, materialId, sizeId, colorId });   

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"quantity" is required'
    });  
  });

  it('should fail when design does not exist', async () => {
    const { materialId, sizeId, colorId } = createCartItemStub(design);    
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId: 'design', materialId, sizeId, colorId, quantity: 5 });   

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);  
    expect(response.body).to.deep.include({
      success: false,
      message: 'Design not found'
    });  
  });

  it('should fail when material does not exist', async () => {
    const { designId, sizeId, colorId } = createCartItemStub(design);    
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId, materialId: 'materialId', sizeId, colorId, quantity: 5 });   

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);  
    expect(response.body).to.deep.include({
      success: false,
      message: 'Material not found'
    });  
  });

  it('should fail when size does not exist', async () => {
    const { designId, materialId, colorId } = createCartItemStub(design);    
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId, materialId, sizeId: 'sizeId', colorId, quantity: 5 });   

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);  
    expect(response.body).to.deep.include({
      success: false,
      message: 'Size not found'
    });  
  });

  it('should fail when color does not exist', async () => {
    const { designId, materialId, sizeId } = createCartItemStub(design);    
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId, materialId, sizeId, colorId: 'colorId', quantity: 5 });   

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);  
    expect(response.body).to.deep.include({
      success: false,
      message: 'Color not found'
    });  
  });

  it('should fail when invalid quantity is provided', async () => {
    const { designId, materialId, sizeId, colorId } = createCartItemStub(design);    
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId, materialId, sizeId, colorId, quantity: '34de' });   

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"quantity" must be a number'
    });  
  });

  it('should fail when item is already in cart', async () => {
    const { designId, materialId, sizeId, colorId } = createCartItemStub(design);  
    await fixture.createCartItem(user, design, { designId, materialId, sizeId, colorId });  
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId, materialId, sizeId, colorId, quantity: 4 });       
    
    expect(response.status).to.equal(HttpStatus.CONFLICT);  
    expect(response.body.message).to.equal('You already have this item in cart')
  });

  it('should succeed when all requirements are met', async () => {
    const { designId, materialId, sizeId, colorId } = createCartItemStub(design);    
    const response = await request(httpServer)
      .post('/carts')
      .set('authorization', authorization)
      .send({ designId, materialId, sizeId, colorId, quantity: 4 });       
    
    expect(response.status).to.equal(HttpStatus.CREATED);  
    expect(response.body.payload).to.deep.include({
      designId,
      materialId,
      sizeId, 
      colorId,
      quantity: 4
    });  
  });
});