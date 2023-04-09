import { ApiProperty } from "@nestjs/swagger";
import { TransactionActions } from "./transaction.actions";
import { TransactionPlatforms } from "./transaction.platforms";
import { TransactionTypes } from "./transaction.types";

export class CreateTransactionDto {
  @ApiProperty({ description: 'Title of the transaction', required: true })
  title: string;

  @ApiProperty({ description: 'Amount of the transaction', required: true })
  amount: number;

  @ApiProperty({ description: 'The action of transaction', required: true, enum: TransactionActions })
  action: TransactionActions;

  @ApiProperty({ description: 'The type of transaction', required: true, enum: TransactionTypes })
  type: TransactionTypes;

  @ApiProperty({ description: 'The platform the transaction is performed on', required: true, enum: TransactionPlatforms })
  platform: TransactionPlatforms;

  @ApiProperty({ description: 'The Item that is being transacted', required: true })
  item?: string;

  @ApiProperty({ description: 'The identifier of the transaction on the platform' })
  reference?: string;
}
