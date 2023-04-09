import { ApiProperty } from "@nestjs/swagger";
import { Material } from "./material.dto";

export class CreateDesignDto {
    @ApiProperty({ description: 'Title of the design', required: true })
    title: string;

    @ApiProperty({ description: 'Description of the design', required: true })
    description: string;

    @ApiProperty({ description: 'Materials of the design', type: [Material], minItems: 1 })
    materials: Material[];

    @ApiProperty({ description: 'The number of days the sewing will take'})
    duration: number;
}
