import React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-surface-elevated rounded-pill border border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-5 py-1.5 text-xs font-medium rounded-pill transition-all
            ${activeTab === tab.id 
              ? 'bg-brand text-bg vercel-shadow' 
              : 'text-muted hover:text-brand hover:bg-muted/10'}
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabBar;
