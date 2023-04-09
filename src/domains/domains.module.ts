import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { DesignsModule } from './designs/designs.module';
import { OrdersModule } from './orders/orders.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletsModule } from './wallets/wallets.module';
import { CartsModule } from './carts/carts.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ProfilesModule,
    DesignsModule,
    OrdersModule,
    TransactionsModule,
    WalletsModule,
    CartsModule,
    NotificationsModule
  ]
})
export class DomainsModule {}
