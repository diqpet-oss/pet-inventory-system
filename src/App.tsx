import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/sections/Dashboard';
import { Inventory } from '@/sections/Inventory';
import { Inbound } from '@/sections/Inbound';
import { Outbound } from '@/sections/Outbound';
import { Purchase } from '@/sections/Purchase';
import { Reports } from '@/sections/Reports';
import { ProductManager } from '@/sections/ProductManager';
import { useInventoryStore } from '@/store/inventoryStore';
import { cn } from '@/lib/utils';
import { PawPrint, Loader2 } from 'lucide-react';

// 加载XLSX库的脚本
const loadXLSX = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.XLSX) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load XLSX'));
    document.head.appendChild(script);
  });
};

// 登录页面组件
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('diqpet@gmail.com');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // 验证用户名和密码
    if (email !== 'diqpet@gmail.com' || password !== '88819116') {
      setLoginError('用户名或密码错误');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className={cn(
        'hidden lg:flex lg:w-1/2 relative overflow-hidden transition-all duration-1000',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/30 z-10" />
        <img
          src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1000&h=1000&fit=crop"
          alt="Pet Fashion"
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-transform duration-1000',
            isVisible ? 'scale-100' : 'scale-110'
          )}
        />
        <div className="relative z-20 flex flex-col justify-end p-12">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6">
              <PawPrint size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              宠物服饰<br />进销存管理系统
            </h1>
            <p className="text-white/70 text-lg max-w-md">
              智能化的库存管理解决方案，支持Coupang跨境电商，韩币人民币双币种管理。
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className={cn(
        'flex-1 flex items-center justify-center p-8 transition-all duration-1000 delay-200',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <PawPrint size={32} />
            </div>
            <h1 className="text-2xl font-bold">宠物服饰进销存</h1>
          </div>

          <div className="glass rounded-3xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">欢迎回来</h2>
              <p className="text-muted-foreground">登录您的库存仪表盘</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {loginError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {loginError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="diqpet@gmail.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded bg-white/5 border-white/10" />
                  <span className="text-muted-foreground">记住我</span>
                </label>
                <button type="button" className="text-muted-foreground hover:text-white transition-colors">
                  忘记密码？
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full py-3 px-4 rounded-xl font-medium transition-all duration-300',
                  'bg-white text-black hover:bg-white/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-muted-foreground">
                账号: diqpet@gmail.com / 密码: 88819116
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 主应用组件
function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingXLSX, setIsLoadingXLSX] = useState(true);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const { loadFromCloud } = useInventoryStore();

  useEffect(() => {
    // 加载XLSX库
    loadXLSX()
      .then(() => {
        setIsLoadingXLSX(false);
      })
      .catch(() => {
        setIsLoadingXLSX(false);
      });
    
    // 从云端加载数据
    loadFromCloud()
      .then(() => {
        setIsLoadingCloud(false);
        setIsLoaded(true);
      })
      .catch(() => {
        setIsLoadingCloud(false);
        setIsLoaded(true);
      });
  }, [loadFromCloud]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'inbound':
        return <Inbound />;
      case 'outbound':
        return <Outbound />;
      case 'purchase':
        return <Purchase />;
      case 'reports':
        return <Reports />;
      case 'products':
        return <ProductManager />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoadingXLSX || isLoadingCloud) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-emerald-400" />
          <p className="text-muted-foreground">
            {isLoadingXLSX ? '正在加载系统...' : '正在同步云端数据...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern opacity-50 pointer-events-none" />
      
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className={cn(
        'transition-all duration-500',
        'lg:ml-64',
        'p-4 lg:p-8',
        'min-h-screen'
      )}>
        <div className={cn(
          'max-w-7xl mx-auto',
          'transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// App入口
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return isLoggedIn ? (
    <MainApp />
  ) : (
    <LoginPage onLogin={() => setIsLoggedIn(true)} />
  );
}

export default App;
