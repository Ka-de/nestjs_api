import { Controller, Get, Post, Body, Patch, Param, HttpStatus, UsePipes, UseGuards, CacheKey, Query, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiHeader, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CacheClear } from '../../decorators/cache-clear.decorator';
import { ErrorResponse } from '../../errors/error.response';
import { JoiValidationPipe } from '../../pipes/joi-validation.pipe';
import { RedisCacheKeys } from '../../redis-cache/redis-cache.keys';
import { UserResponse } from '../users/responses/user.response';
import { RolesGuard } from '../../guards/roles.guard';
import { AuthorizeGuard } from '../../guards/authorize.guard';
import { AccessRights } from '../../shared/access.right';
import * as Joi from 'joi';
import { SortEnum } from '../../shared/sort.enum';
import { ListOrdersResponse } from './responses/list-orders.response';
import { OrderResponse } from './responses/order.response';
import { IdValidator } from '../../shared/id.validator';
import { CreateOrderValidator } from './validators/create-order.validator';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import { OrderState } from './dto/order.state';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.CREATED, type: UserResponse})
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.LIST_ORDERS)
  @Post()
  createOrder(
    @Body(new JoiValidationPipe(CreateOrderValidator)) createOrderDto: CreateOrderDto,
    @CurrentUser('_id') clientId: string
  ) {    
    return this.ordersService.createOrder(createOrderDto, clientId);
  }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiQuery({ name: 'limit', required: false, description: 'The max number of orders to fetch', type: Number })
  @ApiQuery({ name: 'offset', required: false, description: 'The page number to fetch', type: Number })
  @ApiQuery({ name: 'sort', required: false, description: 'The order of sorting', enum: SortEnum, type: String })
  @ApiQuery({ name: 'clientId', required: false, description: 'The id of the client to fetch order for', type: String })
  @ApiQuery({ name: 'designerId', required: false, description: 'The id of the designer to fetch order for', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: ListOrdersResponse })
  @CacheKey(RedisCacheKeys.LIST_ORDERS)
  @Get()
  listOrders(
    @Query('limit', new JoiValidationPipe(Joi.number().min(1))) limit?: number,
    @Query('offset', new JoiValidationPipe(Joi.number().min(0))) offset?: number,
    @Query('sort', new JoiValidationPipe(Joi.string().valid(...Object.values(SortEnum)))) sort?: SortEnum,
    @Query('clientId', new JoiValidationPipe(Joi.string().default(''))) clientId?: string,
    @Query('designerId', new JoiValidationPipe(Joi.string().default(''))) designerId?: string
  ) {
    return this.ordersService.listOrders(limit, offset, sort, clientId, designerId);
  }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiParam({ name: 'id', required: true, description: 'The id of the item' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @CacheKey(RedisCacheKeys.GET_ORDER)
  @Get(':id')
  getOrder(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string
  ) {
    return this.ordersService.getOrder(id);
  }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(
    AuthorizeGuard, 
    new RolesGuard([AccessRights.SUPERADMIN, AccessRights.ADMIN])
  )
  @ApiResponse({ status: HttpStatus.OK, type: OrderResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.LIST_ORDERS, RedisCacheKeys.GET_ORDER)
  @Patch(':id')
  setOrderStatus(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @Body('status', new JoiValidationPipe(Joi.string().valid(...Object.values(OrderState)))) status: OrderState
  ) {
    return this.ordersService.setOrderStatus(id, status);
  }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: OrderResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.LIST_ORDERS, RedisCacheKeys.GET_ORDER)
  @Delete(':id')
  cancelOrder(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @CurrentUser('_id') clientId: string
  ) {
    return this.ordersService.cancelOrder(id, clientId);
  }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: OrderResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.LIST_ORDERS, RedisCacheKeys.GET_ORDER)
  @Patch(':id/complete-job')
  completeOrderJob(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @CurrentUser('_id') designerId: string
  ) {
    return this.ordersService.completeOrderJob(id, designerId);
  }
}
