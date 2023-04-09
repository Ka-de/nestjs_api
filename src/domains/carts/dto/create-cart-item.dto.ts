import { ApiProperty } from "@nestjs/swagger";

export class CreateCartItemDto {
    @ApiProperty({ description: 'The id of the design to be used' })
    designId: string;

    @ApiProperty({ description: 'The id of the material' })
    materialId: string;

    @ApiProperty({ description: 'The id of the size' })
    sizeId: string;

    @ApiProperty({ description: 'The id of the color' })
    colorId: string;

    @ApiProperty({ description: 'The number of items within this job' })
    quantity: number;
}