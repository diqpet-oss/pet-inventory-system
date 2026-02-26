import express from 'express';
import InboundRecord from '../models/InboundRecord';
import Inventory from '../models/Inventory';

const router = express.Router();

// 计算库存状态
const calculateStatus = (quantity: number, safetyStock: number): 'normal' | 'warning' | 'outOfStock' => {
  if (quantity === 0) return 'outOfStock';
  if (quantity < safetyStock) return 'warning';
  return 'normal';
};

// 获取所有入库记录
router.get('/', async (req, res) => {
  try {
    const records = await InboundRecord.find().sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取入库记录失败', error });
  }
});

// 获取单个入库记录
router.get('/:id', async (req, res) => {
  try {
    const record = await InboundRecord.findOne({ id: req.params.id });
    if (!record) {
      return res.status(404).json({ success: false, message: '入库记录不存在' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取入库记录失败', error });
  }
});

// 创建入库记录
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
      inboundDate,
      inboundTime,
      supplier,
      operator,
      remark
    } = req.body;

    // 创建入库记录
    const record = new InboundRecord({
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
      inboundDate,
      inboundTime,
      supplier,
      operator,
      remark,
      createdAt: new Date().toISOString().slice(0, 10)
    });

    await record.save();

    // 更新库存
    const inventory = await Inventory.findOne({ skuId });
    if (inventory) {
      inventory.quantity += quantity;
      inventory.totalInbound += quantity;
      inventory.status = calculateStatus(inventory.quantity, inventory.safetyStock);
      inventory.lastUpdated = new Date().toISOString().slice(0, 10);
      await inventory.save();
    }

    res.json({ success: true, data: record, message: '入库记录创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建入库记录失败', error });
  }
});

// 更新入库记录
router.put('/:id', async (req, res) => {
  try {
    const record = await InboundRecord.findOne({ id: req.params.id });
    if (!record) {
      return res.status(404).json({ success: false, message: '入库记录不存在' });
    }

    const oldQuantity = record.quantity;
    const newQuantity = req.body.quantity;

    // 更新记录
    Object.assign(record, req.body);
    await record.save();

    // 如果数量变化，更新库存
    if (newQuantity !== undefined && newQuantity !== oldQuantity) {
      const inventory = await Inventory.findOne({ skuId: record.skuId });
      if (inventory) {
        inventory.quantity = inventory.quantity - oldQuantity + newQuantity;
        inventory.totalInbound = inventory.totalInbound - oldQuantity + newQuantity;
        inventory.status = calculateStatus(inventory.quantity, inventory.safetyStock);
        inventory.lastUpdated = new Date().toISOString().slice(0, 10);
        await inventory.save();
      }
    }

    res.json({ success: true, data: record, message: '入库记录更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新入库记录失败', error });
  }
});

// 删除入库记录
router.delete('/:id', async (req, res) => {
  try {
    const record = await InboundRecord.findOne({ id: req.params.id });
    if (!record) {
      return res.status(404).json({ success: false, message: '入库记录不存在' });
    }

    // 扣减库存
    const inventory = await Inventory.findOne({ skuId: record.skuId });
    if (inventory) {
      inventory.quantity = Math.max(0, inventory.quantity - record.quantity);
      inventory.totalInbound = Math.max(0, inventory.totalInbound - record.quantity);
      inventory.status = calculateStatus(inventory.quantity, inventory.safetyStock);
      inventory.lastUpdated = new Date().toISOString().slice(0, 10);
      await inventory.save();
    }

    await InboundRecord.deleteOne({ id: req.params.id });

    res.json({ success: true, message: '入库记录删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除入库记录失败', error });
  }
});

// 批量导入Coupang入库数据
router.post('/import-coupang', async (req, res) => {
  try {
    const { items, operator, remark } = req.body;

    const records = [];
    for (const item of items) {
      const now = new Date();
      const record = new InboundRecord({
        id: `in-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderNo: `GR-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        skuId: item.skuId,
        skuCode: item.skuCode,
        productId: item.productId,
        productName: item.productName,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: {
          cny: item.unitPrice.cny * item.quantity,
          krw: item.unitPrice.krw * item.quantity
        },
        inboundDate: now.toISOString().slice(0, 10),
        inboundTime: now.toTimeString().slice(0, 5),
        coupangInboundNo: item.coupangInboundNo,
        logisticsCenter: item.logisticsCenter,
        waybillNo: item.waybillNo,
        supplier: 'Coupang直发',
        operator: operator || '系统导入',
        remark: remark || `Coupang入库单导入`,
        createdAt: now.toISOString().slice(0, 10)
      });

      await record.save();
      records.push(record);

      // 更新库存
      const inventory = await Inventory.findOne({ skuId: item.skuId });
      if (inventory) {
        inventory.quantity += item.quantity;
        inventory.totalInbound += item.quantity;
        inventory.status = calculateStatus(inventory.quantity, inventory.safetyStock);
        inventory.lastUpdated = now.toISOString().slice(0, 10);
        await inventory.save();
      }
    }

    res.json({ success: true, data: records, message: `成功导入 ${records.length} 条入库记录` });
  } catch (error) {
    res.status(500).json({ success: false, message: '导入Coupang数据失败', error });
  }
});

export default router;
