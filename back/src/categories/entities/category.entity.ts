import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Expose } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { Types } from "mongoose";

@Schema({ versionKey: false , timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Category {
    @Expose({ name: 'category_id' })
    @Prop({ default: () => new Types.ObjectId(), unique: true })
    _id: string;

    @Expose()
    @Prop({ default: '' })
    @IsOptional()
    @IsString()
    parent_category_code?: string;

    @Expose()
    @Prop({ required: true })
    @IsString()
    category_code: string;
    
    @Expose()
    @Prop({ required: true })
    @IsString()
    name: string;

    @Expose()
    @Prop({ default: '' })
    @IsOptional()
    @IsString()
    description: string;
    
    constructor(init: Category) {
        Object.assign(this, init);
    }
}

export const CategorySchema = SchemaFactory.createForClass(Category);
