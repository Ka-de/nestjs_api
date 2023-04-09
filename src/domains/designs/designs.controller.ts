import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFiles, CacheKey, CacheTTL, HttpStatus } from '@nestjs/common';
import { ApiHeader, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CacheClear } from '../../decorators/cache-clear.decorator';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import { ErrorResponse } from '../../errors/error.response';
import { JoiValidationPipe } from '../../pipes/joi-validation.pipe';
import { SortEnum } from '../../shared/sort.enum';
import { AuthorizeGuard } from '../../guards/authorize.guard';
import { RedisCacheKeys } from '../../redis-cache/redis-cache.keys';
import { DesignsService } from './designs.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { ListDesignsResponse } from './responses/list-designs.response';
import { CreateDesignValidator } from './validators/create-design.validator';
import * as Joi from 'joi';
import { DesignResponse } from './responses/design.response';
import { Deserializer } from 'v8';
import { UpdateDesignValidator } from './validators/update-design.validator';
import { IdValidator } from '../../shared/id.validator';
import { SuccessResponse } from '../../shared/success.response';
import { ListDesignsValidator } from './validators/list-designs.validator';

@Controller('designs')
export class DesignsController {
  constructor(private readonly designsService: DesignsService) { }

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.CREATED, })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.LIST_DESIGNS)
  @Post()
  createDesign(
    @Body(new JoiValidationPipe(CreateDesignValidator)) createDesignDto: CreateDesignDto,
    @CurrentUser('_id') designerId: string
  ) {
    return this.designsService.createDesign(createDesignDto, designerId);
  }

  @ApiQuery({ name: 'limit', required: false, description: 'The max number of properties to fetch', type: Number })
  @ApiQuery({ name: 'offset', required: false, description: 'The page number to fetch', type: Number })
  @ApiQuery({ name: 'sort', required: false, description: 'The order of sorting', enum: SortEnum, type: String })
  @ApiQuery({ name: 'query', required: false, description: 'The query for searching properties', type: String })
  @ApiQuery({ name: 'designerId', required: false, description: 'The id of the designer', type: String })
  @CacheKey(RedisCacheKeys.LIST_DESIGNS)
  @ApiResponse({ status: HttpStatus.OK, type: ListDesignsResponse })
  @Get()
  listDesigns(
    @Query(new JoiValidationPipe(ListDesignsValidator)) { limit, offset, sort, query, designerId }: any
  ) {
    return this.designsService.listDesigns(limit, offset, sort, query, designerId);
  }

  @ApiResponse({ status: HttpStatus.OK, type: DesignResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @CacheKey(RedisCacheKeys.GET_DESIGN)
  @Get(':id')
  getDesign(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string
  ) {
    return this.designsService.getDesign(id);
  }

  @ApiHeader({ name: 'authorization', required: true })
  @ApiResponse({ status: HttpStatus.OK, type: Deserializer })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @UseGuards(AuthorizeGuard)
  @Patch(':id')
  updateDesign(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @Body(new JoiValidationPipe(UpdateDesignValidator)) updatePropertyDto: UpdateDesignDto,
    @CurrentUser('_id') userId: string
  ) {
    return this.designsService.updateDesign(id, updatePropertyDto, userId);
  }

  @ApiHeader({ name: 'token', required: true })
  @ApiHeader({ name: 'password', required: true })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @UseGuards(AuthorizeGuard)
  @Delete(':id')
  removeDesign(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @CurrentUser('_id') userId: string
  ) {
    return this.designsService.removeDesign(id, userId);
  }
}
