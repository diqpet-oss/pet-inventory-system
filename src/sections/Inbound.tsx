import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  ArrowDownLeft, 
  Calendar, 
  Clock,
  Package, 
  User, 
  FileText, 
  TrendingUp,
  Plus,
  Upload,
  Download,
  Save,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { parseCoupangData, validateCoupangData } from '@/data/coupangParser';
import { exportToExcel } from '@/data/products';
import { allSKUs } from '@/data/products';
import type { DualPrice, InboundRecord } from '@/types';
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

// 双币种价格显示
function DualPriceDisplay({ price }: { price: DualPrice }) {
  return (
    <div className="flex flex-col text-xs">
      <span className="text-white">¥{price.cny.toLocaleString()}</span>
      <span className="text-muted-foreground">₩{price.krw.toLocaleString()}</span>
    </div>
  );
}

export function Inbound() {
  const { inboundRecords, addInbound, updateInbound, deleteInbound, importCoupangInbound } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseCoupangData> | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 编辑和删除状态
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InboundRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<InboundRecord | null>(null);
  
  // 新入库单表单 - 增加入库日期和时间
  const [newOrder, setNewOrder] = useState<{
    skuId: string;
    skuCode: string;
    productId: string;
    productName: string;
    size: string;
    quantity: number;
    inboundDate: string;
    inboundTime: string;
    supplier: string;
    operator: string;
    remark: string;
  }>({
    skuId: '',
    skuCode: '',
    productId: '',
    productName: '',
    size: '',
    quantity: 0,
    inboundDate: new Date().toISOString().slice(0, 10),
    inboundTime: new Date().toTimeString().slice(0, 5),
    supplier: '',
    operator: '',
    remark: ''
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 过滤数据
  const filteredRecords = useMemo(() => {
    let records = [...inboundRecords];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      records = records.filter(record =>
        record.orderNo.toLowerCase().includes(query) ||
        record.skuCode.toLowerCase().includes(query) ||
        record.productId.toLowerCase().includes(query) ||
        record.productName.toLowerCase().includes(query) ||
        (record.coupangInboundNo?.toLowerCase().includes(query) ?? false)
      );
    }

    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [inboundRecords, searchQuery]);

  // 统计数据
  const stats = useMemo(() => {
    const totalAmount = filteredRecords.reduce((sum, r) => sum + r.totalAmount.cny, 0);
    const totalAmountKRW = filteredRecords.reduce((sum, r) => sum + r.totalAmount.krw, 0);
    const totalQuantity = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);
    
    return {
      totalRecords: filteredRecords.length,
      totalAmount: { cny: totalAmount, krw: totalAmountKRW },
      totalQuantity,
    };
  }, [filteredRecords]);

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setImportText(text);
      
      // 自动解析
      const data = parseCoupangData(text);
      setParsedData(data);
      
      // 验证数据
      const validation = validateCoupangData(data);
      setValidationErrors(validation.errors);
    } catch (error) {
      setImportResult({ 
        success: false, 
        message: '文件读取失败: ' + (error instanceof Error ? error.message : '未知错误') 
      });
    }
  };

  // 处理导入
  const handleImport = () => {
    if (!parsedData || parsedData.items.length === 0) {
      setImportResult({ success: false, message: '没有可导入的数据' });
      return;
    }

    const result = importCoupangInbound(parsedData, '系统导入', '');
    setImportResult({ success: result.success, message: result.message });

    if (result.success) {
      setTimeout(() => {
        setIsImporting(false);
        setImportText('');
        setParsedData(null);
        setImportResult(null);
        setValidationErrors([]);
      }, 2000);
    }
  };

  // 保存新入库单
  const handleSaveOrder = () => {
    if (!newOrder.skuId || newOrder.quantity <= 0) {
      return;
    }

    const sku = allSKUs.find(s => s.id === newOrder.skuId);
    if (!sku) return;

    addInbound({
      skuId: sku.id,
      skuCode: sku.skuCode,
      productId: sku.productId,
      productName: sku.productName,
      size: sku.size,
      quantity: newOrder.quantity,
      unitPrice: sku.purchasePrice,
      totalAmount: {
        cny: sku.purchasePrice.cny * newOrder.quantity,
        krw: sku.purchasePrice.krw * newOrder.quantity
      },
      inboundDate: newOrder.inboundDate,
      inboundTime: newOrder.inboundTime,
      supplier: newOrder.supplier || '未知供应商',
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
      inboundDate: new Date().toISOString().slice(0, 10),
      inboundTime: new Date().toTimeString().slice(0, 5),
      supplier: '',
      operator: '',
      remark: ''
    });
  };

  // 导出入库记录
  const exportInboundRecords = () => {
    const data = filteredRecords.map(record => ({
      '入库单号': record.orderNo,
      'Coupang入库编号': record.coupangInboundNo || '',
      '产品名称': record.productName,
      'Product ID': record.productId,
      '产品编号': record.skuCode,
      '尺码': record.size,
      '数量': record.quantity,
      '单价(CNY)': record.unitPrice.cny,
      '单价(KRW)': record.unitPrice.krw,
      '总金额(CNY)': record.totalAmount.cny,
      '总金额(KRW)': record.totalAmount.krw,
      '入库日期': record.inboundDate || record.createdAt,
      '入库时间': record.inboundTime || '',
      '物流中心': record.logisticsCenter || '',
      '运单号': record.waybillNo || '',
      '供应商': record.supplier,
      '操作员': record.operator,
      '备注': record.remark,
      '创建日期': record.createdAt
    }));

    exportToExcel(data, '入库单列表');
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

  // 打开编辑对话框
  const handleEdit = (record: InboundRecord) => {
    setEditingRecord(record);
    setIsEditing(true);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingRecord) return;
    
    updateInbound(editingRecord.id, {
      quantity: editingRecord.quantity,
      inboundDate: editingRecord.inboundDate,
      inboundTime: editingRecord.inboundTime,
      supplier: editingRecord.supplier,
      operator: editingRecord.operator,
      remark: editingRecord.remark
    });
    
    setIsEditing(false);
    setEditingRecord(null);
  };

  // 打开删除确认对话框
  const handleDeleteClick = (record: InboundRecord) => {
    setDeletingRecord(record);
    setIsDeleting(true);
  };

  // 确认删除
  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    
    deleteInbound(deletingRecord.id);
    setIsDeleting(false);
    setDeletingRecord(null);
  };

  return (
    <div className={cn(
      'space-y-6 transition-all duration-700',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    )}>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">入库单</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理Coupang入库记录和手动入库
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportInboundRecords}>
            <Download size={16} />
            导出数据
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsImporting(true)}>
            <Upload size={16} />
            导入Coupang
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setIsAddingOrder(true)}>
            <Plus size={16} />
            新加入库
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-blue-400" />
            <span className="text-xs text-muted-foreground">入库单数</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalRecords}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft size={16} className="text-emerald-400" />
            <span className="text-xs text-muted-foreground">入库数量</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalQuantity}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-purple-400" />
            <span className="text-xs text-muted-foreground">入库金额(CNY)</span>
          </div>
          <div className="text-2xl font-bold">¥{stats.totalAmount.cny.toLocaleString()}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-amber-400" />
            <span className="text-xs text-muted-foreground">入库金额(KRW)</span>
          </div>
          <div className="text-2xl font-bold">₩{(stats.totalAmount.krw / 10000).toFixed(1)}万</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="搜索入库单号、产品编号、Product ID、产品名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10"
        />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/50 via-blue-500/50 to-purple-500/50" />

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
              <div className="absolute left-3 top-6 w-6 h-6 rounded-full bg-card border-2 border-emerald-500 flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              {/* Card */}
              <div className="glass rounded-2xl p-6 hover:bg-white/5 transition-all duration-300 group">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left: Record Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-lg font-semibold">{record.orderNo}</span>
                      {record.coupangInboundNo && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs">
                          {record.coupangInboundNo}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs">
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
                          {record.inboundDate || record.createdAt}
                        </span>
                        {record.inboundTime && (
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {record.inboundTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Product & Logistics */}
                  <div className="flex flex-col sm:flex-row gap-4 lg:gap-8">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">产品</div>
                      <div className="text-sm font-medium">{record.productName}</div>
                    </div>
                    {record.logisticsCenter && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">物流中心</div>
                        <div className="text-sm font-medium">{record.logisticsCenter}</div>
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
                      <div className="text-xl font-bold text-emerald-400">+{record.quantity}</div>
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
                
                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handleEdit(record)}
                  >
                    <Edit2 size={14} />
                    修改
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 text-red-400 hover:text-red-400 border-red-500/30 hover:bg-red-500/10"
                    onClick={() => handleDeleteClick(record)}
                  >
                    <Trash2 size={14} />
                    删除
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="py-12 text-center pl-16">
            <ArrowDownLeft size={48} className="mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">暂无入库记录</p>
            <p className="text-sm text-muted-foreground mt-1">请导入Coupang入库单或手动添加入库</p>
          </div>
        )}
      </div>

      {/* Add Order Dialog */}
      <Dialog open={isAddingOrder} onOpenChange={setIsAddingOrder}>
        <DialogContent className="bg-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>新加入库单</DialogTitle>
            <DialogDescription>
              选择产品尺码并录入入库信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">选择产品尺码</label>
              <Select onValueChange={handleSKUSelect}>
                <SelectTrigger className="bg-white/5">
                  <SelectValue placeholder="请选择..." />
                </SelectTrigger>
                <SelectContent>
                  {allSKUs.map(sku => (
                    <SelectItem key={sku.id} value={sku.id}>
                      {sku.productName} - {sku.size} (编号: {sku.skuCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {newOrder.skuId && (
              <div className="glass rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">产品:</span>
                  <span>{newOrder.productName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">尺码:</span>
                  <span>{newOrder.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">产品编号:</span>
                  <span>{newOrder.skuCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Product ID:</span>
                  <span>{newOrder.productId}</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">入库数量</label>
                <Input 
                  type="number"
                  value={newOrder.quantity || ''}
                  onChange={(e) => setNewOrder({...newOrder, quantity: Number(e.target.value)})}
                  placeholder="0"
                  className="bg-white/5"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">供应商</label>
                <Input 
                  value={newOrder.supplier}
                  onChange={(e) => setNewOrder({...newOrder, supplier: e.target.value})}
                  placeholder="供应商名称"
                  className="bg-white/5"
                />
              </div>
            </div>
            
            {/* 入库日期和时间 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  <Calendar size={14} className="inline mr-1" />
                  入库日期
                </label>
                <Input 
                  type="date"
                  value={newOrder.inboundDate}
                  onChange={(e) => setNewOrder({...newOrder, inboundDate: e.target.value})}
                  className="bg-white/5"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  <Clock size={14} className="inline mr-1" />
                  入库时间
                </label>
                <Input 
                  type="time"
                  value={newOrder.inboundTime}
                  onChange={(e) => setNewOrder({...newOrder, inboundTime: e.target.value})}
                  className="bg-white/5"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">操作员</label>
                <Input 
                  value={newOrder.operator}
                  onChange={(e) => setNewOrder({...newOrder, operator: e.target.value})}
                  placeholder="操作员姓名"
                  className="bg-white/5"
                />
              </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingOrder(false)}>取消</Button>
            <Button onClick={handleSaveOrder} disabled={!newOrder.skuId || newOrder.quantity <= 0}>
              <Save size={16} className="mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImporting} onOpenChange={setIsImporting}>
        <DialogContent className="bg-card border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle>导入Coupang入库单</DialogTitle>
            <DialogDescription>
              上传Coupang货件明细文件或粘贴文本内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.pdf"
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <FileUp size={16} className="mr-2" />
                选择文件
              </Button>
              <span className="text-sm text-muted-foreground">
                支持 .txt 格式
              </span>
            </div>
            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                const data = parseCoupangData(e.target.value);
                setParsedData(data);
                const validation = validateCoupangData(data);
                setValidationErrors(validation.errors);
              }}
              placeholder="或将Coupang货件明细内容粘贴到这里..."
              className="w-full h-48 p-4 rounded-xl bg-white/5 border border-white/10 resize-none font-mono text-sm"
            />
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="glass rounded-xl p-4 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">验证问题</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Preview */}
            {parsedData && parsedData.items.length > 0 && (
              <div className="glass rounded-xl p-4">
                <div className="text-sm font-medium mb-2">
                  预览 ({parsedData.items.length} 个SKU)
                </div>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {parsedData.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.productName} - {item.size}</span>
                      <span className="text-emerald-400">+{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className={cn(
                "flex items-center gap-2",
                importResult.success ? "text-emerald-400" : "text-red-400"
              )}>
                {importResult.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span>{importResult.message}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { 
              setIsImporting(false); 
              setImportText(''); 
              setParsedData(null);
              setImportResult(null);
              setValidationErrors([]);
            }}>
              取消
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!parsedData || parsedData.items.length === 0}
            >
              <Upload size={16} className="mr-2" />
              开始导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>修改入库单</DialogTitle>
            <DialogDescription>
              修改入库单信息
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4 py-4">
              <div className="glass rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">入库单号:</span>
                  <span>{editingRecord.orderNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">产品:</span>
                  <span>{editingRecord.productName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">尺码:</span>
                  <span>{editingRecord.size}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">入库数量</label>
                  <Input 
                    type="number"
                    value={editingRecord.quantity}
                    onChange={(e) => setEditingRecord({...editingRecord, quantity: Number(e.target.value)})}
                    placeholder="0"
                    className="bg-white/5"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">供应商</label>
                  <Input 
                    value={editingRecord.supplier}
                    onChange={(e) => setEditingRecord({...editingRecord, supplier: e.target.value})}
                    placeholder="供应商名称"
                    className="bg-white/5"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    <Calendar size={14} className="inline mr-1" />
                    入库日期
                  </label>
                  <Input 
                    type="date"
                    value={editingRecord.inboundDate || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, inboundDate: e.target.value})}
                    className="bg-white/5"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    <Clock size={14} className="inline mr-1" />
                    入库时间
                  </label>
                  <Input 
                    type="time"
                    value={editingRecord.inboundTime || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, inboundTime: e.target.value})}
                    className="bg-white/5"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">操作员</label>
                  <Input 
                    value={editingRecord.operator}
                    onChange={(e) => setEditingRecord({...editingRecord, operator: e.target.value})}
                    placeholder="操作员姓名"
                    className="bg-white/5"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">备注</label>
                  <Input 
                    value={editingRecord.remark || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, remark: e.target.value})}
                    placeholder="备注信息"
                    className="bg-white/5"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditing(false); setEditingRecord(null); }}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editingRecord || editingRecord.quantity <= 0}>
              <Save size={16} className="mr-2" />
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400">确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这条入库记录吗？此操作不可恢复，删除后库存将相应扣减。
            </DialogDescription>
          </DialogHeader>
          {deletingRecord && (
            <div className="glass rounded-lg p-4 space-y-2 my-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">入库单号:</span>
                <span>{deletingRecord.orderNo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">产品:</span>
                <span>{deletingRecord.productName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">数量:</span>
                <span className="text-emerald-400">+{deletingRecord.quantity}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleting(false); setDeletingRecord(null); }}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 size={16} className="mr-2" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
