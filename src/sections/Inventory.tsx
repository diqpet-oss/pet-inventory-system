import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Package, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Edit2,
  Download,
  Save,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { getStatusConfig, exportToExcel } from '@/data/products';
import { allProducts, getSKUsByProductId } from '@/data/products';
import type { InventoryRecord } from '@/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

// 状态徽章组件
function StatusBadge({ status }: { status: 'normal' | 'warning' | 'outOfStock' }) {
  const config = getStatusConfig(status);
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.bgColor,
      config.textColor,
      config.borderColor
    )}>
      {status === 'normal' && <CheckCircle2 size={12} />}
      {status === 'warning' && <AlertTriangle size={12} />}
      {status === 'outOfStock' && <XCircle size={12} />}
      {config.text}
    </span>
  );
}

// 双币种价格显示
function DualPriceDisplay({ price, showBoth = true }: { price: { cny: number; krw: number }; showBoth?: boolean }) {
  if (showBoth) {
    return (
      <div className="flex flex-col text-xs">
        <span className="text-white">¥{price.cny.toLocaleString()}</span>
        <span className="text-muted-foreground">₩{price.krw.toLocaleString()}</span>
      </div>
    );
  }
  return <span>¥{price.cny.toLocaleString()}</span>;
}

// 产品分组卡片
function ProductGroupCard({ 
  product, 
  inventory,
  expanded,
  onToggle,
  onEdit
}: { 
  product: typeof allProducts[0];
  inventory: InventoryRecord[];
  expanded: boolean;
  onToggle: () => void;
  onEdit: (item: InventoryRecord) => void;
}) {
  const skus = getSKUsByProductId(product.productId);
  const productInventory = inventory.filter(item => item.productId === product.productId);
  const totalStock = productInventory.reduce((sum, item) => sum + item.quantity, 0);
  const warningCount = productInventory.filter(item => item.status === 'warning').length;
  const outOfStockCount = productInventory.filter(item => item.status === 'outOfStock').length;
  
  return (
    <div className="glass rounded-xl overflow-hidden mb-4">
      {/* 产品头部 */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          {expanded ? <ChevronDown size={20} className="text-muted-foreground" /> : <ChevronRight size={20} className="text-muted-foreground" />}
          <div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span>Product ID: {product.productId}</span>
              <span>{skus.length}个尺码</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-bold">{totalStock}</div>
            <div className="text-xs text-muted-foreground">总库存</div>
          </div>
          {(warningCount > 0 || outOfStockCount > 0) && (
            <div className="flex items-center gap-2">
              {outOfStockCount > 0 && (
                <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
                  {outOfStockCount}缺货
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                  {warningCount}预警
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 尺码详情 */}
      {expanded && (
        <div className="border-t border-white/10">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-24">尺码</TableHead>
                <TableHead className="w-32">产品编号</TableHead>
                <TableHead className="w-24">库存</TableHead>
                <TableHead className="w-32">价格</TableHead>
                <TableHead className="w-24">累计</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productInventory.map((item) => (
                <TableRow key={item.skuId} className="border-white/5">
                  <TableCell>
                    <span className="font-medium">{item.size}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{item.skuCode}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-bold',
                        item.status === 'outOfStock' ? 'text-red-400' :
                        item.status === 'warning' ? 'text-amber-400' :
                        'text-emerald-400'
                      )}>
                        {item.quantity}
                      </span>
                      <span className="text-xs text-muted-foreground">/安全{item.safetyStock}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">进: <DualPriceDisplay price={item.purchasePrice} /></div>
                      <div className="text-xs text-muted-foreground">售: <DualPriceDisplay price={item.salePrice} /></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div className="text-emerald-400">入: {item.totalInbound}</div>
                      <div className="text-red-400">出: {item.totalOutbound}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
                      <Edit2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function Inventory() {
  const { 
    skus,
    inventory, 
    updateSafetyStock,
    updateMaxStock,
    getDashboardStats
  } = useInventoryStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryRecord | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set(allProducts.map(p => p.productId)));

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 切换产品展开状态
  const toggleProduct = (productId: string) => {
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

  // 过滤产品
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return allProducts;
    const query = searchQuery.toLowerCase();
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.productId.toLowerCase().includes(query) ||
      skus.some(sku => 
        sku.productId === product.productId && 
        (sku.skuCode.toLowerCase().includes(query) || sku.size.toLowerCase().includes(query))
      )
    );
  }, [searchQuery, skus]);

  // 统计数据
  const stats = getDashboardStats();

  // 导出库存数据
  const exportInventory = () => {
    const data = inventory.map(item => ({
      '产品名称': item.productName,
      'Product ID': item.productId,
      '产品编号': item.skuCode,
      '尺码': item.size,
      '库存数量': item.quantity,
      '安全库存': item.safetyStock,
      '最大库存': item.maxStock,
      '采购单价(CNY)': item.purchasePrice.cny,
      '采购单价(KRW)': item.purchasePrice.krw,
      '售出价格(CNY)': item.salePrice.cny,
      '售出价格(KRW)': item.salePrice.krw,
      '累计入库': item.totalInbound,
      '累计出库': item.totalOutbound,
      '状态': getStatusConfig(item.status).text,
      '更新时间': item.lastUpdated
    }));
    
    exportToExcel(data, '库存台账');
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (editingItem) {
      updateSafetyStock(editingItem.skuId, editingItem.safetyStock);
      updateMaxStock(editingItem.skuId, editingItem.maxStock);
      setEditingItem(null);
    }
  };

  return (
    <div className={cn(
      'space-y-6 transition-all duration-700',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    )}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">库存台账</h1>
          <p className="text-sm text-muted-foreground mt-1">
            按产品分组管理库存，支持双币种价格显示
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportInventory}>
            <Download size={16} />
            导出数据
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">SKU数量</div>
          <div className="text-2xl font-bold">{skus.length}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">总库存</div>
          <div className="text-2xl font-bold">{stats.totalInventory}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">正常</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.normalItems}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">预警</div>
          <div className="text-2xl font-bold text-amber-400">{stats.warningItems}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">缺货</div>
          <div className="text-2xl font-bold text-red-400">{stats.outOfStockItems}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="搜索产品名称、Product ID、产品编号、尺码..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10"
        />
      </div>

      {/* Product Groups */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Package size={48} className="mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">未找到匹配的产品</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductGroupCard
              key={product.productId}
              product={product}
              inventory={inventory}
              expanded={expandedProducts.has(product.productId)}
              onToggle={() => toggleProduct(product.productId)}
              onEdit={setEditingItem}
            />
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="bg-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑库存设置</DialogTitle>
            <DialogDescription>
              {editingItem?.productName} - {editingItem?.size}
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">当前库存</label>
                  <Input 
                    type="number"
                    value={editingItem.quantity}
                    disabled
                    className="bg-white/5 opacity-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">通过入库/出库调整</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">安全库存</label>
                  <Input 
                    type="number"
                    value={editingItem.safetyStock}
                    onChange={(e) => setEditingItem({...editingItem, safetyStock: Number(e.target.value)})}
                    className="bg-white/5"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">最大库存</label>
                <Input 
                  type="number"
                  value={editingItem.maxStock}
                  onChange={(e) => setEditingItem({...editingItem, maxStock: Number(e.target.value)})}
                  className="bg-white/5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">采购单价 (CNY)</label>
                  <Input 
                    type="number"
                    value={editingItem.purchasePrice.cny}
                    disabled
                    className="bg-white/5 opacity-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">在产品设置中修改</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">售出价格 (CNY)</label>
                  <Input 
                    type="number"
                    value={editingItem.salePrice.cny}
                    disabled
                    className="bg-white/5 opacity-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">在产品设置中修改</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>取消</Button>
            <Button onClick={handleSaveEdit}>
              <Save size={16} className="mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
