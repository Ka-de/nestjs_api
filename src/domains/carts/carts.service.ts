import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SortEnum } from '../../shared/sort.enum';
import { DesignsService } from '../designs/designs.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItem, CartItemDocument } from './entities/cartitem.entity';
import { GetCartItemResponse } from './responses/get-cart-item.response';
import { ListCartItemsResponse } from './responses/list-cart-items.response';

@Injectable()
export class CartsService {

    constructor(
        @InjectModel(CartItem.name) public readonly cartModel: Model<CartItemDocument>,
        private designsService: DesignsService,
        private readonly configService: ConfigService,
    ) { }

    async createCartItem(
        createCartItemDto: CreateCartItemDto,
        clientId: string
    ) {
        const { payload: design } = await this.designsService.getDesign(createCartItemDto.designId);

        const material = design.materials.find(material => material._id === createCartItemDto.materialId);
        if (!material) throw new NotFoundException('Material not found');

        const size = material.sizes.find(size => size._id === createCartItemDto.sizeId);
        if (!size) throw new NotFoundException('Size not found');

        const color = material.colors.find(color => color._id === createCartItemDto.colorId);
        if (!color) throw new NotFoundException('Color not found');

        const exists = await this.cartModel.findOne({ 
            designId: createCartItemDto.designId, 
            clientId, 
            materialId: createCartItemDto.materialId,
            sizeId: createCartItemDto.sizeId,
            colorId: createCartItemDto.colorId
        });
        if (exists) {
            throw new ConflictException('You already have this item in cart');
        }   

        const model = await this.cartModel.create({ ...createCartItemDto, clientId });

        const cartItem = await this.cartModel.findById(model._id);
        return { success: true, payload: cartItem };
    }

    async listCartItems(
        limit = this.configService.get<number>('PAGE_LIMIT'),
        offset = 0,
        sort = SortEnum.desc,
        minDate = new Date(1901),
        maxDate = new Date(),
        clientId: string
    ) {
        minDate = new Date(Number(minDate));
        maxDate = new Date(Number(maxDate));

        let query: any = {
            clientId,
            $and: [
                { createdAt: { '$gte': minDate, '$lte': maxDate } },
            ],
        };
        
        const cart = await this.cartModel.find(query)
            .sort({ 'createdAt': sort })
            .limit(limit)
            .skip(offset * limit);        

        return { success: true, payload: cart } as ListCartItemsResponse;
    }

    async getCartItem(
        id: string,
    ) {
        const cartItem = await this.cartModel.findOne({ _id: id });
        if (!cartItem) {
            throw new NotFoundException('CartItem not found');
        }

        return { success: true, payload: cartItem } as GetCartItemResponse;
    }

    async updateCartItem(
        id: string,
        updateCartItemDto: UpdateCartItemDto,
        clientId: string
    ) {
        const { payload: cartItem } = await this.getCartItem(id);
        if (cartItem.clientId !== clientId) {
            throw new UnauthorizedException('You are not authorized');
        }
        await this.cartModel.findOneAndUpdate({ _id: id }, updateCartItemDto);

        return { success: true, payload: { ...cartItem, ...updateCartItemDto } } as GetCartItemResponse;
    }

    async removeCartItem(
        id: string,
        clientId: string
    ) {
        const { payload: cartItem } = await this.getCartItem(id);
        if (cartItem.clientId !== clientId) {
            throw new UnauthorizedException('You are not authorized');
        }
        await this.cartModel.findOneAndDelete({ _id: id });

        return { success: true, message: 'Cart item deleted successfully' };
    }
}
