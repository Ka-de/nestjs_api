import * as Joi from 'joi';

export const MaterialValidator = Joi.object({
  fabric: Joi.string().required(),
  colors: Joi.array().items(Joi.object({
    value: Joi.string().required(),
    images: Joi.array().items(Joi.string()).min(1).required()
  })).min(1).required(),
  sizes: Joi.array().items(Joi.object({
    value: Joi.string().required(),
    price: Joi.number().positive().min(1).required()
  })).min(1).required()
});
