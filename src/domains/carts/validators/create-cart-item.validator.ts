import * as Joi from 'joi';
import { SizeEnum } from 'src/domains/designs/dto/size.enum';

export const CreateCartItemValidator = Joi.object({
  designId: Joi.string().required(),
  materialId: Joi.string().required(),
  sizeId: Joi.string().required(),
  colorId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required()
});
