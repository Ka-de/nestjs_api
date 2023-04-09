import { ApiProperty } from "@nestjs/swagger";
import { TransactionPlatforms } from "../../transactions/dto/transaction.platforms";

export class Payment {
    @ApiProperty({ description: 'The amount of payment' })
    amount: number;

    @ApiProperty({ description: 'The platform of payment' })
    platform: TransactionPlatforms;

    @ApiProperty({ description: 'The referrence of payment' })
    referrence: string;
}