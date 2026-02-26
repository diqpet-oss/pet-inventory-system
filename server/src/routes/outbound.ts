import express from 'express';
import OutboundRecord from '../models/OutboundRecord';
import Inventory from '../models/Inventory';

const router = express.Router();

// 计算库存状态
const calculateStatus = (quantity: number, safetyStock: number): 'normal' | 'warning' | 'outOfStock' => {
  if (quantity === 0) return 'outOfStock';
  if (quantity < safetyStock) return 'warning';
  return 'normal';
};

// 获取所有出库记录
router.get('/', async (req, res) => {
  try {
    const records = await OutboundRecord.find().sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取出库记录失败', error });
  }
});

// 获取单个出库记录
router.get('/:id', async (req, res) => {
  try {
    const record = await OutboundRecord.findOne({ id: req.params.id });
    if (!record) {
      return res.status(404).json({ success: false, message: '出库记录不存在' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取出库记录失败', error });
  }
});

// 创建出库记录
router.post('/', async (req, res) => {
  try {
    const {
      id,
      orderNo,
      skuId,
      skuCode,
      productId,
      productName,
      size,
      quantity,
      unitPrice,
      totalAmount,
      type,
      channel,
      operator,
      remark
    } = req.body;

    // 检查库存是否充足
    const inventory = await Inventory.findOne({ skuId });
    if (!inventory) {
      return res.status(400).json({ success: false, message: '库存记录不存在' });
    }

    if (inventory.quantity < quantity) {
      return res.status(400).json({ success: false, message: '库存不足' });
    }

    // 创建出库记录
    const record = new OutboundRecord({
      id,
      orderNo,
      skuId,
      skuCode,
      productId,
      productName,
      size,
      quantity,
      unitPrice,
      totalAmount,
      type,
      channel,
      operator,
      remark,
      createdAt: new Date().toISOString().slice(0, 10)
    });

    await record.save();

    // 更新库存
    inventory.quantity -= quantity;
    inventory.totalOutbound += quantity;
    inventory.status = calculateStatus(inventory.quantity, inventory.safetyStock);
    inventory.lastUpdated = new Date().toISOString().slice(0, 10);
    await inventory.save();

    res.json({ success: true, data: record, message: '出库记录创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建出库记录失败', error });
  }
});

// 更新出库记录
router.put('/:id', async (req, res) => {
  try {
    const record = await OutboundRecord.findOne({ id: req.params.id });
    if (!record) {
      return res.status(404).json({ success: false, message: '出库记录不存在' });
    }

    const oldQuantity = record.quantity;
    const newQuantity = req.body.quantity;

    // 如果数量变化，检查库存
    if (newQuantity !== undefined && newQuantity !== oldQuantity) {
      const inventory = await Inventory.findOne({ skuId: record.skuId });
      if (inventory) {
        const diff = newQuantity - oldQuantity;
        if (inventory.quantity < diff) {
          return res.status(400).json({ success: false, message: '库存不足' });
        }
      }
    }

    // 更新记录
    Object.assign(record, req.body);
    await record.save();

    // 如果数量变化，更新库存
    if (newQuantity !== undefined && newQuantity !== oldQuantity) {
      const inventory = await Inventory.findOne({ skuId: record.skuId });
      if (inventory) {
        const diff = oldQuantity - newQuantity;
        inventory.quantity += diff;
        inventory.totalOutbound -= diff;
        inventory.status = calculateStatus(inventory.quantity, inventory.safetyStock);
        inventory.lastUpdated = new Date().toISOString().slice(0, 10);
        await inventory.save();
      }
    }

    res.json({ success: true, data: record, message: '出库记录更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新出库记录失败', error });
  }
});

// 删除出库记录
router.delete('/:id', async (req, res) => {
  try {
    const record = await OutboundRecord.findOne({ id: req.params.id });
    if (!record) {
      return res.status(404).json({ success: false, message: '出库记录不存在' });
    }

    // 恢复库存
    const inventory = await Inventory.findOne({ skuId: record.skuId });
    if (inventory) {
      inventory.quantity += record.quantity;
      inventory.totalOutbound = Math.max(0, inventory.totalOutbound - record.quantity);
      inventory.status = calculateStatus(inventory.quantity, inventory.safetyStock);
      inventory.lastUpdated = new Date().toISOString().slice(0, 10);
      await inventory.save();
    }

    await OutboundRecord.deleteOne({ id: req.params.id });

    res.json({ success: true, message: '出库记录删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除出库记录失败', error });
  }
});

export default router;
