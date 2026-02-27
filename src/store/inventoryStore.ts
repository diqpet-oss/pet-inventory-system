import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Product, 
  ProductSKU, 
  InventoryRecord, 
  InboundRecord, 
  OutboundRecord, 
  PurchasePlan,
  PurchaseOrder,
  DualPrice
} from '@/types';
import { allProducts, allSKUs } from '@/data/products';
import { inboundAPI, inventoryAPI } from '@/services/api';

// 生成唯一ID
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 生成订单号
const generateOrderNo = (prefix: string) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${date}-${random}`;
};

// 计算库存状态
const calculateStatus = (quantity: number, safetyStock: number): 'normal' | 'warning' | 'outOfStock' => {
  if (quantity === 0) return 'outOfStock';
  if (quantity < safetyStock) return 'warning';
  return 'normal';
};

// 初始化库存记录（空库存）
const initializeInventory = (): InventoryRecord[] => {
  return allSKUs.map(sku => ({
    skuId: sku.id,
    skuCode: sku.skuCode,
    productId: sku.productId,
    productName: sku.productName,
    size: sku.size,
    quantity: 0,
    totalInbound: 0,
    totalOutbound: 0,
    purchasePrice: sku.purchasePrice,
    salePrice: sku.salePrice,
    safetyStock: 10,
    maxStock: 100,
    status: 'outOfStock',
    lastUpdated: new Date().toISOString().slice(0, 10)
  }));
};

interface InventoryState {
  // 基础数据（只读，从products.ts导入）
  products: Product[];
  skus: ProductSKU[];
  
  // 业务数据
  inventory: InventoryRecord[];           // 库存台账（按SKU累计）
  inboundRecords: InboundRecord[];        // 入库记录
  outboundRecords: OutboundRecord[];      // 出库记录
  purchasePlans: PurchasePlan[];          // 采购计划
  purchaseOrders: PurchaseOrder[];        // 采购单
  
  // 库存操作
  updateInventory: (skuId: string, updates: Partial<InventoryRecord>) => void;
  updateSafetyStock: (skuId: string, safetyStock: number) => void;
  updateMaxStock: (skuId: string, maxStock: number) => void;
  getInventoryBySKU: (skuId: string) => InventoryRecord | undefined;
  getInventoryByProductId: (productId: string) => InventoryRecord[];
  
  // 入库操作
  addInbound: (record: Omit<InboundRecord, 'id' | 'orderNo' | 'createdAt'>) => void;
  updateInbound: (id: string, updates: Partial<InboundRecord>) => void;
  deleteInbound: (id: string) => void;
  importCoupangInbound: (coupangData: {
    inboundNo: string;
    expectedDate: string;
    logisticsCenter: string;
    waybillNo: string;
    items: {
      skuCode: string;
      productId: string;
      productName: string;
      size: string;
      quantity: number;
      sellerBarcode: string;
    }[];
  }, operator?: string, remark?: string) => { success: boolean; message: string; importedCount: number };
  
  // 出库操作
  addOutbound: (record: Omit<OutboundRecord, 'id' | 'orderNo' | 'createdAt'>) => void;
  updateOutbound: (id: string, updates: Partial<OutboundRecord>) => void;
  deleteOutbound: (id: string) => void;
  
  // 采购计划操作
  generatePurchasePlans: () => void;
  updatePurchasePlan: (id: string, updates: Partial<PurchasePlan>) => void;
  togglePurchasePlanSelection: (id: string) => void;
  selectAllPurchasePlans: (selected: boolean) => void;
  
  // 采购单操作
  createPurchaseOrder: (items: PurchasePlan[], supplier: string, remark?: string) => PurchaseOrder | null;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  
  // 统计数据
  getDashboardStats: () => {
    totalSKUs: number;
    totalInventory: number;
    warningItems: number;
    outOfStockItems: number;
    normalItems: number;
    inventoryValue: DualPrice;
  };
  
  // 数据管理
  resetAllData: () => void;
  
  // 从云端加载数据
  loadFromCloud: () => Promise<void>;
  
  // 产品管理
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addProductSKU: (productId: string, sku: ProductSKU) => void;
  updateProductSKU: (productId: string, skuId: string, updates: Partial<ProductSKU>) => void;
  deleteProductSKU: (productId: string, skuId: string) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      // 基础数据
      products: allProducts,
      skus: allSKUs,
      
      // 业务数据 - 初始化为空
      inventory: initializeInventory(),
      inboundRecords: [],
      outboundRecords: [],
      purchasePlans: [],
      purchaseOrders: [],
      
      // 更新库存记录
      updateInventory: (skuId, updates) => {
        set(state => ({
          inventory: state.inventory.map(item => {
            if (item.skuId === skuId) {
              const newQuantity = updates.quantity ?? item.quantity;
              const safetyStock = updates.safetyStock ?? item.safetyStock;
              return {
                ...item,
                ...updates,
                status: calculateStatus(newQuantity, safetyStock),
                lastUpdated: new Date().toISOString().slice(0, 10)
              };
            }
            return item;
          })
        }));
      },
      
      // 更新安全库存
      updateSafetyStock: (skuId, safetyStock) => {
        set(state => ({
          inventory: state.inventory.map(item => {
            if (item.skuId === skuId) {
              return {
                ...item,
                safetyStock,
                status: calculateStatus(item.quantity, safetyStock),
                lastUpdated: new Date().toISOString().slice(0, 10)
              };
            }
            return item;
          })
        }));
      },
      
      // 更新最大库存
      updateMaxStock: (skuId, maxStock) => {
        set(state => ({
          inventory: state.inventory.map(item => {
            if (item.skuId === skuId) {
              return {
                ...item,
                maxStock,
                lastUpdated: new Date().toISOString().slice(0, 10)
              };
            }
            return item;
          })
        }));
      },
      
      // 根据SKU获取库存
      getInventoryBySKU: (skuId) => {
        return get().inventory.find(item => item.skuId === skuId);
      },
      
      // 根据产品ID获取库存列表
      getInventoryByProductId: (productId) => {
        return get().inventory.filter(item => item.productId === productId);
      },
      
      // 添加入库记录
      addInbound: async (record) => {
        const now = new Date();
        const newRecord: InboundRecord = {
          ...record,
          id: generateId('in'),
          orderNo: generateOrderNo('GR'),
          inboundDate: record.inboundDate || now.toISOString().slice(0, 10),
          inboundTime: record.inboundTime || now.toTimeString().slice(0, 5),
          createdAt: now.toISOString().slice(0, 10)
        };
        
        // 先更新本地状态（乐观更新）
        set(state => {
          // 更新库存 - 累计数量
          const newInventory = state.inventory.map(item => {
            if (item.skuId === record.skuId) {
              const newQuantity = item.quantity + record.quantity;
              return {
                ...item,
                quantity: newQuantity,
                totalInbound: item.totalInbound + record.quantity,
                status: calculateStatus(newQuantity, item.safetyStock),
                lastUpdated: new Date().toISOString().slice(0, 10)
              };
            }
            return item;
          });
          
          return { 
            inboundRecords: [newRecord, ...state.inboundRecords],
            inventory: newInventory
          };
        });
        
        // 调用后端API保存到云端
        try {
          const result = await inboundAPI.create(newRecord);
          if (!result.success) {
            console.error('保存入库记录到云端失败:', result.message);
          } else {
            console.log('入库记录已保存到云端');
          }
        } catch (error) {
          console.error('调用入库API失败:', error);
        }
        
        // 更新采购计划
        get().generatePurchasePlans();
      },
      
      // 更新入库记录
      updateInbound: async (id, updates) => {
        // 先更新本地状态
        set(state => ({
          inboundRecords: state.inboundRecords.map(r => 
            r.id === id ? { ...r, ...updates } : r
          )
        }));
        
        // 调用后端API更新云端数据
        try {
          const result = await inboundAPI.update(id, updates);
          if (!result.success) {
            console.error('更新云端入库记录失败:', result.message);
          } else {
            console.log('云端入库记录已更新');
          }
        } catch (error) {
          console.error('调用更新入库API失败:', error);
        }
      },
      
      // 删除入库记录
      deleteInbound: async (id) => {
        // 先更新本地状态
        set(state => {
          const record = state.inboundRecords.find(r => r.id === id);
          if (!record) return state;
          
          // 扣减库存
          const newInventory = state.inventory.map(item => {
            if (item.skuId === record.skuId) {
              const newQuantity = Math.max(0, item.quantity - record.quantity);
              return {
                ...item,
                quantity: newQuantity,
                totalInbound: Math.max(0, item.totalInbound - record.quantity),
                status: calculateStatus(newQuantity, item.safetyStock),
                lastUpdated: new Date().toISOString().slice(0, 10)
              };
            }
            return item;
          });
          
          return {
            inboundRecords: state.inboundRecords.filter(r => r.id !== id),
            inventory: newInventory
          };
        });
        
        // 调用后端API删除云端数据
        try {
          const result = await inboundAPI.delete(id);
          if (!result.success) {
            console.error('删除云端入库记录失败:', result.message);
          } else {
            console.log('云端入库记录已删除');
          }
        } catch (error) {
          console.error('调用删除入库API失败:', error);
        }
        
        get().generatePurchasePlans();
      },
      
      // 导入Coupang入库数据
      importCoupangInbound: (coupangData, operator = '系统导入', remark = '') => {
        const state = get();
        let importedCount = 0;
        
        try {
          const newRecords: InboundRecord[] = [];
          
          coupangData.items.forEach(item => {
            // 查找对应的SKU
            const sku = state.skus.find(s => s.skuCode === item.skuCode);
            if (!sku) {
              console.warn(`SKU ${item.skuCode} 未找到，跳过`);
              return;
            }
            
            const now = new Date();
            const record: InboundRecord = {
              id: generateId('in'),
              orderNo: generateOrderNo('GR'),
              skuId: sku.id,
              skuCode: item.skuCode,
              productId: item.productId,
              productName: item.productName,
              size: item.size,
              quantity: item.quantity,
              unitPrice: sku.purchasePrice,
              totalAmount: {
                cny: sku.purchasePrice.cny * item.quantity,
                krw: sku.purchasePrice.krw * item.quantity
              },
              inboundDate: now.toISOString().slice(0, 10),
              inboundTime: now.toTimeString().slice(0, 5),
              coupangInboundNo: coupangData.inboundNo,
              logisticsCenter: coupangData.logisticsCenter,
              waybillNo: coupangData.waybillNo,
              supplier: 'Coupang直发',
              operator,
              remark: remark || `Coupang入库单导入 - ${coupangData.inboundNo}`,
              createdAt: now.toISOString().slice(0, 10)
            };
            
            newRecords.push(record);
            importedCount++;
          });
          
          if (importedCount === 0) {
            return { success: false, message: '没有可导入的商品数据', importedCount: 0 };
          }
          
          set(state => {
            // 更新库存 - 累计数量
            const newInventory = [...state.inventory];
            
            newRecords.forEach(record => {
              const index = newInventory.findIndex(item => item.skuId === record.skuId);
              if (index !== -1) {
                const item = newInventory[index];
                const newQuantity = item.quantity + record.quantity;
                newInventory[index] = {
                  ...item,
                  quantity: newQuantity,
                  totalInbound: item.totalInbound + record.quantity,
                  status: calculateStatus(newQuantity, item.safetyStock),
                  lastUpdated: new Date().toISOString().slice(0, 10)
                };
              }
            });
            
            return {
              inboundRecords: [...newRecords, ...state.inboundRecords],
              inventory: newInventory
            };
          });
          
          // 更新采购计划
          get().generatePurchasePlans();
          
          return { 
            success: true, 
            message: `成功导入 ${importedCount} 条入库记录`, 
            importedCount 
          };
        } catch (error) {
          console.error('导入Coupang数据失败:', error);
          return { 
            success: false, 
            message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`, 
            importedCount: 0 
          };
        }
      },
      
      // 添加出库记录
      addOutbound: (record) => {
        const newRecord: OutboundRecord = {
          ...record,
          id: generateId('out'),
          orderNo: generateOrderNo('GI'),
          createdAt: new Date().toISOString().slice(0, 10)
        };
        
        set(state => {
          // 更新库存 - 扣减数量
          const newInventory = state.inventory.map(item => {
            if (item.skuId === record.skuId) {
              const newQuantity = Math.max(0, item.quantity - record.quantity);
              return {
                ...item,
                quantity: newQuantity,
                totalOutbound: item.totalOutbound + record.quantity,
                status: calculateStatus(newQuantity, item.safetyStock),
                lastUpdated: new Date().toISOString().slice(0, 10)
              };
            }
            return item;
          });
          
          return { 
            outboundRecords: [newRecord, ...state.outboundRecords],
            inventory: newInventory
          };
        });
        
        // 更新采购计划
        get().generatePurchasePlans();
      },
      
      // 更新出库记录
      updateOutbound: (id, updates) => {
        set(state => ({
          outboundRecords: state.outboundRecords.map(r => 
            r.id === id ? { ...r, ...updates } : r
          )
        }));
      },
      
      // 删除出库记录
      deleteOutbound: (id) => {
        set(state => {
          const record = state.outboundRecords.find(r => r.id === id);
          if (!record) return state;
          
          // 恢复库存
          const newInventory = state.inventory.map(item => {
            if (item.skuId === record.skuId) {
              const newQuantity = item.quantity + record.quantity;
              return {
                ...item,
                quantity: newQuantity,
                totalOutbound: Math.max(0, item.totalOutbound - record.quantity),
                status: calculateStatus(newQuantity, item.safetyStock),
                lastUpdated: new Date().toISOString().slice(0, 10)
              };
            }
            return item;
          });
          
          return {
            outboundRecords: state.outboundRecords.filter(r => r.id !== id),
            inventory: newInventory
          };
        });
        
        get().generatePurchasePlans();
      },
      
      // 生成采购计划
      generatePurchasePlans: () => {
        set(state => {
          const plans: PurchasePlan[] = state.inventory
            .filter(item => item.quantity < item.safetyStock)
            .map(item => {
              const needPurchase = item.quantity < item.safetyStock;
              const suggestedPurchase = needPurchase 
                ? Math.max(item.maxStock - item.quantity, item.safetyStock * 2)
                : 0;
              
              let priority: PurchasePlan['priority'] = 'none';
              if (item.quantity === 0) priority = 'highest';
              else if (item.quantity < item.safetyStock * 0.5) priority = 'high';
              else if (item.quantity < item.safetyStock) priority = 'medium';
              
              return {
                id: generateId('plan'),
                skuId: item.skuId,
                skuCode: item.skuCode,
                productId: item.productId,
                productName: item.productName,
                size: item.size,
                currentStock: item.quantity,
                safetyStock: item.safetyStock,
                suggestedPurchase,
                priority,
                estimatedCost: {
                  cny: suggestedPurchase * item.purchasePrice.cny,
                  krw: suggestedPurchase * item.purchasePrice.krw
                },
                isSelected: false
              };
            })
            .sort((a, b) => {
              const priorityOrder = { highest: 0, high: 1, medium: 2, low: 3, none: 4 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
          
          return { purchasePlans: plans };
        });
      },
      
      // 更新采购计划
      updatePurchasePlan: (id, updates) => {
        set(state => ({
          purchasePlans: state.purchasePlans.map(p => 
            p.id === id ? { ...p, ...updates } : p
          )
        }));
      },
      
      // 切换采购计划选择
      togglePurchasePlanSelection: (id) => {
        set(state => ({
          purchasePlans: state.purchasePlans.map(p => 
            p.id === id ? { ...p, isSelected: !p.isSelected } : p
          )
        }));
      },
      
      // 全选/取消全选
      selectAllPurchasePlans: (selected) => {
        set(state => ({
          purchasePlans: state.purchasePlans.map(p => ({ ...p, isSelected: selected }))
        }));
      },
      
      // 创建采购单
      createPurchaseOrder: (items, supplier, remark) => {
        if (items.length === 0) return null;
        
        const sku = get().skus.find(s => s.id === items[0].skuId);
        if (!sku) return null;
        
        const totalAmount: DualPrice = {
          cny: items.reduce((sum, i) => sum + i.estimatedCost.cny, 0),
          krw: items.reduce((sum, i) => sum + i.estimatedCost.krw, 0)
        };
        
        const newOrder: PurchaseOrder = {
          id: generateId('po'),
          orderNo: generateOrderNo('PO'),
          items,
          totalAmount,
          supplier,
          status: 'draft',
          createdAt: new Date().toISOString().slice(0, 10),
          remark
        };
        
        set(state => ({
          purchaseOrders: [newOrder, ...state.purchaseOrders]
        }));
        
        return newOrder;
      },
      
      // 更新采购单
      updatePurchaseOrder: (id, updates) => {
        set(state => ({
          purchaseOrders: state.purchaseOrders.map(o => 
            o.id === id ? { ...o, ...updates } : o
          )
        }));
      },
      
      // 删除采购单
      deletePurchaseOrder: (id) => {
        set(state => ({
          purchaseOrders: state.purchaseOrders.filter(o => o.id !== id)
        }));
      },
      
      // 获取仪表盘统计数据
      getDashboardStats: () => {
        const state = get();
        const totalSKUs = state.skus.length;
        const totalInventory = state.inventory.reduce((sum, i) => sum + i.quantity, 0);
        const warningItems = state.inventory.filter(i => i.status === 'warning').length;
        const outOfStockItems = state.inventory.filter(i => i.status === 'outOfStock').length;
        const normalItems = state.inventory.filter(i => i.status === 'normal').length;
        
        const inventoryValue = state.inventory.reduce((sum, i) => ({
          cny: sum.cny + i.quantity * i.purchasePrice.cny,
          krw: sum.krw + i.quantity * i.purchasePrice.krw
        }), { cny: 0, krw: 0 });
        
        return {
          totalSKUs,
          totalInventory,
          warningItems,
          outOfStockItems,
          normalItems,
          inventoryValue
        };
      },
      
      // 重置所有数据
      resetAllData: () => {
        set({
          inventory: initializeInventory(),
          inboundRecords: [],
          outboundRecords: [],
          purchasePlans: [],
          purchaseOrders: []
        });
      },
      
      // 从云端加载数据
      loadFromCloud: async () => {
        try {
          // 加载入库记录
          const inboundResult = await inboundAPI.getAll();
          if (inboundResult.success && inboundResult.data) {
            set({
              inboundRecords: inboundResult.data as InboundRecord[]
            });
            console.log('从云端加载入库记录:', inboundResult.data.length, '条');
          }
          
          // 加载库存数据
          const inventoryResult = await inventoryAPI.getAll();
          if (inventoryResult.success && inventoryResult.data) {
            set(state => {
              const cloudInventory = inventoryResult.data as InventoryRecord[];
              // 合并云端库存数据和本地库存数据
              const mergedInventory = state.inventory.map(localItem => {
                const cloudItem = cloudInventory.find(c => c.skuId === localItem.skuId);
                if (cloudItem) {
                  return {
                    ...localItem,
                    quantity: cloudItem.quantity,
                    totalInbound: cloudItem.totalInbound,
                    totalOutbound: cloudItem.totalOutbound,
                    status: cloudItem.status,
                    lastUpdated: cloudItem.lastUpdated
                  };
                }
                return localItem;
              });
              return { inventory: mergedInventory };
            });
            console.log('从云端加载库存数据成功');
          }
        } catch (error) {
          console.error('从云端加载数据失败:', error);
        }
      },
      
      // 添加新产品
      addProduct: (product) => {
        set(state => {
          // 检查产品ID是否已存在
          const exists = state.products.some(p => p.productId === product.productId);
          if (exists) {
            console.error('产品ID已存在');
            return state;
          }
          
          const newProducts = [...state.products, product];
          const newSkus = [...state.skus, ...product.skus];
          
          // 为新SKU创建库存记录
          const newInventory = [...state.inventory];
          for (const sku of product.skus) {
            const existsInventory = newInventory.find(i => i.skuId === sku.id);
            if (!existsInventory) {
              newInventory.push({
                skuId: sku.id,
                skuCode: sku.skuCode,
                productId: product.productId,
                productName: product.name,
                size: sku.size,
                quantity: 0,
                totalInbound: 0,
                totalOutbound: 0,
                purchasePrice: sku.purchasePrice,
                salePrice: sku.salePrice,
                safetyStock: 10,
                maxStock: 100,
                status: 'outOfStock',
                lastUpdated: new Date().toISOString().slice(0, 10)
              });
            }
          }
          
          return {
            products: newProducts,
            skus: newSkus,
            inventory: newInventory
          };
        });
      },
      
      // 更新产品
      updateProduct: (id, updates) => {
        set(state => {
          const productIndex = state.products.findIndex(p => p.id === id);
          if (productIndex === -1) return state;
          
          const updatedProducts = [...state.products];
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            ...updates,
          };
          
          // 如果更新了产品名称，同步更新库存记录
          let newInventory = state.inventory;
          const newName = updates.name;
          if (newName) {
            newInventory = state.inventory.map(item => {
              if (item.productId === updatedProducts[productIndex].productId) {
                return { ...item, productName: newName };
              }
              return item;
            });
          }
          
          return { products: updatedProducts, inventory: newInventory };
        });
      },
      
      // 删除产品
      deleteProduct: (id) => {
        set(state => {
          const product = state.products.find(p => p.id === id);
          if (!product) return state;
          
          const skuIds = product.skus.map(s => s.id);
          
          return {
            products: state.products.filter(p => p.id !== id),
            skus: state.skus.filter(s => !skuIds.includes(s.id)),
            inventory: state.inventory.filter(i => !skuIds.includes(i.skuId))
          };
        });
      },
      
      // 添加产品SKU
      addProductSKU: (productId, sku) => {
        set(state => {
          const productIndex = state.products.findIndex(p => p.productId === productId);
          if (productIndex === -1) return state;
          
          const updatedProducts = [...state.products];
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            skus: [...updatedProducts[productIndex].skus, sku]
          };
          
          const newSkus = [...state.skus, sku];
          
          // 创建库存记录
          const newInventoryItem: InventoryRecord = {
            skuId: sku.id,
            skuCode: sku.skuCode,
            productId,
            productName: updatedProducts[productIndex].name,
            size: sku.size,
            quantity: 0,
            totalInbound: 0,
            totalOutbound: 0,
            purchasePrice: sku.purchasePrice,
            salePrice: sku.salePrice,
            safetyStock: 10,
            maxStock: 100,
            status: 'outOfStock',
            lastUpdated: new Date().toISOString().slice(0, 10)
          };
          const newInventory = [...state.inventory, newInventoryItem];
          
          return { products: updatedProducts, skus: newSkus, inventory: newInventory };
        });
      },
      
      // 更新产品SKU
      updateProductSKU: (productId, skuId, updates) => {
        set(state => {
          const productIndex = state.products.findIndex(p => p.productId === productId);
          if (productIndex === -1) return state;
          
          const updatedProducts = [...state.products];
          const skuIndex = updatedProducts[productIndex].skus.findIndex(s => s.id === skuId);
          if (skuIndex === -1) return state;
          
          updatedProducts[productIndex].skus[skuIndex] = {
            ...updatedProducts[productIndex].skus[skuIndex],
            ...updates
          };
          
          const updatedSkus = state.skus.map(s => 
            s.id === skuId ? { ...s, ...updates } : s
          );
          
          // 同步更新库存记录
          const updatedInventory = state.inventory.map(item => {
            if (item.skuId === skuId) {
              return {
                ...item,
                skuCode: updates.skuCode ?? item.skuCode,
                size: updates.size ?? item.size,
                purchasePrice: updates.purchasePrice ?? item.purchasePrice,
                salePrice: updates.salePrice ?? item.salePrice
              };
            }
            return item;
          });
          
          return { 
            products: updatedProducts, 
            skus: updatedSkus,
            inventory: updatedInventory
          };
        });
      },
      
      // 删除产品SKU
      deleteProductSKU: (productId, skuId) => {
        set(state => {
          const productIndex = state.products.findIndex(p => p.productId === productId);
          if (productIndex === -1) return state;
          
          const updatedProducts = [...state.products];
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            skus: updatedProducts[productIndex].skus.filter(s => s.id !== skuId)
          };
          
          return {
            products: updatedProducts,
            skus: state.skus.filter(s => s.id !== skuId),
            inventory: state.inventory.filter(i => i.skuId !== skuId)
          };
        });
      }
    }),
    {
      name: 'pet-inventory-storage-v2',
      version: 1,
      // 只持久化业务数据，不持久化基础数据
      partialize: (state) => ({
        inventory: state.inventory,
        inboundRecords: state.inboundRecords,
        outboundRecords: state.outboundRecords,
        purchasePlans: state.purchasePlans,
        purchaseOrders: state.purchaseOrders
      })
    }
  )
);

// 声明XLSX全局变量
declare global {
  interface Window {
    XLSX: any;
  }
}
