import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true, versionKey: false })
export class CartItem {
    @ApiProperty({ description: 'The id of the cart item' })
    @Prop({ type: String, default: uuidv4 })
    _id: string;

    @ApiProperty({ description: 'The id of the design to be used' })
    @Prop({ required: [true, 'designId is required']})
    designId: string;

    @ApiProperty({ description: 'The id of the client' })
    @Prop({ required: [true, 'clientId is required']})
    clientId: string;

    @ApiProperty({ description: 'The id of the material' })
    @Prop({ required: [true, 'materialId is required']})
    materialId: string;

    @ApiProperty({ description: 'The id of the size' })
    @Prop({ required: [true, 'sizeId is required']})
    sizeId: string;

    @ApiProperty({ description: 'The id of the color' })
    @Prop({ required: [true, 'color is required']})
    colorId: string;

    @ApiProperty({ description: 'The number of items within this job' })
    @Prop({ required: [true, 'quantity is required']})
    quantity: number;

    @ApiProperty({ description: 'The cost of shipping the job' })
    @Prop({ default: 0 })
    shippingCost: number;
}

export type CartItemDocument = CartItem | Document;
export const CartItemSchema = SchemaFactory.createForClass(CartItem);