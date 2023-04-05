import * as Joi from 'joi';
import { AccessRights } from '../../../shared/access.right';

export const UpdateUserValidator = Joi.object({
  verified: Joi.boolean()
});
