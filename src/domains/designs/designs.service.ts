import { HttpException, HttpStatus, Injectable, NotFoundException, Scope, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { Design, DesignDocument } from './entities/design.entity';
import { DesignResponse } from './responses/design.response';
import { ConfigService } from '@nestjs/config';
import { SortEnum } from '../../shared/sort.enum';
import { ListDesignsResponse } from './responses/list-designs.response';
import { Storage } from '../../shared/storage';
import { Material } from './dto/material.dto';
import { v4 as uuidV4 } from 'uuid';

@Injectable()
export class DesignsService {
  storage = new Storage();
  constructor(
    @InjectModel(Design.name) private readonly designModel: Model<DesignDocument>,
    private readonly configService: ConfigService,
  ) { }

  async createDesign(
    createDesignDto: CreateDesignDto,
    designerId: string
  ) {
    createDesignDto.materials = await this.convertDesignImages(designerId, ...createDesignDto.materials);

    const model = await this.designModel.create({ ...createDesignDto, designerId });
    const design = await this.getDesign(model._id as string);

    return design;
  }

  async listDesigns(
    limit = this.configService.get<number>('PAGE_LIMIT'),
    offset = 0,
    sort = SortEnum.desc,
    query = '',
    designerId = ''
  ) {
    const where: any = {};
    if (designerId) {
      where.designerId = designerId;
    }

    const designs = await this.designModel.find({
      ...where,
      hidden: false,
      $or: [
        { title: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') }
      ]
    })
      .sort({ 'createdAt': sort })
      .limit(limit)
      .skip(offset * limit);
      
      return { success: true, payload: designs.map(property => Design.toResponse(property))} as ListDesignsResponse;
  }

  async getDesign(id: string) {        
    const design = await this.designModel.findOne({ _id: id, hidden: false });   
    if(!design){
      throw new NotFoundException('Design not found');
    }
    
    return { success: true, payload: Design.toResponse(design) } as DesignResponse;
  }

  async updateDesign(
    id: string, 
    updateDesignDto: UpdateDesignDto, 
    userId: string
  ) {
    const design = await this.getDesign(id);    
    if (userId !== design.payload.designerId) {
      throw new UnauthorizedException('You are not authorized');
    }

    await this.designModel.findOneAndUpdate({ _id: id }, updateDesignDto);

    return { success: true, payload: { ...design.payload, ...updateDesignDto} } as DesignResponse;
  }

  async removeDesign(id: string, userId: string) {
    const design = await this.getDesign(id);    
    if (userId !== design.payload.designerId) {
      throw new UnauthorizedException('You are not authorized');
    }

    await this.designModel.findOneAndUpdate({ _id: id }, { hidden: true });
    return { success: true };
  }

  async convertDesignImages(userId: string, ...materials: Material[]){
    materials = await Promise.all(materials.map(async (material, i) => {
      material.colors = await Promise.all(material.colors.map(async (color) => {
        color.images = await Promise.all(color.images.map(async (image) => {
          image = await this.storage.base64ToFile(image, `${userId}/designs`, `${uuidV4()}-${uuidV4()}.png`);
          return image;
        }));
        return color;
      }));
      return material;
    }));

    return materials;
  }
}
