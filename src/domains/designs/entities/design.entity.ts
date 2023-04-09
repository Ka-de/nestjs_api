import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { Document } from "mongoose";
import { Material } from "../dto/material.dto";
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true, versionKey: false })
export class Design {

    @ApiProperty({ description: 'The id of the design' })
    @Prop({ type: String, default: uuidv4 })
    _id?: string;

    @ApiProperty({ description: 'The title of the design' })
    @Prop({ required: [true, "Title is required"] })
    title: string;

    @ApiProperty({ description: 'The description of the design' })
    @Prop({ required: [true, "Description is required"] })
    description: string;

    @ApiProperty({ description: 'The fabrics of the design', type: [Material], minItems: 1 })
    @Prop({ 
        type: [
            { 
                sizes: [{ value: String, price: Number, _id: { type: String, default: uuidv4 } }], 
                colors: [{ value: String, images: [String], _id: { type: String, default: uuidv4 } }], 
                fabric: String, 
                _id: { type: String, default: uuidv4 } 
            }
        ], 
        min: 1 
    })
    materials: Array<Material>;

    @ApiProperty({ description: 'The number of days the sewing will take'})
    @Prop({ required: [true, 'duration is required']})
    duration: number;

    @ApiProperty({ description: 'The id of the user that created the design' })
    @Prop({ required: [true, "designerId is required"] })
    designerId: string;

    @ApiProperty({ description: 'The status of the design', default: false })
    @Prop({ type: Boolean, default: false })
    active: boolean;

    @ApiProperty({ description: 'The ids of the users that liked the design' })
    @Prop({ type: [String], default: [] })
    likes: Array<string>;

    @ApiProperty({ description: 'The ids of the users that bookmarked the design' })
    @Prop({ type: [String], default: [] })
    bookmarks: Array<string>;

    @ApiProperty({ description: 'The date the design was created' })
    createdAt: Date;

    @ApiProperty({ description: 'The date the design was updated last' })
    updatedAt: Date;

    static toResponse(data: any){
        const design = data._doc;
        delete design.hidden;
        
        return design as Design;
    }
}

export type DesignDocument = Design | Document;
export const DesignSchema = SchemaFactory.createForClass(Design);
