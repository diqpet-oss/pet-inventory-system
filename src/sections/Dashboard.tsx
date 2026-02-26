import { useEffect, useRef, useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  XCircle, 
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { cn } from '@/lib/utils';
import { Cell, PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';

// 数字动画组件
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1500 }: { 
  value: number; 
  prefix?: string; 
  suffix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value, duration]);

  return (
    <span ref={ref}>
      {prefix}{displayValue.toLocaleString('zh-CN')}{suffix}
    </span>
  );
}

// 库存健康度仪表盘组件
function HealthGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

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
    <div ref={ref} className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isVisible ? strokeDashoffset : circumference}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: getScoreColor(score) }}>
          <AnimatedNumber value={score} />
        </span>
        <span className="text-sm text-muted-foreground mt-1">健康度评分</span>
        <span className={cn(
          'text-xs font-medium mt-1 px-2 py-0.5 rounded-full',
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

// 双币种金额显示
function DualCurrencyDisplay({ cny, krw }: { cny: number; krw: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold">¥{cny.toLocaleString()}</span>
      <span className="text-sm text-muted-foreground">₩{(krw / 10000).toFixed(1)}万</span>
    </div>
  );
}

export function Dashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const { 
    skus,
    inventory, 
    inboundRecords, 
    outboundRecords, 
    getDashboardStats 
  } = useInventoryStore();
  
  const stats = getDashboardStats();
  
  // 计算本月数据
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyInbound = inboundRecords
    .filter(o => o.createdAt.startsWith(currentMonth))
    .reduce((sum, o) => ({ cny: sum.cny + o.totalAmount.cny, krw: sum.krw + o.totalAmount.krw }), { cny: 0, krw: 0 });
  const monthlyOutbound = outboundRecords
    .filter(o => o.createdAt.startsWith(currentMonth))
    .reduce((sum, o) => ({ cny: sum.cny + o.totalAmount.cny, krw: sum.krw + o.totalAmount.krw }), { cny: 0, krw: 0 });
  
  // 库存状态分布
  const inventoryStatusData = [
    { name: '正常', value: stats.normalItems, color: '#10b981' },
    { name: '预警', value: stats.warningItems, color: '#f59e0b' },
    { name: '缺货', value: stats.outOfStockItems, color: '#ef4444' },
  ];
  
  // 计算健康度评分
  const totalItems = inventory.length;
  const healthScore = totalItems > 0 
    ? Math.round((stats.normalItems / totalItems) * 100) 
    : 100;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={cn(
      'space-y-6 transition-all duration-700',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    )}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">库存概览</h1>
          <p className="text-sm text-muted-foreground mt-1">
            基于Coupang SKU的实时库存监控
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          数据实时更新
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-emerald-400" />
            <span className="text-sm text-muted-foreground">SKU数量</span>
          </div>
          <div className="text-3xl font-bold">{skus.length}</div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-blue-400" />
            <span className="text-sm text-muted-foreground">总库存</span>
          </div>
          <div className="text-3xl font-bold">{stats.totalInventory}</div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-400" />
            <span className="text-sm text-muted-foreground">预警/缺货</span>
          </div>
          <div className="text-3xl font-bold">
            <span className="text-amber-400">{stats.warningItems}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-red-400">{stats.outOfStockItems}</span>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={18} className="text-purple-400" />
            <span className="text-sm text-muted-foreground">库存价值</span>
          </div>
          <DualCurrencyDisplay cny={stats.inventoryValue.cny} krw={stats.inventoryValue.krw} />
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownLeft size={18} className="text-emerald-400" />
            <span className="text-sm text-muted-foreground">本月入库金额</span>
          </div>
          <DualCurrencyDisplay cny={monthlyInbound.cny} krw={monthlyInbound.krw} />
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight size={18} className="text-red-400" />
            <span className="text-sm text-muted-foreground">本月出库金额</span>
          </div>
          <DualCurrencyDisplay cny={monthlyOutbound.cny} krw={monthlyOutbound.krw} />
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-blue-400" />
            <span className="text-sm text-muted-foreground">库存周转率</span>
          </div>
          <div className="text-3xl font-bold">4.2</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Health Gauge */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">库存健康度</h3>
          <div className="flex items-center justify-center">
            <HealthGauge score={healthScore} />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.normalItems}</div>
              <div className="text-xs text-muted-foreground">正常</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.warningItems}</div>
              <div className="text-xs text-muted-foreground">预警</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.outOfStockItems}</div>
              <div className="text-xs text-muted-foreground">缺货</div>
            </div>
          </div>
        </div>

        {/* Inventory Status Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">库存状态分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {inventoryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {inventoryStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Section */}
      {(stats.warningItems > 0 || stats.outOfStockItems > 0) && (
        <div className="glass rounded-2xl p-6 border border-amber-500/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={20} className="text-amber-400" />
            <h3 className="text-lg font-semibold">需要关注的项目</h3>
          </div>
          <div className="space-y-3">
            {stats.outOfStockItems > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <XCircle size={18} className="text-red-400" />
                  <span className="text-sm">有 <strong className="text-red-400">{stats.outOfStockItems}</strong> 个SKU已缺货，需要立即采购</span>
                </div>
              </div>
            )}
            {stats.warningItems > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-amber-400" />
                  <span className="text-sm">有 <strong className="text-amber-400">{stats.warningItems}</strong> 个SKU库存低于安全库存</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
