import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { v4 as uuidv4 } from 'uuid';
import { TransactionActions } from "../dto/transaction.actions";
import { TransactionPlatforms } from "../dto/transaction.platforms";
import { TransactionStatus } from "../dto/transaction.status";
import { TransactionTypes } from "../dto/transaction.types";

@Schema({ timestamps: true, versionKey: false })
export class Transaction {
  @ApiProperty({ description: 'The id of the transaction' })
  @Prop({ type: String, default: function getId(){
    return uuidv4();
  }})
  _id?: string;

  @ApiProperty({ description: 'The title of the transaction', required: true })
  @Prop({ required: [true, '"title" is required'] })
  title: string;

  @ApiProperty({ description: 'The id of the user', required: true })
  @Prop({ required: [true, '"userId" is required'] })
  userId: string;

  @ApiProperty({ description: 'The amount transacted', required: true })
  @Prop({ required: [true, '"amount" is required'] })
  amount: number;

  @ApiProperty({ description: 'The action of the transaction', required: true, enum: TransactionActions })
  @Prop({ type: String, required: [true, '"action" is required'], enum: TransactionActions })
  action: TransactionActions;

  @ApiProperty({ description: 'The type of transaction', required: true })
  @Prop({ type: String, required: [true, '"type" is required'], enum: TransactionTypes })
  type: TransactionTypes;

  @ApiProperty({ description: 'The item the transaction paid for', required: true })
  @Prop()
  item: string;

  @ApiProperty({ description: 'The platform the transaction is carried out in', required: true })
  @Prop({ required: [true, '"platform" is required'], enum: TransactionPlatforms })
  platform: TransactionPlatforms;

  @ApiProperty({ description: 'The reference of the transaction in the platform', required: true })
  @Prop()
  reference: string;

  @ApiProperty({ description: 'The status of the transaction', required: true, enum: TransactionStatus })
  @Prop({ type: String, default: TransactionStatus.PENDING, enum: TransactionStatus })
  status: TransactionStatus;

  createdAt: Date;

  updatedAt: Date;

  static toResponse(data: any){
    const transaction = data._doc;
    
    return transaction;
  }
}

export type TransactionDocument = Transaction | Document;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);