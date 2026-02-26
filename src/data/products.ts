import type { Product, ProductSKU, DualPrice } from '@/types';

// 汇率设置 (1 CNY = 190 KRW)
export const EXCHANGE_RATE = 190;

// 辅助函数：创建双币种价格
export const createDualPrice = (cny: number): DualPrice => ({
  cny,
  krw: Math.round(cny * EXCHANGE_RATE)
});

// 狗狗冲锋衣 - 5个尺码 (Coupang SKU ID对应)
export const product1SKUs: ProductSKU[] = [
  {
    id: 'sku-001',
    productId: '9312183755',
    productName: '狗狗冲锋衣',
    skuCode: '94647662186',  // L码
    size: 'L',
    purchasePrice: createDualPrice(45),
    salePrice: createDualPrice(118)
  },
  {
    id: 'sku-002',
    productId: '9312183755',
    productName: '狗狗冲锋衣',
    skuCode: '94647662188',  // S码
    size: 'S',
    purchasePrice: createDualPrice(45),
    salePrice: createDualPrice(118)
  },
  {
    id: 'sku-003',
    productId: '9312183755',
    productName: '狗狗冲锋衣',
    skuCode: '94647662190',  // M码
    size: 'M',
    purchasePrice: createDualPrice(45),
    salePrice: createDualPrice(118)
  },
  {
    id: 'sku-004',
    productId: '9312183755',
    productName: '狗狗冲锋衣',
    skuCode: '94647662187',  // XL码
    size: 'XL',
    purchasePrice: createDualPrice(48),
    salePrice: createDualPrice(128)
  },
  {
    id: 'sku-005',
    productId: '9312183755',
    productName: '狗狗冲锋衣',
    skuCode: '94647662189',  // XXL码
    size: 'XXL',
    purchasePrice: createDualPrice(52),
    salePrice: createDualPrice(138)
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
    purchasePrice: createDualPrice(42),
    salePrice: createDualPrice(108)
  },
  {
    id: 'sku-007',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772481',  // XXL码
    size: 'XXL',
    purchasePrice: createDualPrice(45),
    salePrice: createDualPrice(118)
  },
  {
    id: 'sku-008',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772488',  // 3XL码
    size: '3XL',
    purchasePrice: createDualPrice(48),
    salePrice: createDualPrice(128)
  },
  {
    id: 'sku-009',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772482',  // 4XL码
    size: '4XL',
    purchasePrice: createDualPrice(52),
    salePrice: createDualPrice(138)
  },
  {
    id: 'sku-010',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772483',  // 5XL码
    size: '5XL',
    purchasePrice: createDualPrice(55),
    salePrice: createDualPrice(148)
  },
  {
    id: 'sku-011',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772485',  // 6XL码
    size: '6XL',
    purchasePrice: createDualPrice(58),
    salePrice: createDualPrice(158)
  },
  {
    id: 'sku-012',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772484',  // 7XL码
    size: '7XL',
    purchasePrice: createDualPrice(62),
    salePrice: createDualPrice(168)
  },
  {
    id: 'sku-013',
    productId: '9286790289',
    productName: '大狗居家服',
    skuCode: '94529772486',  // 8XL码
    size: '8XL',
    purchasePrice: createDualPrice(65),
    salePrice: createDualPrice(178)
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
