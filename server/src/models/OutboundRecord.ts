import mongoose, { Schema, Document } from 'mongoose';

// 双币种价格
interface IDualPrice {
  cny: number;
  krw: number;
}

// 出库记录接口
export interface IOutboundRecord extends Document {
  id: string;
  orderNo: string;
  skuId: string;
  skuCode: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: IDualPrice;
  totalAmount: IDualPrice;
  type: 'sale' | 'adjustment';
  channel?: string;
  operator: string;
  remark: string;
  createdAt: string;
}

// 双币种价格 Schema
const DualPriceSchema = new Schema({
  cny: { type: Number, required: true },
  krw: { type: Number, required: true }
}, { _id: false });

// 出库记录 Schema
const OutboundRecordSchema = new Schema({
  id: { type: String, required: true, unique: true },
  orderNo: { type: String, required: true, unique: true },
  skuId: { type: String, required: true },
  skuCode: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: DualPriceSchema, required: true },
  totalAmount: { type: DualPriceSchema, required: true },
  type: { type: String, enum: ['sale', 'adjustment'], required: true },
  channel: { type: String },
  operator: { type: String, required: true },
  remark: { type: String, default: '' },
  createdAt: { type: String, required: true }
}, {
  timestamps: false,
  versionKey: false
});

// 索引
OutboundRecordSchema.index({ orderNo: 1 });
OutboundRecordSchema.index({ skuId: 1 });
OutboundRecordSchema.index({ productId: 1 });
OutboundRecordSchema.index({ createdAt: -1 });

export default mongoose.model<IOutboundRecord>('OutboundRecord', OutboundRecordSchema);
