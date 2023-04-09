import { ApiProperty, PickType } from "@nestjs/swagger";
import { ResponseSchema } from "../../../shared/response.schema";
import { CartItem } from "../entities/cartitem.entity";


export class GetCartItemResponse extends PickType(ResponseSchema<CartItem>, ['payload', 'timestamp', 'success']){
  @ApiProperty({ description: 'The payload of the response', type: CartItem })
  payload?: CartItem;
}