import * as Joi from 'joi';
import { MaterialValidator } from './material.validator';

export const CreateDesignValidator = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  materials: Joi.array().items(MaterialValidator).min(1).required(),
  duration: Joi.number().integer().positive().min(1).required()
});
