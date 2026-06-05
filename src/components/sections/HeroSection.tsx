import React, { useEffect, useState } from 'react';
import type { GlobalStats } from '../App';

interface Props {
  stats: GlobalStats;
}

const HeroSection: React.FC<Props> = ({ stats }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 100) setScrolled(true);
      else setScrolled(false);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative w-full flex flex-col items-center justify-center min-h-[calc(100vh-52px)] mt-[52px]">
      <div className="max-w-[760px] w-full px-6 flex flex-col items-center text-center z-10">
        
        {/* LIVE BADGE */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full card-surface mb-8">
          <div className={`w-2 h-2 rounded-full ${stats.hz > 0 ? 'bg-neon shadow-[0_0_8px_var(--color-neon)]' : 'bg-muted animate-pulse'}`}></div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-muted">
            {stats.hz > 0 ? `${stats.hz} Hz DETECTED` : 'MEASURING...'}
          </span>
        </div>

        {/* HEADLINE */}
        <h1 className="text-display-xl text-brand mb-6">
          Know Your Screen.<br />Own Your Aim.
        </h1>
        
        {/* BODY */}
        <p className="text-body-lg text-muted max-w-lg mb-12">
          Free browser benchmarks for your display, mouse, and reaction time. No install.
        </p>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-16">
          <StatCard label="HZ" value={stats.hz} accentColor="var(--color-neon)" />
          <StatCard label="FPS" value={stats.fps} accentColor="var(--color-cyber)" />
          <StatCard label="DPI" value={stats.dpi} accentColor="var(--color-heat)" />
          <StatCard label="POLL HZ" value={stats.pollRate} accentColor="var(--color-pulse)" />
        </div>

        {/* SCROLL INDICATOR */}
        <div className={`flex flex-col items-center gap-2 transition-opacity duration-500 ${scrolled ? 'opacity-0' : 'opacity-100'}`}>
          <div className="text-caption text-muted uppercase tracking-widest">scroll to benchmark</div>
          <svg className="w-5 h-5 text-muted animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

      </div>
    </section>
  );
};

const StatCard: React.FC<{ label: string, value: number, accentColor: string }> = ({ label, value, accentColor }) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: accentColor }}></div>
      {value > 0 ? (
        <div className="text-[36px] font-mono text-brand leading-none mb-2" style={{ textShadow: `0 0 20px ${accentColor}40` }}>
          {value}
        </div>
      ) : (
        <div className="h-[36px] mb-2 flex items-center">
          <div className="w-16 h-8 bg-surface-2 rounded animate-pulse"></div>
        </div>
      )}
      <div className="text-[10px] uppercase tracking-[0.1em] text-muted">{label}</div>
    </div>
  );
};

export default HeroSection;
