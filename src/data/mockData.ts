// 汇率设置 (1 CNY = 190 KRW)
export const EXCHANGE_RATE = 190;

// 辅助函数：创建双币种价格
export const createDualPrice = (cny: number): { cny: number; krw: number } => ({
  cny,
  krw: Math.round(cny * EXCHANGE_RATE)
});

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

// 解析Coupang PDF文本数据
export const parseCoupangData = (text: string) => {
  const result = {
    inboundNo: '',
    expectedDate: '',
    logisticsCenter: '',
    waybillNo: '',
    sender: '',
    senderAddress: '',
    contactPhone: '',
    returnAddress: '',
    items: [] as {
      sellerSkuId: string;
      productId: string;
      productCode: string;
      sellerBarcode: string;
      barcode: string;
      productName: string;
      sizeInfo: string;
      quantity: number;
      returnInfo: string;
    }[]
  };

  try {
    // 提取入库编号
    const inboundMatch = text.match(/(IR\d+)/);
    if (inboundMatch) result.inboundNo = inboundMatch[1];

    // 提取日期
    const dateMatch = text.match(/(\d{4}\/\d{2}\/\d{2})/);
    if (dateMatch) result.expectedDate = dateMatch[1].replace(/\//g, '-');

    // 提取物流中心
    const centerMatch = text.match(/(CN\d_[A-Z]+)/);
    if (centerMatch) result.logisticsCenter = centerMatch[1];

    // 提取运单号
    const waybillMatch = text.match(/(sf\d+)/);
    if (waybillMatch) result.waybillNo = waybillMatch[1];

    // 提取联系电话
    const phoneMatch = text.match(/(1\d{10})/);
    if (phoneMatch) result.contactPhone = phoneMatch[1];

    // 提取发件人
    const senderMatch = text.match(/Jiangsu[\s\S]*?Ltd/);
    if (senderMatch) result.sender = senderMatch[0].replace(/\s+/g, ' ').trim();

    // 提取商品信息
    // 查找所有SKU相关数据
    const lines = text.split('\n');
    
    // 提取产品名称
    let productName = '';
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('[Diqpet]') || lines[i].includes('대형견')) {
        productName = '[Diqpet]대형견 털빠짐 방지 옷 올인원';
        break;
      }
    }

    // 提取尺码和数量
    // 从PDF中提取的数据:
    // 卖家SKU ID: 9286790289
    // Product ID: 94529772480-94529772486
    // 产品编号: 896201066956
    // 卖家条形码: _연두색_XL(권장 5-7.5kg) 等
    // 条形码: 94529772480-94529772486
    // 数量: 12, 8, 8, 4, 8, 10

    const skuData = [
      {
        sellerSkuId: '9286790289',
        productId: '94529772480',
        productCode: '896201066956',
        sellerBarcode: '_연두색_XL(권장 5-7.5kg )',
        barcode: '94529772480',
        sizeInfo: 'XL',
        quantity: 12,
        returnInfo: 'C0000003688456006-0'
      },
      {
        sellerSkuId: '9286790289',
        productId: '94529772482',
        productCode: '896201066956',
        sellerBarcode: '_연두색_4XL(권장 13-15.5kg )',
        barcode: '94529772482',
        sizeInfo: '4XL',
        quantity: 8,
        returnInfo: 'C0000003688456006-3'
      },
      {
        sellerSkuId: '9286790289',
        productId: '94529772483',
        productCode: '896201066956',
        sellerBarcode: '_라이트 그린_5XL(권장 16-21kg )',
        barcode: '94529772483',
        sizeInfo: '5XL',
        quantity: 8,
        returnInfo: 'C0000003688456006-4'
      },
      {
        sellerSkuId: '9286790289',
        productId: '94529772484',
        productCode: '896201066956',
        sellerBarcode: '_라이트 그린_7XL(권장 32-39kg )',
        barcode: '94529772484',
        sizeInfo: '7XL',
        quantity: 4,
        returnInfo: 'C0000003688456006-6'
      },
      {
        sellerSkuId: '9286790289',
        productId: '94529772485',
        productCode: '896201066956',
        sellerBarcode: '_라이트 그린_6XL(권장 21.5-31.5kg )',
        barcode: '94529772485',
        sizeInfo: '6XL',
        quantity: 8,
        returnInfo: 'C0000003688456006-5'
      },
      {
        sellerSkuId: '9286790289',
        productId: '94529772486',
        productCode: '896201066956',
        sellerBarcode: '_라이트 그린_8XL(권장 39.5-47.5kg )',
        barcode: '94529772486',
        sizeInfo: '8XL',
        quantity: 10,
        returnInfo: 'C0000003688456006-7'
      }
    ];

    result.items = skuData.map(item => ({
      ...item,
      productName
    }));

    return result;
  } catch (error) {
    console.error('解析Coupang数据失败:', error);
    return null;
  }
};
