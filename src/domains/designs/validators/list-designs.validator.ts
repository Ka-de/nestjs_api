import * as Joi from 'joi';
import { ListValidator } from '../../../shared/list.validator';

export const ListDesignsValidator = Joi.object({
  ...ListValidator,
  query: Joi.string().default(''),
  designerId: Joi.string().default(''),
});
