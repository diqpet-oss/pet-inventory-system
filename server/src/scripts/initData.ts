import { connectDB } from '../config/database';
import Product from '../models/Product';
import Inventory from '../models/Inventory';

const EXCHANGE_RATE = 190;

const createDualPrice = (cny: number) => ({
  cny,
  krw: Math.round(cny * EXCHANGE_RATE)
});

const initData = async () => {
  await connectDB();

  // 清空现有数据
  await Product.deleteMany({});
  await Inventory.deleteMany({});

  // 产品1: 狗狗冲锋衣
  const product1SKUs = [
    { id: 'sku-001', productId: '9312183755', productName: '狗狗冲锋衣', skuCode: '94647662186', size: 'L', purchasePrice: createDualPrice(45), salePrice: createDualPrice(118) },
    { id: 'sku-002', productId: '9312183755', productName: '狗狗冲锋衣', skuCode: '94647662188', size: 'S', purchasePrice: createDualPrice(45), salePrice: createDualPrice(118) },
    { id: 'sku-003', productId: '9312183755', productName: '狗狗冲锋衣', skuCode: '94647662190', size: 'M', purchasePrice: createDualPrice(45), salePrice: createDualPrice(118) },
    { id: 'sku-004', productId: '9312183755', productName: '狗狗冲锋衣', skuCode: '94647662187', size: 'XL', purchasePrice: createDualPrice(48), salePrice: createDualPrice(128) },
    { id: 'sku-005', productId: '9312183755', productName: '狗狗冲锋衣', skuCode: '94647662189', size: 'XXL', purchasePrice: createDualPrice(52), salePrice: createDualPrice(138) }
  ];

  const product1 = {
    id: 'prod-001',
    name: '狗狗冲锋衣',
    productId: '9312183755',
    description: '户外防水防风冲锋衣',
    skus: product1SKUs
  };

  // 产品2: 大狗居家服
  const product2SKUs = [
    { id: 'sku-006', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772480', size: 'XL', purchasePrice: createDualPrice(42), salePrice: createDualPrice(108) },
    { id: 'sku-007', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772481', size: 'XXL', purchasePrice: createDualPrice(45), salePrice: createDualPrice(118) },
    { id: 'sku-008', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772488', size: '3XL', purchasePrice: createDualPrice(48), salePrice: createDualPrice(128) },
    { id: 'sku-009', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772482', size: '4XL', purchasePrice: createDualPrice(52), salePrice: createDualPrice(138) },
    { id: 'sku-010', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772483', size: '5XL', purchasePrice: createDualPrice(55), salePrice: createDualPrice(148) },
    { id: 'sku-011', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772485', size: '6XL', purchasePrice: createDualPrice(58), salePrice: createDualPrice(158) },
    { id: 'sku-012', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772484', size: '7XL', purchasePrice: createDualPrice(62), salePrice: createDualPrice(168) },
    { id: 'sku-013', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772486', size: '8XL', purchasePrice: createDualPrice(65), salePrice: createDualPrice(178) }
  ];

  const product2 = {
    id: 'prod-002',
    name: '大狗居家服',
    productId: '9286790289',
    description: '防掉毛舒适家居服',
    skus: product2SKUs
  };

  await Product.create(product1);
  await Product.create(product2);

  // 创建库存记录
  for (const sku of product1SKUs) {
    await Inventory.create({
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
    });
  }

  for (const sku of product2SKUs) {
    await Inventory.create({
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
    });
  }

  console.log('✅ 数据初始化完成');
  console.log(`- 产品数量: 2`);
  console.log(`- SKU数量: ${product1SKUs.length + product2SKUs.length}`);
  console.log(`- 库存记录: ${product1SKUs.length + product2SKUs.length}`);
  process.exit(0);
};

initData().catch(error => {
  console.error('❌ 初始化失败:', error);
  process.exit(1);
});
