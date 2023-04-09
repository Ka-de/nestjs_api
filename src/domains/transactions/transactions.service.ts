import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { SortEnum } from '../../shared/sort.enum';
import { MailService } from '../../mail/mail.service';
import { RedisCacheService } from '../../redis-cache/redis-cache.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction, TransactionDocument } from './entities/transaction.entity';
import { ListTransactionsResponse } from './responses/list-transactions.response';
import { TransactionResponse } from './responses/transaction.response';
import { TransactionActions } from './dto/transaction.actions';
import { TransactionTypes } from './dto/transaction.types';
import { TransactionStatus } from './dto/transaction.status';
import { TransactionPlatforms } from './dto/transaction.platforms';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ){}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    userId: string,
    session?: ClientSession
  ) {    
    const [transaction] = await this.transactionModel.insertMany({...createTransactionDto, userId }, { session });      
    return Transaction.toResponse(transaction) as Transaction;
  }

  async listTransactions(
    limit = this.configService.get<number>('PAGE_LIMIT'),
    offset = 0,
    sort = SortEnum.desc,
    minDate = new Date(1901), 
    maxDate = new Date(),
    options: {
      minAmount?: number, 
      maxAmount?: number,
      type?: TransactionTypes,
      action?: TransactionActions,
      status?: TransactionStatus,
      platform?: TransactionPlatforms
    }
  ) {    
    let { type, action, status, platform, minAmount = Number.MIN_VALUE, maxAmount = Number.MAX_VALUE } = options;

    minDate = new Date(Number(minDate));
    maxDate = new Date(Number(maxDate));
    minAmount = Number(minAmount);
    maxAmount = Number(maxAmount);
    
    let query: any = {
      hidden: false,
      $and: [
        { createdAt: { '$gte': minDate, '$lte': maxDate } },
        { amount : { '$gte': minAmount, '$lte': maxAmount } }
      ],
    };    

    if (action) query.action = action;
    if (type) query.type = type;
    if (status) query.status = status;
    if (platform) query.platform = platform;
    
    const transactions = await this.transactionModel.find(query)
      .sort({ 'createdAt': sort })
      .limit(limit)
      .skip(offset * limit);
      
    return { success: true, payload: transactions.map(transaction => Transaction.toResponse(transaction)) } as ListTransactionsResponse;
  }

  async getTransaction(id: string, session: ClientSession = null) {
    const transaction = await this.transactionModel.findById(id).session(session);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return { success: true, payload: Transaction.toResponse(transaction) } as TransactionResponse;
  }
}
