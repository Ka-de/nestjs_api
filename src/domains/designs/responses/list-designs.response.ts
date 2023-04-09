import { ApiProperty, PickType } from "@nestjs/swagger";
import { ResponseSchema } from "../../../shared/response.schema";
import { Design } from "../entities/design.entity";

export class ListDesignsResponse extends PickType(ResponseSchema<Design[]>, ['payload', 'timestamp', 'success']){
  @ApiProperty({ description: 'The payload of the response', type: [Design] })
  payload?: Design[];
}