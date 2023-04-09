import { ApiProperty } from "@nestjs/swagger";

export class UpdateCartItemDto {
    @ApiProperty({ description: 'The number of items within this job' })
    quantity: number;
}