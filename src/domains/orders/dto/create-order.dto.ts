import { ApiProperty } from "@nestjs/swagger";
import { TransactionPlatforms } from "../../transactions/dto/transaction.platforms";
import { Delivery } from "./delivery";
import { PickupEnum } from "./pickup.enum";

export class CreateOrderDto {
    @ApiProperty({ description: 'The delivery details', required: true, enum: PickupEnum })
    delivery: Delivery;

    @ApiProperty({ description: 'The platform of payment' })
    platform: TransactionPlatforms;

    @ApiProperty({ description: 'The referrence of payment' })
    reference?: string;
}
