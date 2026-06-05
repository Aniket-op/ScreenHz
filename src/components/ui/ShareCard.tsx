import React from 'react';

interface ShareCardProps {
  stats: {
    hz: number;
    fps: number;
    dpi: number;
    pollRate: number;
    reactionBest: number;
  };
}

const ShareCard: React.FC<ShareCardProps> = ({ stats }) => {
  const downloadResult = () => {
    alert("Result card generated. (PNG download would trigger in production)");
  };

  return (
    <div className="p-10 bg-bg vercel-card-border vercel-shadow rounded-2xl max-w-sm mx-auto overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan/5 via-transparent to-violet/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex flex-col gap-8 relative z-10">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold tracking-tighter text-brand">SCREEN/HZ</span>
          <div className="px-2 py-0.5 bg-brand text-bg text-[10px] font-bold rounded uppercase">Verified</div>
        </div>

        <div className="grid grid-cols-2 gap-y-8 gap-x-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Refresh Rate</span>
            <span className="text-2xl font-bold text-brand tracking-tight">{stats.hz} Hz</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Avg Stability</span>
            <span className="text-2xl font-bold text-brand tracking-tight">{stats.fps} FPS</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Sensitivity</span>
            <span className="text-2xl font-bold text-brand tracking-tight">{stats.dpi} DPI</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Best Reaction</span>
            <span className="text-2xl font-bold text-brand tracking-tight">{stats.reactionBest} ms</span>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Hardware Score</span>
            <span className="text-5xl font-bold text-brand tracking-tighter leading-none">92</span>
          </div>
          <span className="text-xs font-medium text-muted mb-1 lowercase">screenhz.app</span>
        </div>

        <button 
          onClick={downloadResult}
          className="w-full py-3 bg-brand text-bg font-bold rounded-full hover:opacity-90 transition-all text-sm tracking-tight flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export Result
        </button>
      </div>
    </div>
  );
};

export default ShareCard;
