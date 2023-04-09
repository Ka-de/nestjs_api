import * as Joi from 'joi';
import { ListValidator } from '../../../shared/list.validator';
import { TransactionActions } from '../dto/transaction.actions';
import { TransactionPlatforms } from '../dto/transaction.platforms';
import { TransactionStatus } from '../dto/transaction.status';
import { TransactionTypes } from '../dto/transaction.types';

export const ListTransactionsValidator = Joi.object({
  ...ListValidator,
  minAmount: Joi.number().positive().max(Joi.ref('maxAmount')),
  maxAmount: Joi.number().positive(),
  type: Joi.string().valid(...Object.values(TransactionTypes)),
  action: Joi.string().valid(...Object.values(TransactionActions)),
  status: Joi.string().valid(...Object.values(TransactionStatus)),
  platform: Joi.string().valid(...Object.values(TransactionPlatforms))
});
