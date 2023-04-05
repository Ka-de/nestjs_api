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
