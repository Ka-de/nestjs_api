import { Collection, Connection } from 'mongoose';
import { createUserStub } from './stubs/user.stubs';
import { v4 as uuidv4 } from 'uuid';
import { RedisCacheKeys } from '../src/redis-cache/redis-cache.keys';
import { RedisCacheService } from '../src/redis-cache/redis-cache.service';
import { User } from '../src/domains/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createDesignStub } from './stubs/design.stubs';
import { Design } from '../src/domains/designs/entities/design.entity';
import { Transaction } from '../src/domains/transactions/entities/transaction.entity';
import { createTransactionStub } from './stubs/transaction.stubs';
import { TransactionActions } from '../src/domains/transactions/dto/transaction.actions';
import { TransactionTypes } from '../src/domains/transactions/dto/transaction.types';
import { Order } from '../src/domains/orders/entities/order.entity';
import { createOrderStub, jobStub } from './stubs/order.stubs';
import { createCartItemStub } from './stubs/cartItem.stub';
import { CartItem } from '../src/domains/carts/entities/cartitem.entity';
import { createNotificationStub, notificationStub } from './stubs/notification.stub';

export class Fixture {
  readonly userCollection: Collection;
  readonly designCollection: Collection;
  readonly transactionCollection: Collection;
  readonly cartCollection: Collection;
  readonly orderCollection: Collection;
  readonly notificationCollection: Collection;

  readonly password = '12345';
  readonly verificationCode = uuidv4();
  image: string;

  getImage(){
    const imagePath = join(__dirname, 'sample.png');
    const imageData = readFileSync(imagePath).toString('base64');
    const imageBase64 = `data:image/png;base64,${imageData}`;
    return imageBase64;
  }

  constructor(
    private connection: Connection,
    private redisCacheService: RedisCacheService,
    private configService: ConfigService
  ){
    this.userCollection = this.connection.collection('users');
    this.designCollection = this.connection.collection('designs');
    this.transactionCollection = this.connection.collection('transactions');
    this.orderCollection = this.connection.collection('orders');
    this.cartCollection = this.connection.collection('cartitems');
    this.notificationCollection = this.connection.collection('notifications');

    this.image = this.getImage();
  }

  async createUser(data: Partial<User> = {}){
    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();

    await this.userCollection.insertOne({ ...createUserStub, ...data, _id: id as any, createdAt, updatedAt, hidden: false });
    const user = await this.userCollection.findOne({ _id: id });

    return user;
  }

  async requestPassword(email: string) {
    const key = `${RedisCacheKeys.AUTH_PASS}:${email}`;
    await this.redisCacheService.set(key, this.password, 5 * 60);
  }

  async requestVerification(_id: string, email: string) {
    const key = `${RedisCacheKeys.VERIFY_USER}:${this.verificationCode}`;
    await this.redisCacheService.set(key, { _id, email}, 5 * 60);
  }

  async login(user: { _id: string, email: string}) {
    await this.requestPassword(user.email);
    const authorization = sign(user._id, this.configService.get('SECRET'));
    return 'Bearer ' + authorization;
  }

  async createDesign(user: User, data: Partial<Design> = {}){
    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();
    const newDesignStub = createDesignStub(this.image);
    newDesignStub.materials[0]._id = uuidv4();
    newDesignStub.materials[0].sizes[0]._id = uuidv4();
    newDesignStub.materials[0].colors[0]._id = uuidv4();

    await this.designCollection.insertOne({ 
      ...newDesignStub, 
      ...data, 
      _id: id as any, 
      designerId: user._id,
      createdAt, 
      updatedAt, 
      hidden: false
    });

    const design = await this.designCollection.findOne({ _id: id });     
    return design;
  }

  async createTransaction(user: User, item = uuidv4(), data: Partial<Transaction> = {}) {
    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();

    await this.transactionCollection.insertOne({ ...createTransactionStub, item, ...data, _id: id as any, createdAt, updatedAt, hidden: false, userId: user._id });

    const transaction = await this.transactionCollection.findOne({ _id: id });
    return transaction;
  }

  async updateWallet(user: User, amount: number, action: TransactionActions, balance: number){
    const type = TransactionTypes.WALLET;

    const transaction = await this.createTransaction(user, '', { amount, action, type, userId: user._id, })
    await this.userCollection.findOneAndUpdate({ _id: user._id }, { $set: { 'wallet.main': balance }});    
    
    return transaction;
  }

  async createCartItem(user: User, design: Design, data: Partial<CartItem> = {}){
    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();

    await this.cartCollection.insertOne({ ...createCartItemStub(design), ...data, _id: id as any, clientId: user._id, createdAt, updatedAt });
    const cartItem = await this.cartCollection.findOne({ _id: id });    
    
    return cartItem;
  }

  async createOrder(user: User, design: Design, data: Partial<Order> = {}){
    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();

    await this.createCartItem(user, design);
    const job = jobStub(this.image, design._id);

    await this.orderCollection.insertOne({ 
      job,
      ...createOrderStub, 
      ...data, 
      _id: id as any, 
      clientId: user._id,
      designerId: design.designerId,
      createdAt, 
      updatedAt, 
      hidden: false
    });

    const order = await this.orderCollection.findOne({ _id: id });
    return order;
  }

  async createNotification(user: User, data: Partial<Notification> = {}){
    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();

    await this.notificationCollection.insertOne({ 
      ...createNotificationStub, 
      ...data, 
      _id: id as any, 
      userId: user._id,
      createdAt, 
      updatedAt, 
      hidden: false
    });

    const notification = await this.notificationCollection.findOne({ _id: id });     
    return notification;
  }
}
