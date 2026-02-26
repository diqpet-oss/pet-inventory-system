import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  Download,
  CheckSquare,
  Square
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { getPriorityConfig, exportToExcel } from '@/data/products';
import type { PurchasePlan } from '@/types';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// 优先级徽章组件
function PriorityBadge({ priority }: { priority: PurchasePlan['priority'] }) {
  const config = getPriorityConfig(priority);
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.bgColor,
      config.textColor,
      config.borderColor
    )}>
      {priority === 'highest' && <AlertTriangle size={12} />}
      {priority === 'high' && <TrendingUp size={12} />}
      {priority === 'medium' && <Clock size={12} />}
      {priority === 'low' && <CheckCircle2 size={12} />}
      {config.text}
    </span>
  );
}

// 双币种价格显示
function DualPriceDisplay({ price }: { price: { cny: number; krw: number } }) {
  return (
    <div className="flex flex-col text-xs">
      <span className="text-white">¥{price.cny.toLocaleString()}</span>
      <span className="text-muted-foreground">₩{price.krw.toLocaleString()}</span>
    </div>
  );
}

// 库存状态指示器
function StockIndicator({ current, safety }: { current: number; safety: number }) {
  const ratio = current / safety;
  const isCritical = current === 0;
  const isWarning = ratio < 1;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 w-24">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isCritical ? 'bg-red-500 w-0' :
              isWarning ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <span className={cn(
          'font-semibold',
          isCritical ? 'text-red-400' :
          isWarning ? 'text-amber-400' : 'text-emerald-400'
        )}>
          {current}
        </span>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{safety}</span>
      </div>
    </div>
  );
}

export function Purchase() {
  const { 
    purchasePlans, 
    purchaseOrders, 
    createPurchaseOrder,
    togglePurchasePlanSelection,
    selectAllPurchasePlans
  } = useInventoryStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PurchasePlan['priority'] | 'all'>('all');
  const [isVisible, setIsVisible] = useState(false);
  const [isGeneratingOrder, setIsGeneratingOrder] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderRemark, setOrderRemark] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 过滤和排序数据
  const filteredPlans = useMemo(() => {
    let plans = [...purchasePlans];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      plans = plans.filter(plan =>
        plan.skuCode.toLowerCase().includes(query) ||
        plan.productId.toLowerCase().includes(query) ||
        plan.productName.toLowerCase().includes(query) ||
        plan.size.toLowerCase().includes(query)
      );
    }

    if (priorityFilter !== 'all') {
      plans = plans.filter(plan => plan.priority === priorityFilter);
    }

    // 按优先级排序
    const priorityOrder = { highest: 0, high: 1, medium: 2, low: 3, none: 4 };
    plans.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return plans;
  }, [purchasePlans, searchQuery, priorityFilter]);

  // 统计数据
  const stats = useMemo(() => {
    const selectedItems = filteredPlans.filter(p => p.isSelected);
    const totalCost = selectedItems.reduce((sum, p) => sum + p.estimatedCost.cny, 0);
    const totalCostKRW = selectedItems.reduce((sum, p) => sum + p.estimatedCost.krw, 0);
    const totalQuantity = selectedItems.reduce((sum, p) => sum + p.suggestedPurchase, 0);
    const criticalCount = filteredPlans.filter(p => p.priority === 'highest').length;
    const highCount = filteredPlans.filter(p => p.priority === 'high').length;
    
    return {
      totalPlans: filteredPlans.length,
      selectedCount: selectedItems.length,
      totalCost: { cny: totalCost, krw: totalCostKRW },
      totalQuantity,
      criticalCount,
      highCount,
    };
  }, [filteredPlans]);

  // 生成采购单
  const handleGenerateOrder = () => {
    const selectedItems = filteredPlans.filter(p => p.isSelected);
    if (selectedItems.length === 0) {
      alert('请先选择要采购的项目');
      return;
    }
    
    const order = createPurchaseOrder(
      selectedItems,
      selectedSupplier || 'Coupang直发',
      orderRemark
    );
    
    if (order) {
      setIsGeneratingOrder(false);
      setSelectedSupplier('');
      setOrderRemark('');
      selectAllPurchasePlans(false);
      alert(`采购单 ${order.orderNo} 生成成功！`);
    }
  };

  // 导出采购计划
  const exportPurchasePlans = () => {
    const data = filteredPlans.map(plan => ({
      '产品名称': plan.productName,
      'Product ID': plan.productId,
      '产品编号': plan.skuCode,
      '尺码': plan.size,
      '当前库存': plan.currentStock,
      '安全库存': plan.safetyStock,
      '建议采购量': plan.suggestedPurchase,
      '优先级': getPriorityConfig(plan.priority).text,
      '预估成本(CNY)': plan.estimatedCost.cny,
      '预估成本(KRW)': plan.estimatedCost.krw,
    }));

    exportToExcel(data, '采购计划');
  };

  // 导出采购单
  const exportPurchaseOrders = () => {
    const data = purchaseOrders.map(order => ({
      '采购单号': order.orderNo,
      '项目数': order.items.length,
      '总金额(CNY)': order.totalAmount.cny,
      '总金额(KRW)': order.totalAmount.krw,
      '供应商': order.supplier,
      '状态': order.status === 'draft' ? '草稿' : order.status === 'confirmed' ? '已确认' : '已完成',
      '创建日期': order.createdAt,
      '备注': order.remark || '-'
    }));

    exportToExcel(data, '采购单列表');
  };

  return (
    <div className={cn(
      'space-y-6 transition-all duration-700',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    )}>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">采购计划</h1>
          <p className="text-sm text-muted-foreground mt-1">
            基于库存水平生成的智能采购建议
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportPurchasePlans}>
            <Download size={16} />
            导出计划
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-emerald-500 hover:bg-emerald-600"
            onClick={() => setIsGeneratingOrder(true)}
            disabled={stats.selectedCount === 0}
          >
            <ShoppingCart size={16} />
            生成采购单 ({stats.selectedCount})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-blue-400" />
            <span className="text-xs text-muted-foreground">采购项目</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalPlans}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={16} className="text-emerald-400" />
            <span className="text-xs text-muted-foreground">已选数量</span>
          </div>
          <div className="text-2xl font-bold">{stats.selectedCount}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-purple-400" />
            <span className="text-xs text-muted-foreground">预估成本(CNY)</span>
          </div>
          <div className="text-2xl font-bold">¥{stats.totalCost.cny.toLocaleString()}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-xs text-muted-foreground">紧急采购</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.criticalCount}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-400" />
            <span className="text-xs text-muted-foreground">高优先级</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.highCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="搜索产品名称、Product ID、产品编号、尺码..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <AlertTriangle size={16} />
              {priorityFilter === 'all' ? '全部优先级' : getPriorityConfig(priorityFilter).text}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-white/10">
            <DropdownMenuItem onClick={() => setPriorityFilter('all')}>
              全部优先级
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('highest')}>
              <AlertTriangle size={14} className="mr-2 text-red-400" />
              最高优先级
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('high')}>
              <TrendingUp size={14} className="mr-2 text-orange-400" />
              高优先级
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>
              <Clock size={14} className="mr-2 text-amber-400" />
              中优先级
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('low')}>
              <CheckCircle2 size={14} className="mr-2 text-blue-400" />
              低优先级
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Purchase Plans Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-10">
                <button 
                  onClick={() => {
                    const allSelected = filteredPlans.every(p => p.isSelected);
                    filteredPlans.forEach(p => {
                      if (p.isSelected !== !allSelected) {
                        togglePurchasePlanSelection(p.id);
                      }
                    });
                  }}
                  className="flex items-center justify-center"
                >
                  {filteredPlans.every(p => p.isSelected) ? (
                    <CheckSquare size={18} className="text-emerald-400" />
                  ) : (
                    <Square size={18} className="text-muted-foreground" />
                  )}
                </button>
              </TableHead>
              <TableHead>产品信息</TableHead>
              <TableHead>库存状态</TableHead>
              <TableHead>建议采购</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>预估成本</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Package size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">暂无采购计划</p>
                  <p className="text-sm text-muted-foreground mt-1">库存充足，无需采购</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPlans.map((plan) => (
                <TableRow 
                  key={plan.id} 
                  className={cn(
                    'border-white/5 cursor-pointer hover:bg-white/5',
                    plan.isSelected && 'bg-emerald-500/5'
                  )}
                  onClick={() => togglePurchasePlanSelection(plan.id)}
                >
                  <TableCell>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePurchasePlanSelection(plan.id);
                      }}
                      className="flex items-center justify-center"
                    >
                      {plan.isSelected ? (
                        <CheckSquare size={18} className="text-emerald-400" />
                      ) : (
                        <Square size={18} className="text-muted-foreground" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{plan.productName}</div>
                      <div className="text-xs text-muted-foreground">{plan.size}</div>
                      <div className="text-xs text-muted-foreground">编号: {plan.skuCode}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StockIndicator current={plan.currentStock} safety={plan.safetyStock} />
                  </TableCell>
                  <TableCell>
                    <span className="text-lg font-bold text-emerald-400">
                      +{plan.suggestedPurchase}
                    </span>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={plan.priority} />
                  </TableCell>
                  <TableCell>
                    <DualPriceDisplay price={plan.estimatedCost} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Purchase Orders Section */}
      {purchaseOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">已生成的采购单</h3>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportPurchaseOrders}>
              <Download size={16} />
              导出采购单
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseOrders.map((order) => (
              <div 
                key={order.id} 
                className="glass rounded-2xl p-5 hover:bg-white/5 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold">{order.orderNo}</div>
                    <div className="text-xs text-muted-foreground">{order.createdAt}</div>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs',
                    order.status === 'draft' ? 'bg-amber-500/10 text-amber-400' :
                    order.status === 'confirmed' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  )}>
                    {order.status === 'draft' ? '草稿' : order.status === 'confirmed' ? '已确认' : '已完成'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">项目数</span>
                    <span>{order.items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">总金额</span>
                    <DualPriceDisplay price={order.totalAmount} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">供应商</span>
                    <span>{order.supplier}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Order Dialog */}
      <Dialog open={isGeneratingOrder} onOpenChange={setIsGeneratingOrder}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>生成采购单</DialogTitle>
            <DialogDescription>
              已选择 {stats.selectedCount} 个项目，预估成本 ¥{stats.totalCost.cny.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">供应商</label>
              <Input 
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                placeholder="输入供应商名称"
                className="bg-white/5"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">备注</label>
              <Input 
                value={orderRemark}
                onChange={(e) => setOrderRemark(e.target.value)}
                placeholder="采购单备注信息"
                className="bg-white/5"
              />
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-sm text-muted-foreground mb-2">采购明细</div>
              <div className="space-y-2 max-h-40 overflow-auto">
                {filteredPlans.filter(p => p.isSelected).map(plan => (
                  <div key={plan.id} className="flex justify-between text-sm">
                    <span>{plan.productName} - {plan.size}</span>
                    <span className="text-emerald-400">+{plan.suggestedPurchase}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGeneratingOrder(false)}>取消</Button>
            <Button onClick={handleGenerateOrder} className="bg-emerald-500 hover:bg-emerald-600">
              <ShoppingCart size={16} className="mr-2" />
              确认生成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
