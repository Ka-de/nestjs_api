import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { Job } from "../dto/job";
import { v4 as uuidv4 } from 'uuid';
import { PickupEnum } from "../dto/pickup.enum";
import { OrderState } from "../dto/order.state";
import { Delivery } from "../dto/delivery";

@Schema({ timestamps: true, versionKey: false })
export class Order {
    @ApiProperty({ description: 'The order id' })
    @Prop({ type: String, default: uuidv4 })
    readonly _id?: string;

    @ApiProperty({ description: 'The user id' })
    @Prop({ required: [true, 'Id of the client is required'] })
    readonly clientId: string;

    @ApiProperty({ description: 'The user id' })
    @Prop({ required: [true, 'Id of the designer is required'] })
    readonly designerId: string;

    @ApiProperty({ description: 'The list of items ordered', type: Job })
    @Prop({ type: { designId: String, fabric: String, size: String, color: String, quantity: Number, price: Number, images: [String], done: Boolean, _id: { type: String, default: uuidv4() } }, required: [true, 'job ordered is required'] })
    job: Job;

    @ApiProperty({ description: 'The delivery details', required: true, enum: PickupEnum })
    @Prop({ type: { pickup: String, address: String, phone: String, cost: Number, _id: false }, required: [true, '"delivery" is required'] })
    delivery: Delivery;

    @ApiProperty({ description: 'The total cost of order' })
    @Prop({ type: Number, required: [true, 'Total is required'] })
    total: number;

    @ApiProperty({ description: 'The state of the order' })
    @Prop({ type: String, default: OrderState.PROCESSING })
    status: OrderState;

    @ApiProperty({ description: 'The order creation date' })
    createdAt: Date;

    @ApiProperty({ description: 'The order update date' })
    updatedAt: Date;

    static toResponse(data: any) {
        const order = data._doc;
        return order as Order;
    }
}

export type OrderDocument = Order | Document;
export const OrderSchema = SchemaFactory.createForClass(Order);
