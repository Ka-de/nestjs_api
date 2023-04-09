import { ApiProperty } from "@nestjs/swagger";
import { Color } from "./color.dto";
import { Size } from "./size.dto";

export class Material {
    @ApiProperty({ description: 'The fabric of the material' })
    fabric: string;

    @ApiProperty({ description: 'The colors of the material', type: [Color] })
    colors: Color[];

    @ApiProperty({ description: 'The Size of the material', type: [Size] })
    sizes: Size[];

    @ApiProperty({ description: 'The id of the material' })
    _id?: string;
}