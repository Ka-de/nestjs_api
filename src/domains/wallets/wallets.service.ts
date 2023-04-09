import { HttpException, HttpStatus, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { DatabaseService } from '../../database/database.service';
import { TransactionActions } from '../transactions/dto/transaction.actions';
import { TransactionPlatforms } from '../transactions/dto/transaction.platforms';
import { TransactionTypes } from '../transactions/dto/transaction.types';
import { TransactionsService } from '../transactions/transactions.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { Wallet } from './dto/wallet';
import { WalletTransaction } from './dto/wallet-transaction';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(User.name) public readonly userModel: Model<UserDocument>,
    private transactionsService: TransactionsService,
    private databaseService: DatabaseService,
    private configService: ConfigService
  ) { }

  async updateWallet(
    walletTransaction: WalletTransaction
  ) {
    const { userId, action, amount, session } = walletTransaction;    
    
    if (!userId) throw new HttpException('"userId" is required', HttpStatus.BAD_REQUEST);
    if (!action) throw new HttpException('"action" is required', HttpStatus.BAD_REQUEST);
    if (!amount) throw new HttpException('"amount" is required', HttpStatus.BAD_REQUEST);

    if (this.databaseService.replicated && !session) throw new HttpException('"session" is required', HttpStatus.BAD_REQUEST);

    const { payload: { main } } = await this.getWallet(userId, session);
    const balance = action === TransactionActions.CREDIT 
      ? main  + amount
      : main - amount;    
        
    if (balance < 0) {      
      throw new HttpException('Insufficient Fund', HttpStatus.NOT_IMPLEMENTED);
    }    

    const transaction = await this.transactionsService.createTransaction(
      {
        amount: amount,
        action: action,
        platform: TransactionPlatforms.WALLET,
        type: TransactionTypes.WALLET,
        title: 'Credit Wallet'
      },
      userId,
    );
    await this.userModel.findByIdAndUpdate(userId, { $set: { 'wallet.main': balance } })
      .session(session);
      
    return transaction;
  }

  async getWallet(
    _id: string,
    session?: ClientSession
  ) {
    const user = await this.userModel.findOne({ _id, hidden: false }).session(session);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = user.get('wallet') as Wallet;    
    return { success: true, payload: wallet };
  }
}
