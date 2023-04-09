import * as Joi from 'joi';
import { AccessRights } from '../../../shared/access.right';

export const UpdateUserValidator = Joi.object({
  right: Joi.array().valid(...Object.values(AccessRights)),
  verified: Joi.boolean()
});
