import * as Joi from 'joi';
import { TransactionPlatforms } from '../../transactions/dto/transaction.platforms';
import { SizeEnum } from '../../designs/dto/size.enum';
import { PickupEnum } from '../dto/pickup.enum';

const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,7}$/m;

export const CreateOrderValidator = Joi.object({
  delivery: Joi.object({
    pickup: Joi.string().valid(...Object.keys(PickupEnum)).required(),
    address: Joi.string().required(),
    phone: Joi.string().required().regex(phoneRegex).error((e) => {    
        return new Error('"delivery.phone" must be a valid phone number')
      })
  }).required(),
  platform: Joi.string().valid(...Object.keys(TransactionPlatforms)).required(),
  reference: Joi.alternatives().conditional('platform', [
    { is: TransactionPlatforms.WALLET, then: Joi.string(), otherwise: Joi.string().required() }
  ])
});
