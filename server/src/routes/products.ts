import express from 'express';
import Product from '../models/Product';
import Inventory from '../models/Inventory';

const router = express.Router();

// 获取所有产品
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取产品列表失败', error });
  }
});

// 获取单个产品
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取产品失败', error });
  }
});

// 创建产品
router.post('/', async (req, res) => {
  try {
    const { id, name, productId, description, skus } = req.body;

    // 检查 productId 是否已存在
    const existingProduct = await Product.findOne({ productId });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: '产品ID已存在' });
    }

    const product = new Product({
      id,
      name,
      productId,
      description,
      skus: skus || []
    });

    await product.save();

    // 为每个SKU创建库存记录
    if (skus && skus.length > 0) {
      for (const sku of skus) {
        const existingInventory = await Inventory.findOne({ skuId: sku.id });
        if (!existingInventory) {
          const inventory = new Inventory({
            skuId: sku.id,
            skuCode: sku.skuCode,
            productId,
            productName: name,
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
          await inventory.save();
        }
      }
    }

    res.json({ success: true, data: product, message: '产品创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建产品失败', error });
  }
});

// 更新产品
router.put('/:id', async (req, res) => {
  try {
    const { name, description, skus } = req.body;

    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    // 更新产品信息
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (skus) product.skus = skus;

    await product.save();

    // 如果更新了产品名称，同步更新库存记录
    if (name) {
      await Inventory.updateMany(
        { productId: product.productId },
        { productName: name }
      );
    }

    res.json({ success: true, data: product, message: '产品更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新产品失败', error });
  }
});

// 删除产品
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    const skuIds = product.skus.map(s => s.id);

    // 删除产品
    await Product.deleteOne({ id: req.params.id });

    // 删除相关SKU库存记录
    await Inventory.deleteMany({ skuId: { $in: skuIds } });

    res.json({ success: true, message: '产品删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除产品失败', error });
  }
});

// 添加SKU
router.post('/:productId/skus', async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    const sku = req.body;
    product.skus.push(sku);
    await product.save();

    // 创建库存记录
    const existingInventory = await Inventory.findOne({ skuId: sku.id });
    if (!existingInventory) {
      const inventory = new Inventory({
        skuId: sku.id,
        skuCode: sku.skuCode,
        productId: req.params.productId,
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
      await inventory.save();
    }

    res.json({ success: true, data: sku, message: 'SKU添加成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '添加SKU失败', error });
  }
});

// 更新SKU
router.put('/:productId/skus/:skuId', async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    const skuIndex = product.skus.findIndex(s => s.id === req.params.skuId);
    if (skuIndex === -1) {
      return res.status(404).json({ success: false, message: 'SKU不存在' });
    }

    // 更新SKU
    product.skus[skuIndex] = { ...product.skus[skuIndex], ...req.body };
    await product.save();

    // 同步更新库存记录
    const sku = product.skus[skuIndex];
    await Inventory.updateOne(
      { skuId: req.params.skuId },
      {
        skuCode: sku.skuCode,
        size: sku.size,
        purchasePrice: sku.purchasePrice,
        salePrice: sku.salePrice
      }
    );

    res.json({ success: true, data: product.skus[skuIndex], message: 'SKU更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新SKU失败', error });
  }
});

// 删除SKU
router.delete('/:productId/skus/:skuId', async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    product.skus = product.skus.filter(s => s.id !== req.params.skuId);
    await product.save();

    // 删除库存记录
    await Inventory.deleteOne({ skuId: req.params.skuId });

    res.json({ success: true, message: 'SKU删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除SKU失败', error });
  }
});

export default router;
