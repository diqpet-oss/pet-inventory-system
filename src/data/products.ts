import type { Product, ProductSKU, DualPrice } from '@/types';

// 汇率设置 (1 CNY = 190 KRW)
export const EXCHANGE_RATE = 190;

// 辅助函数：从人民币创建采购价（CNY → KRW）
export const createPurchasePrice = (cny: number): DualPrice => ({
  cny,
  krw: Math.round(cny * EXCHANGE_RATE)
});

// 辅助函数：从韩币创建售价（KRW → CNY）
export const createSalePrice = (krw: number): DualPrice => ({
  cny: Math.round(krw / EXCHANGE_RATE),
  krw
});

// 狗狗冲锋衣 - 5个尺码 (Coupang SKU ID对应)
export const product1SKUs: ProductSKU[] = [
  {
    id: 'sku-001',
    productId: '9312183755',
    productName: '狗狗冲锋衣',
    skuCode: '94647662186',  // L码
    size: 'L',
    purchasePrice: createPurchasePrice(45),
    salePrice: createSalePrice(22420)  // 韩币售价
  },
  {
    id: 'sku-002',
    productId: '9312183755',
    productName: '狗狗冲锋衣',
    skuCode: '94647662188',  // S码
    size: 'S',
    purchasePrice: createPurchasePrice(45),
    salePrice: createSalePrice(22420)  // 韩币售价
  },
  {
    id: 'sku-003',
    productId: '9312183755',
    productName: '狗狗冲锋衣',
    skuCode: '94647662190',  // M码
    size: 'M',
    purchasePrice: createPurchasePrice(45),
    salePrice: createSalePrice(22420)  // 韩币售价
  },
  {
    id: 'sku-004',
    productId: '9312183755',
    productName: '狗狗冲锋衣',
    skuCode: '94647662187',  // XL码
    size: 'XL',
    purchasePrice: createPurchasePrice(48),
    salePrice: createSalePrice(24320)  // 韩币售价
  },
  {
    id: 'sku-005',
    productId: '9312183755',
    productName: '狗狗冲锋衣',
    skuCode: '94647662189',  // XXL码
    size: 'XXL',
    purchasePrice: createPurchasePrice(52),
    salePrice: createSalePrice(26220)  // 韩币售价
  }
];

// 大狗居家服 - 8个尺码 (Coupang SKU ID对应)
export const product2SKUs: ProductSKU[] = [
  {
    id: 'sku-006',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772480',  // XL码
    size: 'XL',
    purchasePrice: createPurchasePrice(42),
    salePrice: createSalePrice(20520)  // 韩币售价
  },
  {
    id: 'sku-007',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772481',  // XXL码
    size: 'XXL',
    purchasePrice: createPurchasePrice(45),
    salePrice: createSalePrice(22420)  // 韩币售价
  },
  {
    id: 'sku-008',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772488',  // 3XL码
    size: '3XL',
    purchasePrice: createPurchasePrice(48),
    salePrice: createSalePrice(24320)  // 韩币售价
  },
  {
    id: 'sku-009',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772482',  // 4XL码
    size: '4XL',
    purchasePrice: createPurchasePrice(52),
    salePrice: createSalePrice(26220)  // 韩币售价
  },
  {
    id: 'sku-010',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772483',  // 5XL码
    size: '5XL',
    purchasePrice: createPurchasePrice(55),
    salePrice: createSalePrice(28120)  // 韩币售价
  },
  {
    id: 'sku-011',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772485',  // 6XL码
    size: '6XL',
    purchasePrice: createPurchasePrice(58),
    salePrice: createSalePrice(30020)  // 韩币售价
  },
  {
    id: 'sku-012',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772484',  // 7XL码
    size: '7XL',
    purchasePrice: createPurchasePrice(62),
    salePrice: createSalePrice(31920)  // 韩币售价
  },
  {
    id: 'sku-013',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772486',  // 8XL码
    size: '8XL',
    purchasePrice: createPurchasePrice(65),
    salePrice: createSalePrice(33820)  // 韩币售价
  }
];

// ========== 产品1: 狗狗冲锋衣 ==========
export const product1: Product = {
  id: 'prod-001',
  name: '狗狗冲锋衣',
  productId: '9312183755',
  description: '户外防水防风冲锋衣',
  skus: product1SKUs
};

// ========== 产品2: 大狗居家服 ==========
export const product2: Product = {
  id: 'prod-002',
  name: '大狗居家服',
  productId: '9286790289',
  description: '防掉毛舒适家居服',
  skus: product2SKUs
};

// 所有产品
export const allProducts: Product[] = [product1, product2];

// 所有SKU
export const allSKUs: ProductSKU[] = [...product1SKUs, ...product2SKUs];

// 根据SKU Code查找SKU
export const findSKUByCode = (skuCode: string): ProductSKU | undefined => {
  return allSKUs.find(sku => sku.skuCode === skuCode);
};

// 根据Product ID查找产品
export const findProductById = (productId: string): Product | undefined => {
  return allProducts.find(p => p.productId === productId);
};

// 根据Product ID获取所有SKU
export const getSKUsByProductId = (productId: string): ProductSKU[] => {
  return allSKUs.filter(sku => sku.productId === productId);
};

// 获取状态配置
export const getStatusConfig = (status: string) => {
  switch (status) {
    case 'normal':
      return { text: '正常', color: 'emerald', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/20' };
    case 'warning':
      return { text: '预警', color: 'amber', bgColor: 'bg-amber-500/10', textColor: 'text-amber-400', borderColor: 'border-amber-500/20' };
    case 'outOfStock':
      return { text: '缺货', color: 'red', bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-red-500/20' };
    default:
      return { text: '未知', color: 'gray', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400', borderColor: 'border-gray-500/20' };
  }
};

// 获取优先级配置
export const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'highest':
      return { text: '最高', color: 'red', bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-red-500/20' };
    case 'high':
      return { text: '高', color: 'orange', bgColor: 'bg-orange-500/10', textColor: 'text-orange-400', borderColor: 'border-orange-500/20' };
    case 'medium':
      return { text: '中', color: 'amber', bgColor: 'bg-amber-500/10', textColor: 'text-amber-400', borderColor: 'border-amber-500/20' };
    case 'low':
      return { text: '低', color: 'blue', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/20' };
    case 'none':
      return { text: '无', color: 'gray', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400', borderColor: 'border-gray-500/20' };
    default:
      return { text: '未知', color: 'gray', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400', borderColor: 'border-gray-500/20' };
  }
};

// 获取出库类型配置
export const getOutboundTypeConfig = (type: string) => {
  switch (type) {
    case 'sale':
      return { text: '销售出库', color: 'blue', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/20' };
    case 'adjustment':
      return { text: '库存调整', color: 'purple', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400', borderColor: 'border-purple-500/20' };
    default:
      return { text: '未知', color: 'gray', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400', borderColor: 'border-gray-500/20' };
  }
};

// 导出Excel辅助函数
export const exportToExcel = (data: any[], filename: string) => {
  const XLSX = window.XLSX;
  if (!XLSX) {
    console.error('XLSX library not loaded');
    return;
  }
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
