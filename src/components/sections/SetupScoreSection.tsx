import React, { useEffect, useState } from 'react';
import type { GlobalStats } from '../App';

interface Props {
  stats: GlobalStats;
}

const SetupScoreSection: React.FC<Props> = ({ stats }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  const hzScore = Math.min(100, (stats.hz / 240) * 100);
  const fpsScore = Math.min(100, (stats.fps / Math.max(stats.hz, 60)) * 100);
  const pollScore = Math.min(100, (stats.pollRate / 1000) * 100);
  const reactionScore = stats.reaction > 0 ? Math.min(100, Math.max(0, 100 - (stats.reaction - 150) / 2)) : 0;
  
  // Weights: Hz (30%), FPS (20%), Poll (20%), Reaction (30%)
  const totalScore = Math.round((hzScore * 0.3) + (fpsScore * 0.2) + (pollScore * 0.2) + (reactionScore * 0.3));

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedScore(totalScore);
    }, 500);
    return () => clearTimeout(timeout);
  }, [totalScore]);

  const getGrade = (score: number) => {
    if (score >= 90) return { label: 'A+', color: 'var(--color-neon)' };
    if (score >= 80) return { label: 'A', color: 'var(--color-neon)' };
    if (score >= 70) return { label: 'B+', color: 'var(--color-cyber)' };
    if (score >= 60) return { label: 'B', color: 'var(--color-cyber)' };
    if (score >= 50) return { label: 'C', color: 'var(--color-heat)' };
    return { label: 'D', color: 'var(--color-muted)' };
  };

  const finalGrade = getGrade(totalScore);

  return (
    <section id="score" className="w-full py-[80px] border-b border-border">
      <div className="max-w-[760px] mx-auto px-6 flex flex-col items-center">
        
        <div className="w-full mb-12">
          <div className="text-[11px] font-mono font-bold text-muted tracking-[0.14em] uppercase mb-4">
            07 — YOUR SETUP
          </div>
          <h2 className="text-display-lg text-brand mb-2">Overall Score</h2>
        </div>

        <div className="relative w-48 h-48 mb-12">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="12"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke={finalGrade.color}
              strokeWidth="12"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - animatedScore / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[64px] font-mono font-bold text-brand leading-none">{totalScore}</span>
            <span className="text-caption text-muted font-bold">/ 100</span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-6 mb-12">
          <ScoreRow label="Display" value={`${stats.hz}Hz`} score={hzScore} grade={getGrade(hzScore).label} />
          <ScoreRow label="FPS" value={`${stats.fps}fps`} score={fpsScore} grade={getGrade(fpsScore).label} />
          <ScoreRow label="Mouse" value={`${stats.dpi}dpi`} score={stats.dpi > 0 ? 100 : 0} grade={stats.dpi > 0 ? 'A+' : 'N/A'} />
          <ScoreRow label="Polling" value={`${stats.pollRate}Hz`} score={pollScore} grade={getGrade(pollScore).label} />
          <ScoreRow label="Reaction" value={stats.reaction > 0 ? `${Math.round(stats.reaction)}ms` : '--'} score={reactionScore} grade={stats.reaction > 0 ? getGrade(reactionScore).label : 'N/A'} />
        </div>

        <p className="text-body-md text-brand italic border-l-2 border-neon pl-4 py-1 self-start mb-12">
          "{totalScore >= 80 ? 'Competitive-grade setup. Your display is your strongest asset.' : totalScore >= 60 ? 'Solid gaming setup. Room for minor optimizations.' : 'Entry-level setup. Consider upgrading for a competitive edge.'}"
        </p>

        <button className="w-full py-4 bg-brand text-bg font-bold rounded-full hover:brightness-110 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2">
          SHARE MY SETUP ↗
        </button>

      </div>
    </section>
  );
};

const ScoreRow: React.FC<{ label: string, value: string, score: number, grade: string }> = ({ label, value, score, grade }) => {
  const gradeColor = (g: string) => {
    if (g.startsWith('A')) return 'text-neon';
    if (g.startsWith('B')) return 'text-cyber';
    if (g.startsWith('C')) return 'text-heat';
    return 'text-muted';
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="w-20 text-caption-mono text-muted uppercase tracking-widest">{label}</div>
      <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-brand/80 transition-all duration-1000"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="w-20 text-right flex justify-between items-center gap-2">
        <span className="text-caption-mono text-brand">{value}</span>
        <span className={`text-caption-mono font-bold ${gradeColor(grade)}`}>{grade}</span>
      </div>
    </div>
  );
};

export default SetupScoreSection;
