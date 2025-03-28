import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { instanceToPlain } from 'class-transformer';
import { Product } from './entities/product.entity';
import { Price } from 'src/prices/entities/price.entity';
import { Stock } from 'src/stocks/entities/stock.entity';
import { Category } from 'src/categories/entities/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}


  // Methods for managing products

  async create(createProductDto: CreateProductDto) {
    try {
      const product_already_exists = await this.productModel.findOne({ sku: createProductDto.sku }).exec();
      if (product_already_exists) {
        throw new ConflictException('Product already exists');
      }
      await this.categoryExists(createProductDto.main_category);
      const createProduct = new this.productModel(createProductDto);
      const product = await createProduct.save();
      return instanceToPlain(new Product(product.toJSON()));
    } catch (e) {
      if (e.response.message === 'Product already exists') {
        throw new ConflictException('Product already exists');
      }
      if (e.response.message === 'Category not found') {
        throw new ConflictException('Category not found');
      }
      if (e.errors) {
        const missingFields = Object.keys(e.errors);
        throw new BadRequestException(
          `Required fields are missing: ${missingFields.join(', ')}`,
        );
      }
      throw new InternalServerErrorException();
    }
  }

  async findAll() {
    try {
      const products = await this.productModel.find().populate('stocks').populate('prices').exec();
      return products.map((product) => {
        const jsonProduct = product.toJSON();
        jsonProduct.prices = jsonProduct.prices.map(
          (price) => new Price(price),
        );
        jsonProduct.stocks = jsonProduct.stocks.map(
          (stock) => new Stock(stock),
        );
        return instanceToPlain(new Product(jsonProduct));
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.productModel.findById(id).populate('stocks').populate('prices').exec();
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return instanceToPlain(new Product(product.toJSON()));
    } catch (e) {
      if (e.response.message === 'Product not found') {
        throw new ConflictException('Product not found');
      };
      throw new InternalServerErrorException();
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      await this.productExists('_id', id);
      await this.productModel.updateOne({ _id: id }, updateProductDto).exec();
      const updated_product = await this.productModel.findById(id).exec();
      return updated_product;
    } catch (e) {
      if(e.status === 404) {
        throw new NotFoundException('Product not found');
      }
      throw new InternalServerErrorException();
    }
  }

  async remove(id: string) {
    try {
      const product = this.productExists('_id', id);
      await this.productModel.deleteOne({ _id: id }).exec();
      return product;
    } catch (e) {
      if(e.status === 404) {
        throw new NotFoundException('Product not found');
      }
      throw new InternalServerErrorException();
    }
  }

  
  // Helper methods for processing and managing product-related logic

  async productExists(key: string, value: string) {
    const product = await this.productModel.findOne({ [key]: value }).exec();
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return product;
  }

  async categoryExists(code: string) {
    const category = await this.categoryModel.findOne({ category_code: code }).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    };
    return category;
  }
}
