import { Job } from '../../src/domains/orders/dto/job'
import { OrderState } from '../../src/domains/orders/dto/order.state';
import { PickupEnum } from '../../src/domains/orders/dto/pickup.enum';
import { Order } from '../../src/domains/orders/entities/order.entity';
import { TransactionPlatforms } from '../../src/domains/transactions/dto/transaction.platforms';
import { CreateOrderDto } from '../../src/domains/orders/dto/create-order.dto'
import { designStub } from './design.stubs';

export const jobStub = (image: string, designId: string): Job => {
    const { materials: [material] } = designStub(image, designId);
    return {
        fabric: material.fabric,
        size: material.sizes[0].value,
        price: material.sizes[0].price,
        color: material.colors[0].value,
        images: material.colors[0].images,
        designId,
        done: false,
        quantity: 2
    }
};

export const createOrderStub: Partial<CreateOrderDto> = {
    delivery: {
        address: 'Some where',
        phone: '0000000000',
        pickup: PickupEnum.HOME,
    },
    platform: TransactionPlatforms.PAYSTACK,
    reference: 'this is a silly id'
};

export const orderStub: Partial<Order> = {
    delivery: createOrderStub.delivery,
    status: OrderState.PROCESSING
};
