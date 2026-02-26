// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 通用请求函数
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '请求失败');
    }

    return result;
  } catch (error) {
    console.error('API 请求错误:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误',
    };
  }
}

// 产品 API
export const productAPI = {
  // 获取所有产品
  getAll: () => fetchAPI<Product[]>('/products'),

  // 获取单个产品
  getById: (id: string) => fetchAPI<Product>(`/products/${id}`),

  // 创建产品
  create: (product: Product) =>
    fetchAPI<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),

  // 更新产品
  update: (id: string, updates: Partial<Product>) =>
    fetchAPI<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // 删除产品
  delete: (id: string) =>
    fetchAPI<void>(`/products/${id}`, {
      method: 'DELETE',
    }),

  // 添加 SKU
  addSKU: (productId: string, sku: ProductSKU) =>
    fetchAPI<ProductSKU>(`/products/${productId}/skus`, {
      method: 'POST',
      body: JSON.stringify(sku),
    }),

  // 更新 SKU
  updateSKU: (productId: string, skuId: string, updates: Partial<ProductSKU>) =>
    fetchAPI<ProductSKU>(`/products/${productId}/skus/${skuId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // 删除 SKU
  deleteSKU: (productId: string, skuId: string) =>
    fetchAPI<void>(`/products/${productId}/skus/${skuId}`, {
      method: 'DELETE',
    }),
};

// 库存 API
export const inventoryAPI = {
  // 获取所有库存
  getAll: () => fetchAPI<InventoryRecord[]>('/inventory'),

  // 获取单个 SKU 库存
  getBySKU: (skuId: string) => fetchAPI<InventoryRecord>(`/inventory/${skuId}`),

  // 获取产品下的所有库存
  getByProduct: (productId: string) =>
    fetchAPI<InventoryRecord[]>(`/inventory/product/${productId}`),

  // 更新库存
  update: (skuId: string, updates: Partial<InventoryRecord>) =>
    fetchAPI<InventoryRecord>(`/inventory/${skuId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // 更新安全库存
  updateSafetyStock: (skuId: string, safetyStock: number) =>
    fetchAPI<InventoryRecord>(`/inventory/${skuId}/safety-stock`, {
      method: 'PUT',
      body: JSON.stringify({ safetyStock }),
    }),

  // 获取仪表盘统计
  getDashboardStats: () => fetchAPI<DashboardStats>('/inventory/stats/dashboard'),
};

// 入库 API
export const inboundAPI = {
  // 获取所有入库记录
  getAll: () => fetchAPI<InboundRecord[]>('/inbound'),

  // 获取单个入库记录
  getById: (id: string) => fetchAPI<InboundRecord>(`/inbound/${id}`),

  // 创建入库记录
  create: (record: Omit<InboundRecord, 'id' | 'orderNo' | 'createdAt'>) =>
    fetchAPI<InboundRecord>('/inbound', {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  // 更新入库记录
  update: (id: string, updates: Partial<InboundRecord>) =>
    fetchAPI<InboundRecord>(`/inbound/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // 删除入库记录
  delete: (id: string) =>
    fetchAPI<void>(`/inbound/${id}`, {
      method: 'DELETE',
    }),

  // 导入 Coupang 数据
  importCoupang: (data: {
    items: Array<{
      skuId: string;
      skuCode: string;
      productId: string;
      productName: string;
      size: string;
      quantity: number;
      unitPrice: DualPrice;
      coupangInboundNo?: string;
      logisticsCenter?: string;
      waybillNo?: string;
    }>;
    operator?: string;
    remark?: string;
  }) =>
    fetchAPI<InboundRecord[]>('/inbound/import-coupang', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 出库 API
export const outboundAPI = {
  // 获取所有出库记录
  getAll: () => fetchAPI<OutboundRecord[]>('/outbound'),

  // 获取单个出库记录
  getById: (id: string) => fetchAPI<OutboundRecord>(`/outbound/${id}`),

  // 创建出库记录
  create: (record: Omit<OutboundRecord, 'id' | 'orderNo' | 'createdAt'>) =>
    fetchAPI<OutboundRecord>('/outbound', {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  // 更新出库记录
  update: (id: string, updates: Partial<OutboundRecord>) =>
    fetchAPI<OutboundRecord>(`/outbound/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // 删除出库记录
  delete: (id: string) =>
    fetchAPI<void>(`/outbound/${id}`, {
      method: 'DELETE',
    }),
};

// 导入类型
import type {
  Product,
  ProductSKU,
  InventoryRecord,
  InboundRecord,
  OutboundRecord,
  DashboardStats,
  DualPrice,
} from '@/types';
