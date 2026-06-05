import React, { useEffect, useState } from 'react';

interface ScoreBarProps {
  label: string;
  value: number; // 0–100
  displayValue?: string;
  color?: string;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, value, displayValue, color = 'var(--color-brand)' }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center px-1">
        <span className="text-[11px] font-medium text-muted">{label}</span>
        <span className="text-[11px] font-mono text-brand">{displayValue || `${value}%`}</span>
      </div>
      <div className="h-1.5 w-full bg-surface-elevated rounded-full overflow-hidden border border-border/50">
        <div 
          className="h-full transition-all duration-1000 ease-out rounded-full"
          style={{ 
            width: `${width}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

export default ScoreBar;
