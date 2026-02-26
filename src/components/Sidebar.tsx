import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShoppingCart, 
  BarChart3,
  Menu,
  X,
  PawPrint,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { id: 'inventory', label: '库存台账', icon: Package },
  { id: 'inbound', label: '入库单', icon: ArrowDownLeft },
  { id: 'outbound', label: '出库单', icon: ArrowUpRight },
  { id: 'purchase', label: '采购计划', icon: ShoppingCart },
  { id: 'reports', label: '统计报表', icon: BarChart3 },
  { id: 'products', label: '产品管理', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // 检测屏幕尺寸
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleItemClick = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border/50 shadow-lg"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40 transition-all duration-500 ease-out',
          'bg-[#0a0a0a] border-r border-white/5',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Area */}
        <div className={cn(
          'flex items-center gap-3 px-6 py-6 border-b border-white/5',
          isCollapsed && 'justify-center px-4'
        )}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
              <PawPrint size={20} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-semibold text-lg tracking-tight whitespace-nowrap">
                宠物服饰
              </h1>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                进销存管理系统
              </p>
            </div>
          )}
        </div>

        {/* Toggle Button (Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 rounded-full bg-card border border-white/10 items-center justify-center hover:bg-white/5 transition-colors"
        >
          <div className={cn(
            'transition-transform duration-300',
            isCollapsed ? 'rotate-180' : ''
          )}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M7 5L3 2V8L7 5Z" fill="currentColor"/>
            </svg>
          </div>
        </button>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHovered = hoveredItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                  'relative overflow-hidden group',
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5',
                  isCollapsed && 'justify-center px-2'
                )}
                style={{
                  animationDelay: `${index * 0.05}s`
                }}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}

                {/* Hover Glow Effect */}
                {isHovered && !isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}

                {/* Icon */}
                <div className={cn(
                  'relative transition-transform duration-300',
                  isHovered && 'scale-110',
                  isActive && 'scale-105'
                )}>
                  <Icon size={20} />
                  {isActive && (
                    <div className="absolute inset-0 blur-lg bg-white/30" />
                  )}
                </div>

                {/* Label */}
                {!isCollapsed && (
                  <span className={cn(
                    'font-medium text-sm whitespace-nowrap transition-all duration-300',
                    isActive && 'translate-x-1'
                  )}>
                    {item.label}
                  </span>
                )}

                {/* Active Background Animation */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -z-10" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Stats */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">系统状态</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-400">运行中</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">数据同步</span>
                <span className="text-xs text-white">刚刚</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
