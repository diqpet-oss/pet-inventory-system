import mongoose, { Schema, Document } from 'mongoose';

// 双币种价格
interface IDualPrice {
  cny: number;
  krw: number;
}

// 库存记录接口
export interface IInventory extends Document {
  skuId: string;
  skuCode: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  totalInbound: number;
  totalOutbound: number;
  purchasePrice: IDualPrice;
  salePrice: IDualPrice;
  safetyStock: number;
  maxStock: number;
  status: 'normal' | 'warning' | 'outOfStock';
  lastUpdated: string;
}

// 双币种价格 Schema
const DualPriceSchema = new Schema({
  cny: { type: Number, required: true },
  krw: { type: Number, required: true }
}, { _id: false });

// 库存记录 Schema
const InventorySchema = new Schema({
  skuId: { type: String, required: true, unique: true },
  skuCode: { type: String, required: true, unique: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  totalInbound: { type: Number, default: 0 },
  totalOutbound: { type: Number, default: 0 },
  purchasePrice: { type: DualPriceSchema, required: true },
  salePrice: { type: DualPriceSchema, required: true },
  safetyStock: { type: Number, default: 10 },
  maxStock: { type: Number, default: 100 },
  status: { type: String, enum: ['normal', 'warning', 'outOfStock'], default: 'outOfStock' },
  lastUpdated: { type: String, required: true }
}, {
  timestamps: false,
  versionKey: false
});

// 索引
InventorySchema.index({ skuId: 1 });
InventorySchema.index({ productId: 1 });
InventorySchema.index({ status: 1 });

export default mongoose.model<IInventory>('Inventory', InventorySchema);
