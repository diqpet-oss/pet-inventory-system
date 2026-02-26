import { findSKUByCode, allSKUs } from './products';
import type { InboundRecord } from '@/types';

// Coupang入库单数据结构
export interface CoupangInboundData {
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
}

// 解析Coupang PDF文本数据 - 优化版，解决乱码问题
export const parseCoupangData = (text: string): CoupangInboundData | null => {
  const result: CoupangInboundData = {
    inboundNo: '',
    expectedDate: '',
    logisticsCenter: '',
    waybillNo: '',
    items: []
  };

  try {
    // 清理文本 - 移除乱码字符，保留有效内容
    const cleanedText = text
      .replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f]/g, '') // 移除控制字符
      .replace(/\uFFFD/g, '') // 移除替换字符
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();

    // 提取入库编号 (IR开头)
    const inboundMatch = cleanedText.match(/IR\d+/);
    if (inboundMatch) result.inboundNo = inboundMatch[0];

    // 提取日期 (YYYY/MM/DD 或 YYYY-MM-DD)
    const dateMatch = cleanedText.match(/(\d{4}[\/\-]\d{2}[\/\-]\d{2})/);
    if (dateMatch) result.expectedDate = dateMatch[1].replace(/\//g, '-');

    // 提取物流中心 (CN开头)
    const centerMatch = cleanedText.match(/(CN\d[A-Z_]+)/);
    if (centerMatch) result.logisticsCenter = centerMatch[1];

    // 提取运单号 (sf开头)
    const waybillMatch = cleanedText.match(/(sf\d+)/i);
    if (waybillMatch) result.waybillNo = waybillMatch[1];

    // 提取商品信息 - 基于产品编号匹配
    // 遍历所有已知SKU，在文本中查找匹配
    const foundItems: Map<string, { skuCode: string; productId: string; productName: string; size: string; quantity: number; sellerBarcode: string }> = new Map();
    
    // 产品名称映射
    const productNameMap: Record<string, string> = {
      '9312183755': '狗狗冲锋衣',
      '9286790289': '大狗居家服'
    };

    // 尝试从文本中提取数量信息
    // 策略：查找产品编号附近的数字
    for (const sku of allSKUs) {
      const skuCode = sku.skuCode;
      
      // 在文本中查找产品编号
      const skuIndex = cleanedText.indexOf(skuCode);
      if (skuIndex !== -1) {
        // 找到产品编号，提取周围文本
        const contextStart = Math.max(0, skuIndex - 200);
        const contextEnd = Math.min(cleanedText.length, skuIndex + 200);
        const context = cleanedText.substring(contextStart, contextEnd);
        
        // 尝试提取数量 - 查找产品编号后的数字
        // 通常数量在产品编号后不远处
        const afterSku = cleanedText.substring(skuIndex, skuIndex + 100);
        
        // 查找数量 - 通常是1-3位数字
        const quantityMatches = afterSku.match(/\b(\d{1,3})\b/g);
        let quantity = 0;
        
        if (quantityMatches) {
          // 过滤合理的数量值 (1-999)
          const validQuantities = quantityMatches
            .map(q => parseInt(q, 10))
            .filter(q => q >= 1 && q <= 999);
          
          if (validQuantities.length > 0) {
            quantity = validQuantities[0];
          }
        }
        
        // 如果找不到数量，尝试从整个文本中查找该SKU对应的数量模式
        if (quantity === 0) {
          // 查找该SKU后面跟着的数字
          const pattern = new RegExp(`${skuCode}[^\d]*(\d{1,3})`);
          const match = cleanedText.match(pattern);
          if (match) {
            quantity = parseInt(match[1], 10);
          }
        }
        
        // 提取卖家条形码（尺码信息）
        let sellerBarcode = '';
        const sizePattern = new RegExp(`[_-]?(${sku.size})[(_\s]`, 'i');
        const sizeMatch = context.match(sizePattern);
        if (sizeMatch) {
          // 提取包含尺码的片段
          const sizeIndex = context.indexOf(sizeMatch[0]);
          sellerBarcode = context.substring(Math.max(0, sizeIndex - 20), sizeIndex + 20).trim();
        }
        
        // 如果找到了数量，添加到结果
        if (quantity > 0) {
          foundItems.set(skuCode, {
            skuCode: sku.skuCode,
            productId: sku.productId,
            productName: productNameMap[sku.productId] || sku.productName,
            size: sku.size,
            quantity,
            sellerBarcode: sellerBarcode || `_${sku.size}`
          });
        }
      }
    }

    // 如果没有通过SKU Code匹配到，尝试通过其他方式
    if (foundItems.size === 0) {
      // 备用方案：尝试通过产品ID匹配
      for (const sku of allSKUs) {
        const productIdIndex = cleanedText.indexOf(sku.productId);
        if (productIdIndex !== -1) {
          // 找到产品ID，尝试提取附近数量
          const nearbyText = cleanedText.substring(productIdIndex, productIdIndex + 150);
          const qtyMatch = nearbyText.match(/\b(\d{1,3})\b/);
          
          if (qtyMatch) {
            const quantity = parseInt(qtyMatch[1], 10);
            if (quantity > 0 && quantity < 1000) {
              foundItems.set(sku.skuCode, {
                skuCode: sku.skuCode,
                productId: sku.productId,
                productName: productNameMap[sku.productId] || sku.productName,
                size: sku.size,
                quantity,
                sellerBarcode: `_${sku.size}`
              });
            }
          }
        }
      }
    }

    result.items = Array.from(foundItems.values());
    
    // 按尺码排序
    result.items.sort((a, b) => {
      const sizeOrder = ['XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL'];
      return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
    });

    return result;
  } catch (error) {
    console.error('解析Coupang数据失败:', error);
    return null;
  }
};

// 验证解析结果
export const validateCoupangData = (data: CoupangInboundData | null): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data) {
    return { valid: false, errors: ['解析失败，数据为空'] };
  }
  
  if (!data.inboundNo) {
    errors.push('未找到入库单号');
  }
  
  if (!data.expectedDate) {
    errors.push('未找到预计入库日期');
  }
  
  if (!data.logisticsCenter) {
    errors.push('未找到物流中心信息');
  }
  
  if (data.items.length === 0) {
    errors.push('未找到任何商品信息');
  }
  
  // 验证每个商品
  data.items.forEach((item, index) => {
    if (!item.skuCode) {
      errors.push(`第${index + 1}行: 产品编号缺失`);
    }
    if (item.quantity <= 0) {
      errors.push(`第${index + 1}行: 数量无效`);
    }
    // 验证SKU是否存在于系统中
    const sku = findSKUByCode(item.skuCode);
    if (!sku) {
      errors.push(`第${index + 1}行: 产品编号 ${item.skuCode} 不在系统产品列表中`);
    }
  });
  
  return { valid: errors.length === 0, errors };
};

// 将Coupang数据转换为入库记录
export const convertToInboundRecords = (
  coupangData: CoupangInboundData,
  operator: string = '系统导入',
  remark: string = ''
): Omit<InboundRecord, 'id' | 'orderNo' | 'createdAt'>[] => {
  return coupangData.items.map(item => {
    const sku = findSKUByCode(item.skuCode);
    if (!sku) {
      throw new Error(`SKU ${item.skuCode} 不存在`);
    }
    
    const now = new Date();
    return {
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
      remark: remark || `Coupang入库单导入 - ${coupangData.inboundNo}`
    };
  });
};
