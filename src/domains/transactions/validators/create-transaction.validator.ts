import * as Joi from 'joi';
import { IdValidator } from '../../../shared/id.validator';
import { TransactionActions } from '../dto/transaction.actions';
import { TransactionPlatforms } from '../dto/transaction.platforms';
import { TransactionTypes } from '../dto/transaction.types';

export const CreateTransactionValidator = Joi.object({
  title: Joi.string().required(),
  amount: Joi.number().positive().required(),
  userId: Joi.string().required(),
  action: Joi.string().required().valid(...Object.values(TransactionActions)),
  type: Joi.string().required().valid(...Object.values(TransactionTypes)),
  item: IdValidator('item'),
  platform: Joi.string().required(),
  reference: Joi.alternatives().conditional('platform', [
    { is: TransactionPlatforms.WALLET, then: Joi.string(), otherwise: Joi.string().required() }
  ])
});
