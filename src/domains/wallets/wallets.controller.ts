import { Controller, Get, UseGuards, CacheKey, HttpStatus } from '@nestjs/common';
import { ApiHeader, ApiResponse } from '@nestjs/swagger';
import { CacheFilter } from '../../decorators/cache-filter.decorator';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import { AuthorizeGuard } from '../../guards/authorize.guard';
import { RedisCacheKeys } from '../../redis-cache/redis-cache.keys';
import { UserResponse } from '../users/responses/user.response';
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @ApiHeader({ name: 'authorization', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiResponse({ status: HttpStatus.OK, type: UserResponse })
  @CacheKey(RedisCacheKeys.GET_WALLET)
  @CacheFilter('token')
  @Get()
  getUser(
    @CurrentUser('_id') id: string
  ) {    
    return this.walletsService.getWallet(id);
  }
}
