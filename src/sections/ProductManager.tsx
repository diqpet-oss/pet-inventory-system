import { useState } from 'react';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  ChevronDown,
  ChevronRight,
  Search
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import type { Product, ProductSKU } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// 汇率
const EXCHANGE_RATE = 190;

// 创建双币种价格
const createDualPrice = (cny: number) => ({
  cny,
  krw: Math.round(cny * EXCHANGE_RATE)
});

// SKU编辑组件
function SkuEditor({ 
  sku, 
  onUpdate, 
  onDelete 
}: { 
  sku: ProductSKU; 
  onUpdate: (sku: ProductSKU) => void;
  onDelete: () => void;
}) {
  return (
    <div className="glass rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">SKU ID</label>
          <Input 
            value={sku.skuCode}
            onChange={(e) => onUpdate({ ...sku, skuCode: e.target.value })}
            placeholder="Coupang SKU ID"
            className="bg-white/5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">尺码</label>
          <Input 
            value={sku.size}
            onChange={(e) => onUpdate({ ...sku, size: e.target.value })}
            placeholder="如: XL"
            className="bg-white/5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">采购价(CNY)</label>
          <Input 
            type="number"
            value={sku.purchasePrice.cny}
            onChange={(e) => {
              const cny = Number(e.target.value);
              onUpdate({ 
                ...sku, 
                purchasePrice: createDualPrice(cny)
              });
            }}
            placeholder="0"
            className="bg-white/5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">售价(CNY)</label>
          <div className="flex items-center gap-2">
            <Input 
              type="number"
              value={sku.salePrice.cny}
              onChange={(e) => {
                const cny = Number(e.target.value);
                onUpdate({ 
                  ...sku, 
                  salePrice: createDualPrice(cny)
                });
              }}
              placeholder="0"
              className="bg-white/5 text-sm"
            />
            <Button size="icon" variant="ghost" onClick={onDelete} className="shrink-0">
              <Trash2 size={16} className="text-red-400" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>采购价: ¥{sku.purchasePrice.cny} / ₩{sku.purchasePrice.krw.toLocaleString()}</span>
        <span>售价: ¥{sku.salePrice.cny} / ₩{sku.salePrice.krw.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function ProductManager() {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    addProductSKU,
    updateProductSKU,
    deleteProductSKU
  } = useInventoryStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  
  // 编辑对话框状态
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // 创建对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    id: '',
    name: '',
    productId: '',
    description: '',
    skus: []
  });

  // 过滤产品
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.productId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 切换展开状态
  const toggleExpand = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // 保存产品编辑
  const handleSaveProduct = () => {
    if (!editingProduct) return;
    
    // 更新产品基本信息
    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      description: editingProduct.description
    });
    
    // 更新每个SKU
    const originalProduct = products.find(p => p.id === editingProduct.id);
    if (originalProduct) {
      // 删除已移除的SKU
      for (const originalSku of originalProduct.skus) {
        if (!editingProduct.skus.find(s => s.id === originalSku.id)) {
          deleteProductSKU(editingProduct.productId, originalSku.id);
        }
      }
      
      // 更新或添加SKU
      for (const sku of editingProduct.skus) {
        const exists = originalProduct.skus.find(s => s.id === sku.id);
        if (exists) {
          updateProductSKU(editingProduct.productId, sku.id, sku);
        } else {
          addProductSKU(editingProduct.productId, sku);
        }
      }
    }
    
    setIsEditDialogOpen(false);
    setEditingProduct(null);
  };

  // 创建产品
  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.productId) {
      alert('请填写产品名称和Product ID');
      return;
    }

    if (!newProduct.skus || newProduct.skus.length === 0) {
      alert('请至少添加一个SKU');
      return;
    }

    // 检查Product ID是否已存在
    const exists = products.some(p => p.productId === newProduct.productId);
    if (exists) {
      alert('Product ID 已存在');
      return;
    }

    const product: Product = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      productId: newProduct.productId,
      description: newProduct.description || '',
      skus: newProduct.skus as ProductSKU[]
    };

    addProduct(product);
    
    setIsCreateDialogOpen(false);
    setNewProduct({ id: '', name: '', productId: '', description: '', skus: [] });
  };

  // 删除产品
  const handleDeleteProduct = (id: string) => {
    if (!confirm('确定要删除这个产品吗？相关库存数据也会被删除。')) return;
    deleteProduct(id);
  };

  // 添加SKU
  const addSku = (isNew: boolean) => {
    const newSku: ProductSKU = {
      id: `sku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: isNew ? (newProduct.productId || '') : (editingProduct?.productId || ''),
      productName: isNew ? (newProduct.name || '') : (editingProduct?.name || ''),
      skuCode: '',
      size: '',
      purchasePrice: createDualPrice(0),
      salePrice: createDualPrice(0)
    };
    
    if (isNew) {
      setNewProduct(prev => ({
        ...prev,
        skus: [...(prev.skus || []), newSku]
      }));
    } else if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        skus: [...editingProduct.skus, newSku]
      });
    }
  };

  // 更新SKU
  const updateSku = (index: number, sku: ProductSKU, isNew: boolean) => {
    if (isNew) {
      setNewProduct(prev => ({
        ...prev,
        skus: (prev.skus || []).map((s, i) => i === index ? sku : s)
      }));
    } else if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        skus: editingProduct.skus.map((s, i) => i === index ? sku : s)
      });
    }
  };

  // 删除SKU
  const deleteSku = (index: number, isNew: boolean) => {
    if (isNew) {
      setNewProduct(prev => ({
        ...prev,
        skus: (prev.skus || []).filter((_, i) => i !== index)
      }));
    } else if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        skus: editingProduct.skus.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">产品管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理产品信息和SKU配置
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus size={16} />
          新增产品
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="搜索产品名称或Product ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10"
        />
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Package size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">暂无产品</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="glass rounded-xl overflow-hidden">
              {/* Product Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(product.id)}
              >
                <div className="flex items-center gap-4">
                  {expandedProducts.has(product.id) ? 
                    <ChevronDown size={20} className="text-muted-foreground" /> : 
                    <ChevronRight size={20} className="text-muted-foreground" />
                  }
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>Product ID: {product.productId}</span>
                      <span>{product.skus?.length || 0} 个SKU</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProduct({ ...product });
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(product.id);
                    }}
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </Button>
                </div>
              </div>

              {/* SKU Details */}
              {expandedProducts.has(product.id) && (
                <div className="border-t border-white/10 p-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead>SKU ID</TableHead>
                        <TableHead>尺码</TableHead>
                        <TableHead>采购价</TableHead>
                        <TableHead>售价</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.skus?.map((sku) => (
                        <TableRow key={sku.id} className="border-white/5">
                          <TableCell className="font-mono text-sm">{sku.skuCode}</TableCell>
                          <TableCell>{sku.size}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>¥{sku.purchasePrice.cny}</div>
                              <div className="text-muted-foreground text-xs">₩{sku.purchasePrice.krw.toLocaleString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>¥{sku.salePrice.cny}</div>
                              <div className="text-muted-foreground text-xs">₩{sku.salePrice.krw.toLocaleString()}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-white/10 max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>编辑产品</DialogTitle>
            <DialogDescription>
              修改产品信息和SKU配置
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">产品名称</label>
                <Input 
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="bg-white/5"
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Product ID</label>
                <Input 
                  value={editingProduct.productId}
                  disabled
                  className="bg-white/5 opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-1">Product ID 不可修改</p>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">产品描述</label>
                <Input 
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="bg-white/5"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-muted-foreground">SKU配置</label>
                  <Button size="sm" variant="outline" onClick={() => addSku(false)}>
                    <Plus size={14} className="mr-1" />
                    添加SKU
                  </Button>
                </div>
                <div className="space-y-3">
                  {editingProduct.skus?.map((sku, index) => (
                    <SkuEditor
                      key={sku.id}
                      sku={sku}
                      onUpdate={(updatedSku) => updateSku(index, updatedSku, false)}
                      onDelete={() => deleteSku(index, false)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X size={16} className="mr-2" />
              取消
            </Button>
            <Button onClick={handleSaveProduct}>
              <Save size={16} className="mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card border-white/10 max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>新增产品</DialogTitle>
            <DialogDescription>
              创建新产品和SKU配置
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">产品名称 *</label>
              <Input 
                value={newProduct.name || ''}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="如: 狗狗冲锋衣"
                className="bg-white/5"
              />
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Product ID *</label>
              <Input 
                value={newProduct.productId || ''}
                onChange={(e) => setNewProduct({ ...newProduct, productId: e.target.value })}
                placeholder="如: 9312183755"
                className="bg-white/5"
              />
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">产品描述</label>
              <Input 
                value={newProduct.description || ''}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="产品描述信息"
                className="bg-white/5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted-foreground">SKU配置</label>
                <Button size="sm" variant="outline" onClick={() => addSku(true)}>
                  <Plus size={14} className="mr-1" />
                  添加SKU
                </Button>
              </div>
              <div className="space-y-3">
                {(newProduct.skus || []).map((sku, index) => (
                  <SkuEditor
                    key={sku.id}
                    sku={sku}
                    onUpdate={(updatedSku) => updateSku(index, updatedSku, true)}
                    onDelete={() => deleteSku(index, true)}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              <X size={16} className="mr-2" />
              取消
            </Button>
            <Button onClick={handleCreateProduct}>
              <Save size={16} className="mr-2" />
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
