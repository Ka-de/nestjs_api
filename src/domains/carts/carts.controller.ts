import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiResponse } from '@nestjs/swagger';
import { IdValidator } from '../../shared/id.validator';
import { CacheClear } from '../../decorators/cache-clear.decorator';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import { ErrorResponse } from '../../errors/error.response';
import { AuthorizeGuard } from '../../guards/authorize.guard';
import { JoiValidationPipe } from '../../pipes/joi-validation.pipe';
import { RedisCacheKeys } from '../../redis-cache/redis-cache.keys';
import { SuccessResponse } from '../../shared/success.response';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { CartsService } from './carts.service';
import { CreateCartItemValidator } from './validators/create-cart-item.validator';
import { ListCartItemsValidator } from './validators/list-cart-items.validator';
import { ListCartItemsResponse } from './responses/list-cart-items.response';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartItemValidator } from './validators/update-cart-item.validator';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.CREATED, type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.GET_CART)
  @Post()
  createCartItem(
    @Body(new JoiValidationPipe(CreateCartItemValidator)) createCartItemDto: CreateCartItemDto,
    @CurrentUser('_id') clientId: string,
  ){
    return this.cartsService.createCartItem(createCartItemDto, clientId);
  }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: ListCartItemsResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @Get()
  listCartItems(
    @Query(new JoiValidationPipe(ListCartItemsValidator)) { limit, offset, sort, minDate, maxDate }: any,
    @CurrentUser('_id') clientId: string
  ){
    return this.cartsService.listCartItems(limit, offset, sort, minDate, maxDate, clientId);
  }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @Get(':id')
  getCartItem(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string
  ){
    return this.cartsService.getCartItem(id);
  }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @Patch(':id')
  updateCartItem(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @Body(new JoiValidationPipe(UpdateCartItemValidator)) updateCartItemDto: UpdateCartItemDto,
    @CurrentUser('_id') clientId: string
  ){
    return this.cartsService.updateCartItem(id, updateCartItemDto, clientId);
  }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @Delete(':id')
  removeCartItem(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @CurrentUser('_id') clientId: string
  ){
    return this.cartsService.removeCartItem(id, clientId);
  }
}
