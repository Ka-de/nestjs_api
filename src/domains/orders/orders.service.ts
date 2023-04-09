import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { DatabaseService } from '../../database/database.service';
import { MailService } from '../../mail/mail.service';
import { SortEnum } from '../../shared/sort.enum';
import { CartItem, CartItemDocument } from '../carts/entities/cartitem.entity';
import { DesignsService } from '../designs/designs.service';
import { Design } from '../designs/entities/design.entity';
import { TransactionActions } from '../transactions/dto/transaction.actions';
import { TransactionPlatforms } from '../transactions/dto/transaction.platforms';
import { TransactionTypes } from '../transactions/dto/transaction.types';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Delivery } from './dto/delivery';
import { Job } from './dto/job';
import { OrderState } from './dto/order.state';
import { PickupEnum } from './dto/pickup.enum';
import { Order, OrderDocument } from './entities/order.entity';
import { ListOrdersResponse } from './responses/list-orders.response';
import { OrderResponse } from './responses/order.response';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(CartItem.name) private readonly cartModel: Model<CartItemDocument>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private transactionsService: TransactionsService,
    private databaseService: DatabaseService,
    private walletsService: WalletsService,
    private designsService: DesignsService
  ) { }

  private calculateDeliveryFee(delivery: Delivery) {
    let fee = 0;
    if (delivery.pickup == PickupEnum.STATION) {
      fee = 0;
    }
    else {
      fee = this.configService.get<number>('DELIVERY_FEE') || 1000;
    }

    return Number(fee);
  }

  private async pay(
    userId: string,
    amount: number,
    platform: TransactionPlatforms,
    item: string,
    session: ClientSession
  ) {
    let transaction: Transaction;
    if (platform === TransactionPlatforms.WALLET) {
      transaction = await this.walletsService.updateWallet({ action: TransactionActions.DEBIT, amount, userId, item, session });
    }
    else {
      transaction = await this.transactionsService.createTransaction({
        title: 'Order commission payment',
        amount,
        platform,
        type: TransactionTypes.ORDER,
        action: TransactionActions.NONE,
        item
      }, userId, session);
    }

    return transaction;
  }

  private async generateOrder(
    cartitem: CartItem,
    createOrderDto: CreateOrderDto,
    clientId: string,
    session: ClientSession = null
  ) {
    const { payload: design } = await this.designsService.getDesign(cartitem.designId);
    const job = await this.generateJob(cartitem, design);
    const subtotal = job.price * job.quantity;
    const total = subtotal + this.calculateDeliveryFee(createOrderDto.delivery);    

    const [order] = await this.orderModel.insertMany({ ...createOrderDto, job, total, clientId, designerId: design.designerId }, { session });
    await this.pay(clientId, order.total, createOrderDto.platform, order._id as string, session);

    return order;
  }

  private async generateJob(
    cartitem: CartItem,
    design: Design
  ){
    const material = design.materials.find(material => material._id === cartitem.materialId);
    const fabric = material.fabric;
    const size = material.sizes.find(size => size._id === cartitem.sizeId);
    const color = material.colors.find(color => color._id === cartitem.colorId);

    const job: Job = {
      designId: cartitem.designId,
      fabric,
      size: size.value,
      color: color.value,
      price: size.price,
      images: color.images,
      quantity: cartitem.quantity,
      done: false
    }

    return job;
  }

  async createOrder(
    createOrderDto: CreateOrderDto,
    clientId: string
  ) {
    const cart: CartItem[] = await this.cartModel.find({ clientId });    
    if (!cart.length) {
      throw new BadRequestException('Cart is empty');
    } 

    const orders = await this.databaseService.transaction(session => {
      return Promise.all(cart.map(cartitem => this.generateOrder(cartitem, createOrderDto, clientId, session)))
    });

    return { success: true, payload: orders.map(order => Order.toResponse(order)) } as ListOrdersResponse;
  }

  async listOrders(
    limit = this.configService.get<number>('PAGE_LIMIT'),
    offset = 0,
    sort = SortEnum.desc,
    clientId: string = '',
    designerId: string = ''
  ) {
    const query: any = {};
    if (clientId) query.clientId = clientId;
    if (designerId) query.designerId = designerId;    

    const orders = await this.orderModel.find(query)
      .sort({ 'createdAt': sort })
      .limit(limit)
      .skip(offset * limit);

    return { success: true, payload: orders.map(order => Order.toResponse(order)) } as ListOrdersResponse;
  }

  async getOrder(
    id: string,
    session: ClientSession = null
  ) {
    const order = await this.orderModel.findOne({ _id: id }).session(session);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return { success: true, payload: Order.toResponse(order) } as OrderResponse;
  }

  async setOrderStatus(
    id: string,
    status: OrderState
  ) {
    await this.getOrder(id);
    await this.orderModel.findOneAndUpdate({ _id: id }, { status });

    return { success: true, message: 'Order status updated' } as OrderResponse;
  }

  async cancelOrder(
    id: string,
    clientId: string
  ){
    const { payload: order } = await this.getOrder(id);
    if (clientId !== order.clientId) {
      throw new UnauthorizedException('You are not authorized');
    }

    if ([OrderState.DELIVERED, OrderState.IN_TRANSIT, OrderState.ORDERED].includes(order.status)) {
      throw new BadRequestException('Order can not be cancelled after it is processed');
    }

    await this.orderModel.findOneAndUpdate({ _id: id }, { $set: { hidden: true }});

    return { success: true, message: 'Order has been cancelled' } as OrderResponse;
  }

  async completeOrderJob(
    id: string,
    designerId: string
  ){
    const { payload: order } = await this.getOrder(id);
    if (designerId !== order.designerId) {
      throw new UnauthorizedException('You are not authorized');
    }
    await this.orderModel.findOneAndUpdate({ _id: id }, { $set: { job: { done: true }}});

    return { success: true, message: 'Congrats, Job completed successfully' } as OrderResponse;
  }
}
