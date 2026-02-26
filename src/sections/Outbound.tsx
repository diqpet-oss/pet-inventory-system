import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ArrowUpRight, 
  Calendar, 
  Package, 
  User, 
  FileText, 
  TrendingDown,
  ShoppingCart,
  Settings,
  Plus,
  Download,
  Save
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { getOutboundTypeConfig, exportToExcel } from '@/data/products';
import { allSKUs } from '@/data/products';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// 双币种价格显示
function DualPriceDisplay({ price }: { price: { cny: number; krw: number } }) {
  return (
    <div className="flex flex-col text-xs">
      <span className="text-white">¥{price.cny.toLocaleString()}</span>
      <span className="text-muted-foreground">₩{price.krw.toLocaleString()}</span>
    </div>
  );
}

// 出库类型徽章
function OutboundTypeBadge({ type }: { type: 'sale' | 'adjustment' }) {
  const config = getOutboundTypeConfig(type);
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.bgColor,
      config.textColor,
      config.borderColor
    )}>
      {type === 'sale' ? <ShoppingCart size={12} /> : <Settings size={12} />}
      {config.text}
    </span>
  );
}

export function Outbound() {
  const { outboundRecords, addOutbound, inventory } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'sale' | 'adjustment' | 'all'>('all');
  const [isVisible, setIsVisible] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  
  // 新出库单表单
  const [newOrder, setNewOrder] = useState<{
    skuId: string;
    skuCode: string;
    productId: string;
    productName: string;
    size: string;
    quantity: number;
    type: 'sale' | 'adjustment';
    channel: string;
    operator: string;
    remark: string;
  }>({
    skuId: '',
    skuCode: '',
    productId: '',
    productName: '',
    size: '',
    quantity: 0,
    type: 'sale',
    channel: '',
    operator: '',
    remark: ''
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 过滤数据
  const filteredRecords = useMemo(() => {
    let records = [...outboundRecords];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      records = records.filter(record =>
        record.orderNo.toLowerCase().includes(query) ||
        record.skuCode.toLowerCase().includes(query) ||
        record.productId.toLowerCase().includes(query) ||
        record.productName.toLowerCase().includes(query)
      );
    }

    if (typeFilter !== 'all') {
      records = records.filter(record => record.type === typeFilter);
    }

    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [outboundRecords, searchQuery, typeFilter]);

  // 统计数据
  const stats = useMemo(() => {
    const totalAmount = filteredRecords.reduce((sum, r) => sum + r.totalAmount.cny, 0);
    const totalAmountKRW = filteredRecords.reduce((sum, r) => sum + r.totalAmount.krw, 0);
    const totalQuantity = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);
    const saleOrders = filteredRecords.filter(r => r.type === 'sale');
    const adjustmentOrders = filteredRecords.filter(r => r.type === 'adjustment');
    
    return {
      totalRecords: filteredRecords.length,
      totalAmount: { cny: totalAmount, krw: totalAmountKRW },
      totalQuantity,
      saleCount: saleOrders.length,
      adjustmentCount: adjustmentOrders.length,
    };
  }, [filteredRecords]);

  // 获取选中库存项
  const selectedInventoryItem = useMemo(() => {
    if (!newOrder.skuId) return null;
    return inventory.find(i => i.skuId === newOrder.skuId);
  }, [newOrder.skuId, inventory]);

  // 保存新出库单
  const handleSaveOrder = () => {
    if (!newOrder.skuId || newOrder.quantity <= 0) {
      return;
    }

    const inventoryItem = selectedInventoryItem;
    
    if (!inventoryItem) {
      alert('未找到对应的库存记录');
      return;
    }
    
    // 检查库存是否足够
    if (newOrder.quantity > inventoryItem.quantity) {
      alert(`库存不足！当前库存: ${inventoryItem.quantity}`);
      return;
    }

    const sku = allSKUs.find(s => s.id === newOrder.skuId);
    if (!sku) return;

    addOutbound({
      skuId: sku.id,
      skuCode: sku.skuCode,
      productId: sku.productId,
      productName: sku.productName,
      size: sku.size,
      quantity: newOrder.quantity,
      unitPrice: sku.salePrice,
      totalAmount: {
        cny: sku.salePrice.cny * newOrder.quantity,
        krw: sku.salePrice.krw * newOrder.quantity
      },
      type: newOrder.type,
      channel: newOrder.type === 'sale' ? newOrder.channel : undefined,
      operator: newOrder.operator || '管理员',
      remark: newOrder.remark
    });

    setIsAddingOrder(false);
    setNewOrder({
      skuId: '',
      skuCode: '',
      productId: '',
      productName: '',
      size: '',
      quantity: 0,
      type: 'sale',
      channel: '',
      operator: '',
      remark: ''
    });
  };

  // 导出出库记录
  const exportOutboundRecords = () => {
    const data = filteredRecords.map(record => ({
      '出库单号': record.orderNo,
      '产品名称': record.productName,
      'Product ID': record.productId,
      '产品编号': record.skuCode,
      '尺码': record.size,
      '数量': record.quantity,
      '单价(CNY)': record.unitPrice.cny,
      '单价(KRW)': record.unitPrice.krw,
      '总金额(CNY)': record.totalAmount.cny,
      '总金额(KRW)': record.totalAmount.krw,
      '类型': record.type === 'sale' ? '销售出库' : '库存调整',
      '销售渠道': record.channel || '-',
      '操作员': record.operator,
      '备注': record.remark,
      '出库日期': record.createdAt
    }));

    exportToExcel(data, '出库单列表');
  };

  // 处理SKU选择
  const handleSKUSelect = (skuId: string) => {
    const sku = allSKUs.find(s => s.id === skuId);
    if (sku) {
      setNewOrder({
        ...newOrder,
        skuId: sku.id,
        skuCode: sku.skuCode,
        productId: sku.productId,
        productName: sku.productName,
        size: sku.size
      });
    }
  };

  return (
    <div className={cn(
      'space-y-6 transition-all duration-700',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    )}>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">出库单</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理销售出库和库存调整
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportOutboundRecords}>
            <Download size={16} />
            导出数据
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setIsAddingOrder(true)}>
            <Plus size={16} />
            新增出库
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-blue-400" />
            <span className="text-xs text-muted-foreground">出库单数</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalRecords}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={16} className="text-red-400" />
            <span className="text-xs text-muted-foreground">出库数量</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalQuantity}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-purple-400" />
            <span className="text-xs text-muted-foreground">出库金额(CNY)</span>
          </div>
          <div className="text-2xl font-bold">¥{stats.totalAmount.cny.toLocaleString()}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={16} className="text-emerald-400" />
            <span className="text-xs text-muted-foreground">销售出库</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.saleCount}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={16} className="text-amber-400" />
            <span className="text-xs text-muted-foreground">库存调整</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.adjustmentCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="搜索出库单号、产品编号、Product ID、产品名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FileText size={16} />
              {typeFilter === 'all' ? '全部类型' : getOutboundTypeConfig(typeFilter).text}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-white/10">
            <DropdownMenuItem onClick={() => setTypeFilter('all')}>
              全部类型
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('sale')}>
              <ShoppingCart size={14} className="mr-2 text-blue-400" />
              销售出库
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('adjustment')}>
              <Settings size={14} className="mr-2 text-purple-400" />
              库存调整
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500/50 via-orange-500/50 to-amber-500/50" />

        {/* Records */}
        <div className="space-y-6">
          {filteredRecords.map((record, index) => (
            <div
              key={record.id}
              className={cn(
                'relative pl-16 animate-slide-in-up',
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Timeline Node */}
              <div className={cn(
                'absolute left-3 top-6 w-6 h-6 rounded-full bg-card border-2 flex items-center justify-center z-10',
                record.type === 'sale' ? 'border-red-500' : 'border-amber-500'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  record.type === 'sale' ? 'bg-red-500' : 'bg-amber-500'
                )} />
              </div>

              {/* Card */}
              <div className="glass rounded-2xl p-6 hover:bg-white/5 transition-all duration-300 group">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left: Record Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-lg font-semibold">{record.orderNo}</span>
                      <OutboundTypeBadge type={record.type} />
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">
                        {record.size}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span>编号: <span className="text-white">{record.skuCode}</span></span>
                        <span>PID: <span className="text-white">{record.productId}</span></span>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {record.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Channel & Operator */}
                  <div className="flex flex-col sm:flex-row gap-4 lg:gap-8">
                    {record.channel && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">销售渠道</div>
                        <div className="text-sm font-medium">{record.channel}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">操作员</div>
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-muted-foreground" />
                        <span className="text-sm">{record.operator}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity & Amount */}
                  <div className="flex items-center gap-6 lg:text-right">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">数量</div>
                      <div className="text-xl font-bold text-red-400">-{record.quantity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">金额</div>
                      <div className="text-lg font-bold">
                        <DualPriceDisplay price={record.totalAmount} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remark */}
                {record.remark && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText size={14} />
                      <span>{record.remark}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="py-12 text-center pl-16">
            <ArrowUpRight size={48} className="mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">暂无出库记录</p>
          </div>
        )}
      </div>

      {/* Add Order Dialog */}
      <Dialog open={isAddingOrder} onOpenChange={setIsAddingOrder}>
        <DialogContent className="bg-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>新增出库单</DialogTitle>
            <DialogDescription>
              选择产品尺码并录入出库信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">出库类型</label>
              <Select 
                value={newOrder.type} 
                onValueChange={(v) => setNewOrder({...newOrder, type: v as 'sale' | 'adjustment'})}
              >
                <SelectTrigger className="bg-white/5">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="sale">销售出库</SelectItem>
                  <SelectItem value="adjustment">库存调整</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">选择产品尺码</label>
              <Select onValueChange={handleSKUSelect}>
                <SelectTrigger className="bg-white/5">
                  <SelectValue placeholder="请选择..." />
                </SelectTrigger>
                <SelectContent>
                  {allSKUs.map(sku => {
                    const stock = inventory.find(i => i.skuId === sku.id)?.quantity || 0;
                    return (
                      <SelectItem key={sku.id} value={sku.id}>
                        {sku.productName} - {sku.size} (库存: {stock})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            {selectedInventoryItem && (
              <div className="glass rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">产品:</span>
                  <span>{selectedInventoryItem.productName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">尺码:</span>
                  <span>{selectedInventoryItem.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">当前库存:</span>
                  <span className={selectedInventoryItem.quantity === 0 ? 'text-red-400' : 'text-emerald-400'}>
                    {selectedInventoryItem.quantity}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">建议售价:</span>
                  <span>¥{selectedInventoryItem.salePrice.cny}</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">出库数量</label>
                <Input 
                  type="number"
                  value={newOrder.quantity || ''}
                  onChange={(e) => setNewOrder({...newOrder, quantity: Number(e.target.value)})}
                  placeholder="0"
                  className="bg-white/5"
                />
                {selectedInventoryItem && newOrder.quantity > selectedInventoryItem.quantity && (
                  <p className="text-xs text-red-400 mt-1">超出库存!</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">操作员</label>
                <Input 
                  value={newOrder.operator}
                  onChange={(e) => setNewOrder({...newOrder, operator: e.target.value})}
                  placeholder="操作员姓名"
                  className="bg-white/5"
                />
              </div>
            </div>
            
            {newOrder.type === 'sale' && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">销售渠道</label>
                <Input 
                  value={newOrder.channel}
                  onChange={(e) => setNewOrder({...newOrder, channel: e.target.value})}
                  placeholder="如: Coupang、淘宝、京东"
                  className="bg-white/5"
                />
              </div>
            )}
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">备注</label>
              <Input 
                value={newOrder.remark}
                onChange={(e) => setNewOrder({...newOrder, remark: e.target.value})}
                placeholder="备注信息"
                className="bg-white/5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingOrder(false)}>取消</Button>
            <Button 
              onClick={handleSaveOrder} 
              disabled={!newOrder.skuId || newOrder.quantity <= 0 || !!(selectedInventoryItem && newOrder.quantity > selectedInventoryItem.quantity)}
            >
              <Save size={16} className="mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
