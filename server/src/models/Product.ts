import mongoose, { Schema, Document } from 'mongoose';

// 双币种价格
interface IDualPrice {
  cny: number;
  krw: number;
}

// SKU 接口
export interface IProductSKU {
  id: string;
  productId: string;
  productName: string;
  skuCode: string;
  size: string;
  purchasePrice: IDualPrice;
  salePrice: IDualPrice;
}

// 产品接口
export interface IProduct extends Document {
  id: string;
  name: string;
  productId: string;
  description?: string;
  skus: IProductSKU[];
  createdAt: Date;
  updatedAt: Date;
}

// 双币种价格 Schema
const DualPriceSchema = new Schema({
  cny: { type: Number, required: true },
  krw: { type: Number, required: true }
}, { _id: false });

// SKU Schema
const ProductSKUSchema = new Schema({
  id: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  skuCode: { type: String, required: true, unique: true },
  size: { type: String, required: true },
  purchasePrice: { type: DualPriceSchema, required: true },
  salePrice: { type: DualPriceSchema, required: true }
}, { _id: false });

// 产品 Schema
const ProductSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  productId: { type: String, required: true, unique: true },
  description: { type: String },
  skus: { type: [ProductSKUSchema], default: [] }
}, {
  timestamps: true,
  versionKey: false
});

// 索引
ProductSchema.index({ productId: 1 });
ProductSchema.index({ name: 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
