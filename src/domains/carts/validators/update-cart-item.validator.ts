import * as Joi from 'joi';

export const UpdateCartItemValidator = Joi.object({
  quantity: Joi.number().integer().min(1)
});
