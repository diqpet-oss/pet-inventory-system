import express from 'express';
import Inventory from '../models/Inventory';

const router = express.Router();

// 计算库存状态
const calculateStatus = (quantity: number, safetyStock: number): 'normal' | 'warning' | 'outOfStock' => {
  if (quantity === 0) return 'outOfStock';
  if (quantity < safetyStock) return 'warning';
  return 'normal';
};

// 获取所有库存
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取库存列表失败', error });
  }
});

// 获取单个SKU库存
router.get('/:skuId', async (req, res) => {
  try {
    const item = await Inventory.findOne({ skuId: req.params.skuId });
    if (!item) {
      return res.status(404).json({ success: false, message: '库存记录不存在' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取库存失败', error });
  }
});

// 获取产品下的所有库存
router.get('/product/:productId', async (req, res) => {
  try {
    const inventory = await Inventory.find({ productId: req.params.productId });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取库存列表失败', error });
  }
});

// 更新库存
router.put('/:skuId', async (req, res) => {
  try {
    const { quantity, safetyStock, maxStock } = req.body;

    const item = await Inventory.findOne({ skuId: req.params.skuId });
    if (!item) {
      return res.status(404).json({ success: false, message: '库存记录不存在' });
    }

    if (quantity !== undefined) item.quantity = quantity;
    if (safetyStock !== undefined) item.safetyStock = safetyStock;
    if (maxStock !== undefined) item.maxStock = maxStock;

    // 重新计算状态
    item.status = calculateStatus(item.quantity, item.safetyStock);
    item.lastUpdated = new Date().toISOString().slice(0, 10);

    await item.save();

    res.json({ success: true, data: item, message: '库存更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新库存失败', error });
  }
});

// 更新安全库存
router.put('/:skuId/safety-stock', async (req, res) => {
  try {
    const { safetyStock } = req.body;

    const item = await Inventory.findOne({ skuId: req.params.skuId });
    if (!item) {
      return res.status(404).json({ success: false, message: '库存记录不存在' });
    }

    item.safetyStock = safetyStock;
    item.status = calculateStatus(item.quantity, safetyStock);
    item.lastUpdated = new Date().toISOString().slice(0, 10);

    await item.save();

    res.json({ success: true, data: item, message: '安全库存更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新安全库存失败', error });
  }
});

// 获取仪表盘统计
router.get('/stats/dashboard', async (req, res) => {
  try {
    const allInventory = await Inventory.find();

    const totalSKUs = allInventory.length;
    const totalInventory = allInventory.reduce((sum, i) => sum + i.quantity, 0);
    const warningItems = allInventory.filter(i => i.status === 'warning').length;
    const outOfStockItems = allInventory.filter(i => i.status === 'outOfStock').length;
    const normalItems = allInventory.filter(i => i.status === 'normal').length;

    const inventoryValue = allInventory.reduce((sum, i) => ({
      cny: sum.cny + i.quantity * i.purchasePrice.cny,
      krw: sum.krw + i.quantity * i.purchasePrice.krw
    }), { cny: 0, krw: 0 });

    res.json({
      success: true,
      data: {
        totalSKUs,
        totalInventory,
        warningItems,
        outOfStockItems,
        normalItems,
        inventoryValue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取统计数据失败', error });
  }
});

export default router;
