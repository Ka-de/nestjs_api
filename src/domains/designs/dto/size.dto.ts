import { ApiProperty } from "@nestjs/swagger";
import { SizeEnum } from "./size.enum";

export class Size {
    @ApiProperty({ description: 'The value of the size', enum: SizeEnum })
    value: SizeEnum;

    @ApiProperty({ description: 'The price for the size', minimum: 1 })
    price: number;

    @ApiProperty({ description: 'The id of the material' })
    _id?: string;
}