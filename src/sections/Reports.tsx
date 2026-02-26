import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  PieChart as PieChartIcon,
  Activity,
  Calendar
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { cn } from '@/lib/utils';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 库存健康度仪表盘
function HealthGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedOffset(strokeDashoffset), 300);
    return () => clearTimeout(timer);
  }, [strokeDashoffset]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreText = (s: number) => {
    if (s >= 80) return '优秀';
    if (s >= 60) return '良好';
    return '需改进';
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width="240" height="240" viewBox="0 0 240 240" className="transform -rotate-90">
        <circle
          cx="120"
          cy="120"
          r="90"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="16"
        />
        <circle
          cx="120"
          cy="120"
          r="90"
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold" style={{ color: getScoreColor(score) }}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground mt-2">健康度评分</span>
        <span className={cn(
          'text-sm font-medium mt-2 px-3 py-1 rounded-full',
          score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
          score >= 60 ? 'bg-amber-500/20 text-amber-400' :
          'bg-red-500/20 text-red-400'
        )}>
          {getScoreText(score)}
        </span>
      </div>
    </div>
  );
}

export function Reports() {
  const [isVisible, setIsVisible] = useState(false);
  const { 
    skus,
    inventory, 
    inboundRecords, 
    outboundRecords, 
    getDashboardStats 
  } = useInventoryStore();
  
  const stats = getDashboardStats();
  const healthScore = inventory.length > 0 
    ? Math.round((stats.normalItems / inventory.length) * 100) 
    : 100;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 尺码分布数据
  const sizeDistributionData = useMemo(() => {
    const distribution: Record<string, number> = {};
    inventory.forEach(item => {
      const size = item.size || '未知';
      distribution[size] = (distribution[size] || 0) + item.quantity;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  // 产品分布数据
  const productDistributionData = useMemo(() => {
    const distribution: Record<string, number> = {};
    inventory.forEach(item => {
      const productName = item.productName || '未知';
      distribution[productName] = (distribution[productName] || 0) + item.quantity;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  // 库存状态分布
  const statusData = [
    { name: '正常', value: stats.normalItems, color: '#10b981' },
    { name: '预警', value: stats.warningItems, color: '#f59e0b' },
    { name: '缺货', value: stats.outOfStockItems, color: '#ef4444' },
  ];

  // 进出库趋势（最近15天）
  const trendData = useMemo(() => {
    const dates: Record<string, { inbound: number; outbound: number }> = {};
    
    // 汇总入库数据
    inboundRecords.forEach(record => {
      const date = record.createdAt.slice(5); // MM-DD
      if (!dates[date]) dates[date] = { inbound: 0, outbound: 0 };
      dates[date].inbound += record.totalAmount.cny;
    });
    
    // 汇总出库数据
    outboundRecords.forEach(record => {
      const date = record.createdAt.slice(5);
      if (!dates[date]) dates[date] = { inbound: 0, outbound: 0 };
      dates[date].outbound += record.totalAmount.cny;
    });
    
    return Object.entries(dates)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-15)
      .map(([date, data]) => ({ date, ...data }));
  }, [inboundRecords, outboundRecords]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className={cn(
      'space-y-6 transition-all duration-700',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    )}>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">统计报表</h1>
          <p className="text-sm text-muted-foreground mt-1">
            多维度分析库存数据和业务趋势
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={16} />
          基于Coupang SKU数据
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-emerald-400" />
            <span className="text-xs text-muted-foreground">库存健康度</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{healthScore}%</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-400" />
            <span className="text-xs text-muted-foreground">SKU总数</span>
          </div>
          <div className="text-2xl font-bold">{skus.length}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-purple-400" />
            <span className="text-xs text-muted-foreground">总库存</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalInventory}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-amber-400" />
            <span className="text-xs text-muted-foreground">预警率</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {inventory.length > 0 ? Math.round(((stats.warningItems + stats.outOfStockItems) / inventory.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid grid-cols-4 gap-4 bg-transparent">
          <TabsTrigger 
            value="health" 
            className="glass data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Activity size={16} className="mr-2" />
            库存健康度
          </TabsTrigger>
          <TabsTrigger 
            value="status"
            className="glass data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <PieChartIcon size={16} className="mr-2" />
            状态分布
          </TabsTrigger>
          <TabsTrigger 
            value="product"
            className="glass data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Package size={16} className="mr-2" />
            产品分布
          </TabsTrigger>
          <TabsTrigger 
            value="trend"
            className="glass data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <BarChart3 size={16} className="mr-2" />
            进出库趋势
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-6">
          <div className="glass rounded-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-semibold mb-4">库存健康度评分</h3>
                <p className="text-muted-foreground mb-6">
                  基于库存水平、周转率和缺货情况综合计算的健康度评分。
                  分数越高表示库存管理越健康。
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>正常库存</span>
                    </div>
                    <span className="text-xl font-bold text-emerald-400">
                      {stats.normalItems}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>预警库存</span>
                    </div>
                    <span className="text-xl font-bold text-amber-400">
                      {stats.warningItems}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>缺货项目</span>
                    </div>
                    <span className="text-xl font-bold text-red-400">
                      {stats.outOfStockItems}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <HealthGauge score={healthScore} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-6">库存状态分布</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="product" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-6">产品库存分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-6">尺码库存分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sizeDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sizeDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="mt-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-6">进出库金额趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="inbound" 
                    name="入库金额"
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorInbound)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="outbound" 
                    name="出库金额"
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorOutbound)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
