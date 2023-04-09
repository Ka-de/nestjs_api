import { ApiProperty } from "@nestjs/swagger";
import { PickupEnum } from "./pickup.enum";

export class Delivery {
    @ApiProperty({ description: 'The delivery pickup type', enum: PickupEnum })
    pickup: PickupEnum;

    @ApiProperty({ description: 'The delivery address' })
    address: string;

    @ApiProperty({ description: 'The delivery phone' })
    phone: string;

    @ApiProperty({ description: 'The delivery cost' })
    cost?: number;
}