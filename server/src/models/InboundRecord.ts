import mongoose, { Schema, Document } from 'mongoose';

// 双币种价格
interface IDualPrice {
  cny: number;
  krw: number;
}

// 入库记录接口
export interface IInboundRecord extends Document {
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
  inboundDate: string;
  inboundTime: string;
  coupangInboundNo?: string;
  logisticsCenter?: string;
  waybillNo?: string;
  supplier: string;
  operator: string;
  remark: string;
  createdAt: string;
}

// 双币种价格 Schema
const DualPriceSchema = new Schema({
  cny: { type: Number, required: true },
  krw: { type: Number, required: true }
}, { _id: false });

// 入库记录 Schema
const InboundRecordSchema = new Schema({
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
  inboundDate: { type: String, required: true },
  inboundTime: { type: String, required: true },
  coupangInboundNo: { type: String },
  logisticsCenter: { type: String },
  waybillNo: { type: String },
  supplier: { type: String, required: true },
  operator: { type: String, required: true },
  remark: { type: String, default: '' },
  createdAt: { type: String, required: true }
}, {
  timestamps: false,
  versionKey: false
});

// 索引
InboundRecordSchema.index({ orderNo: 1 });
InboundRecordSchema.index({ skuId: 1 });
InboundRecordSchema.index({ productId: 1 });
InboundRecordSchema.index({ inboundDate: -1 });

export default mongoose.model<IInboundRecord>('InboundRecord', InboundRecordSchema);
