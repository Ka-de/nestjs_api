import { Design } from "../../src/domains/designs/entities/design.entity";
import { CreateCartItemDto } from "../../src/domains/carts/dto/create-cart-item.dto";
import { CartItem } from "src/domains/carts/entities/cartitem.entity";

export const createCartItemStub = (design: Design): CreateCartItemDto => ({
  designId: design._id,
  materialId: design.materials[0]._id,
  sizeId: design.materials[0].sizes[0]._id,
  colorId: design.materials[0].colors[0]._id,
  quantity: 1
});

export const cartItemStub = (design: Design): Partial<CartItem> => ({
  ...createCartItemStub(design)
});