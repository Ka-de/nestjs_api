import * as Joi from 'joi';
import { MaterialValidator } from './material.validator';

export const UpdateDesignValidator = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  active: Joi.boolean(),
  materials: Joi.array().items(MaterialValidator).min(1),
  duration: Joi.number().integer().positive().min(1)
});
