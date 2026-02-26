// 双币种价格
export interface DualPrice {
  cny: number;
  krw: number;
}

// 产品基础信息
export interface Product {
  id: string;                    // 系统内部ID
  name: string;                  // 产品名称
  productId: string;             // Coupang Product ID
  description?: string;          // 产品描述
  skus: ProductSKU[];            // 产品SKU列表
}

// 产品SKU（尺码变体）
export interface ProductSKU {
  id: string;                    // 系统内部ID
  productId: string;             // 所属产品ID
  productName: string;           // 产品名称（冗余，方便显示）
  skuCode: string;               // 产品编号（Coupang SKU Code）
  size: string;                  // 尺码
  purchasePrice: DualPrice;      // 采购单价
  salePrice: DualPrice;          // 售出价格
}

// 库存记录 - 按SKU累计
export interface InventoryRecord {
  skuId: string;                 // SKU ID
  skuCode: string;               // 产品编号
  productId: string;             // 产品ID
  productName: string;           // 产品名称
  size: string;                  // 尺码
  
  // 库存数量（累计）
  quantity: number;              // 当前库存
  totalInbound: number;          // 累计入库
  totalOutbound: number;         // 累计出库
  
  // 价格（从SKU同步）
  purchasePrice: DualPrice;
  salePrice: DualPrice;
  
  // 库存设置
  safetyStock: number;           // 安全库存
  maxStock: number;              // 最大库存
  
  // 状态
  status: 'normal' | 'warning' | 'outOfStock';
  
  lastUpdated: string;
}

// 入库记录 - 每次进货一条记录
export interface InboundRecord {
  id: string;
  orderNo: string;               // 入库单号
  
  // 产品信息
  skuId: string;
  skuCode: string;
  productId: string;
  productName: string;
  size: string;
  
  // 入库信息
  quantity: number;              // 入库数量
  unitPrice: DualPrice;          // 入库单价
  totalAmount: DualPrice;        // 总金额
  
  // 入库时间（新增）
  inboundDate: string;           // 入库日期
  inboundTime: string;           // 入库时间
  
  // Coupang信息（可选）
  coupangInboundNo?: string;
  logisticsCenter?: string;
  waybillNo?: string;
  
  // 其他
  supplier: string;
  operator: string;
  remark: string;
  createdAt: string;
}

// 出库记录
export interface OutboundRecord {
  id: string;
  orderNo: string;               // 出库单号
  
  // 产品信息
  skuId: string;
  skuCode: string;
  productId: string;
  productName: string;
  size: string;
  
  // 出库信息
  quantity: number;
  unitPrice: DualPrice;
  totalAmount: DualPrice;
  
  // 类型
  type: 'sale' | 'adjustment';
  channel?: string;              // 销售渠道
  
  operator: string;
  remark: string;
  createdAt: string;
}

// 采购计划
export interface PurchasePlan {
  id: string;
  skuId: string;
  skuCode: string;
  productId: string;
  productName: string;
  size: string;
  
  currentStock: number;
  safetyStock: number;
  suggestedPurchase: number;
  priority: 'highest' | 'high' | 'medium' | 'low' | 'none';
  estimatedCost: DualPrice;
  
  isSelected?: boolean;
}

// 采购单
export interface PurchaseOrder {
  id: string;
  orderNo: string;
  items: PurchasePlan[];
  totalAmount: DualPrice;
  supplier: string;
  status: 'draft' | 'confirmed' | 'completed';
  createdAt: string;
  remark?: string;
}

// 仪表盘统计
export interface DashboardStats {
  totalSKUs: number;
  totalInventory: number;
  normalItems: number;
  warningItems: number;
  outOfStockItems: number;
  inventoryValue: DualPrice;
}
