import { ApiProperty } from "@nestjs/swagger";

export class Color {
    @ApiProperty({ description: 'The value of the color' })
    value: string;

    @ApiProperty({ description: 'The images of the design in the color', minimum: 1, maximum: 2 })
    images: string[];

    @ApiProperty({ description: 'The id of the color' })
    _id?: string;
}