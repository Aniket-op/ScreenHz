import React from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
  accent: 'green' | 'blue' | 'orange' | 'purple';
  unit?: string;
  loading?: boolean;
}

const accentMap = {
  green: 'text-success',
  blue: 'text-cyan',
  orange: 'text-warning',
  purple: 'text-violet',
};

const StatCard: React.FC<StatCardProps> = ({ value, label, accent, unit, loading }) => {
  return (
    <div className="bg-surface-card vercel-card-border vercel-shadow p-6 rounded-lg flex flex-col gap-2 transition-all hover:border-muted/30">
      <span className="text-muted font-mono text-[10px] uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1">
        {loading ? (
          <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded" />
        ) : (
          <>
            <span className={`text-3xl font-bold tracking-tight text-brand`}>{value}</span>
            {unit && <span className="text-muted text-xs font-medium lowercase">{unit}</span>}
          </>
        )}
      </div>
    </div>
  );
};

export default StatCard;
