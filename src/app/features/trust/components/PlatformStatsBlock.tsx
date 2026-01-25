import { motion } from 'motion/react';
import type { PlatformStats } from '../../../types';
import { cn } from '../../../components/ui/utils';

interface PlatformStatsBlockProps {
  stats: PlatformStats;
  className?: string;
}

const formatNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n);

export function PlatformStatsBlock({ stats, className }: PlatformStatsBlockProps) {
  const items = [
    { value: formatNum(stats.totalOrders), label: 'Заказов на платформе' },
    { value: `${stats.successRate}%`, label: 'Успешных заказов' },
    { value: `${stats.averageDeliveryMinutes} мин`, label: 'Среднее время доставки' },
    { value: formatNum(stats.totalReviews), label: 'Отзывов' },
    { value: `${stats.averageRating.toFixed(1)}`, label: 'Средний рейтинг' },
  ];

  return (
    <section className={cn('py-12 sm:py-16', className)}>
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 px-4 sm:px-0">
        Цифры платформы
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="rounded-2xl border border-border bg-card p-4 sm:p-5 text-center hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 ease-out"
          >
            <div className="text-2xl sm:text-3xl font-bold text-primary">{it.value}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">{it.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
