import { ApiProperty } from "@nestjs/swagger";
import { ClientSession } from "mongoose";
import { TransactionActions } from "../../transactions/dto/transaction.actions";

export class WalletTransaction {
  @ApiProperty({ description: 'Id of user', required: true })
  userId: string;

  @ApiProperty({ description: 'Amount of transaction', required: true })
  amount: number;

  @ApiProperty({ description: 'Action of transaction', required: true })
  action: TransactionActions;

  @ApiProperty({ description: 'Item of transaction', required: true })
  item: string;

  @ApiProperty({})
  session?: ClientSession;
}
