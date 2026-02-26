import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
  prefix?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ReactNode;
  color: 'emerald' | 'amber' | 'red' | 'blue' | 'purple';
  delay?: number;
  isCurrency?: boolean;
  krwValue?: number; // 韩币金额
}

const colorConfig = {
  emerald: {
    bg: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/20',
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  amber: {
    bg: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/20',
    text: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
  },
  red: {
    bg: 'from-red-500/20 to-red-500/5',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/20',
    text: 'text-red-400',
    iconBg: 'bg-red-500/20',
  },
  blue: {
    bg: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/20',
    text: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
  },
  purple: {
    bg: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/20',
    text: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
  },
};

export function StatCard({
  title,
  value,
  unit = '',
  prefix = '',
  trend,
  trendValue,
  icon,
  color,
  delay = 0,
  isCurrency = false,
  krwValue,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const colors = colorConfig[color];

  // Intersection Observer for animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  // Number counting animation
  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500;
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
  }, [isVisible, value]);

  const formatValue = (val: number) => {
    return val.toLocaleString('zh-CN');
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6 transition-all duration-500',
        'bg-gradient-to-br backdrop-blur-sm',
        colors.bg,
        colors.border,
        'hover:shadow-lg hover:-translate-y-1',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            'p-3 rounded-xl',
            colors.iconBg
          )}>
            {icon}
          </div>
          {trend && trendValue && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              'bg-white/5',
              trendColor
            )}>
              <TrendIcon size={12} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              {prefix && (
                <span className="text-2xl font-light text-muted-foreground">{prefix}</span>
              )}
              <span className={cn(
                'text-3xl font-bold tracking-tight',
                colors.text
              )}>
                {formatValue(displayValue)}
              </span>
              {unit && (
                <span className="text-sm text-muted-foreground ml-1">{unit}</span>
              )}
            </div>
            {isCurrency && krwValue !== undefined && (
              <span className="text-sm text-muted-foreground mt-1">
                ₩{(krwValue / 10000).toFixed(1)}万
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className={cn(
        'absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none',
        'bg-gradient-to-br from-white/5 to-transparent'
      )} />
    </div>
  );
}
