import { Global, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { CartItem, CartItemSchema } from '../carts/entities/cartitem.entity';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: CartItem.name, schema: CartItemSchema }
    ])
  ],
  controllers: [OrdersController],
  providers: [OrdersService], 
  exports: [OrdersService]
})
export class OrdersModule {}
