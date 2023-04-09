import { Transaction } from "../../src/domains/transactions/entities/transaction.entity";
import { CreateTransactionDto } from "../../src/domains/transactions/dto/create-transaction.dto";
import { TransactionPlatforms } from "../../src/domains/transactions/dto/transaction.platforms";
import { TransactionTypes } from "../../src/domains/transactions/dto/transaction.types";
import { TransactionActions } from "../../src/domains/transactions/dto/transaction.actions";

export const createTransactionStub: Partial<CreateTransactionDto> = {
  amount: 5000,
  title: 'Order Commission',
  action: TransactionActions.DEBIT,
  type: TransactionTypes.ORDER,
  platform: TransactionPlatforms.WALLET
};

export const transactionStub: Partial<Transaction> = {
  ...createTransactionStub
}
