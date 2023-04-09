import { Controller, Get, Patch, Param, UseGuards, HttpStatus, Query, CacheKey } from '@nestjs/common';
import { ApiHeader, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JoiValidationPipe } from '../../pipes/joi-validation.pipe';
import { IdValidator } from '../../shared/id.validator';
import { ErrorResponse } from '../../errors/error.response';
import { AuthorizeGuard } from '../../guards/authorize.guard';
import { TransactionResponse } from './responses/transaction.response';
import { TransactionsService } from './transactions.service';
import { ListTransactionsResponse } from './responses/list-transactions.response';
import { SortEnum } from '../../shared/sort.enum';
import { RedisCacheKeys } from '../../redis-cache/redis-cache.keys';
import { ListTransactionsValidator } from './validators/list-transactions.validator';
import { TransactionTypes } from './dto/transaction.types';
import { TransactionActions } from './dto/transaction.actions';
import { TransactionStatus } from './dto/transaction.status';
import { TransactionPlatforms } from './dto/transaction.platforms';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiQuery({ name: 'limit', required: false, description: 'The max number of users to fetch', type: Number })
  @ApiQuery({ name: 'offset', required: false, description: 'The page number to fetch', type: Number })
  @ApiQuery({ name: 'sort', required: false, description: 'The order of sorting', enum: SortEnum, type: String })
  @ApiQuery({ name: 'minDate', required: false, description: 'The date to start from', type: Number })
  @ApiQuery({ name: 'maxDate', required: false, description: 'The date to stop at', type: Number })
  @ApiQuery({ name: 'minAmount', required: false, description: 'The minimum amount to fetch' })
  @ApiQuery({ name: 'maxAmount', required: false, description: 'The maximum amount to fetch' })
  @ApiQuery({ name: 'type', required: false, description: 'The type of transactions', enum: TransactionTypes, type: String })
  @ApiQuery({ name: 'action', required: false, description: 'The action of transactions', enum: TransactionActions, type: String })
  @ApiQuery({ name: 'status', required: false, description: 'The status of transactions', enum: TransactionStatus, type: String })
  @ApiQuery({ name: 'platform', required: false, description: 'The status of transactions', enum: TransactionPlatforms, type: String })
  @ApiResponse({ status: HttpStatus.OK, type: ListTransactionsResponse })
  @CacheKey(RedisCacheKeys.LIST_TRANSACTIONS)
  @Get()
  listTransactions(
    @Query(new JoiValidationPipe(ListTransactionsValidator)) { limit, offset, sort, minDate, maxDate, minAmount, maxAmount, type, status, action, platform }: any
  ) {
    return this.transactionsService.listTransactions(limit, offset, sort, minDate, maxDate, {minAmount, maxAmount, type, status, action, platform });
  }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: TransactionResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @CacheKey(RedisCacheKeys.GET_TRANSACTION)
  @Get(':id')
  getTransaction(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string
  ) {
    return this.transactionsService.getTransaction(id);
  }
}
