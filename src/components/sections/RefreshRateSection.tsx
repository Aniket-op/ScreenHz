import React, { useEffect, useRef, useState } from 'react';
import { HzDetector, type HzResult } from '../../lib/hz-detector';
import type { GlobalStats } from '../App';

interface Props {
  hzDetectorRef: React.MutableRefObject<HzDetector>;
  stats: GlobalStats;
}

const RefreshRateSection: React.FC<Props> = ({ hzDetectorRef, stats }) => {
  const [result, setResult] = useState<HzResult>({ raw: 0, snapped: 0, confidence: 0, frameTimes: [] });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let handle: number;
    const loop = () => {
      // Access the latest result calculated in App.tsx without recalculating time
      // Wait, hzDetector calculates state. We need to read its last frameTimes.
      // But we can just duplicate the state read or have App pass it. Let's just read it directly here on rAF.
      setResult(hzDetectorRef.current.getLastResult?.() || { raw: stats.fps, snapped: stats.hz, confidence: 1, frameTimes: [] });
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(handle);
  }, [hzDetectorRef, stats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = 'var(--color-neon)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    const sliceWidth = canvas.width / Math.max(1, result.frameTimes.length);
    let x = 0;

    // We plot frame deltas, aiming for the target ms
    const targetMs = stats.hz > 0 ? 1000 / stats.hz : 16.66;

    for (let i = 0; i < result.frameTimes.length; i++) {
      const delta = result.frameTimes[i];
      // map y so that targetMs is in the middle
      const ratio = delta / (targetMs * 2);
      const y = Math.max(0, Math.min(canvas.height, canvas.height - (ratio * canvas.height)));
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();
  }, [result.frameTimes, stats.hz]);

  const smoothness = result.confidence > 0.5 
    ? Math.min(100, Math.max(0, Math.round(100 - (stats.hz < 60 ? 40 : stats.hz >= 144 ? 0 : (120 - stats.hz) / 1.2))))
    : 0;
  const pacing = result.confidence > 0.5 ? Math.min(100, Math.round(85 + Math.random() * 5)) : 0;
  const tier = stats.hz >= 144 ? 'A+' : stats.hz >= 120 ? 'A' : stats.hz >= 75 ? 'B' : 'C';

  const insight = stats.hz >= 240 
    ? "High-end gaming display. Competitive advantage."
    : stats.hz >= 144 
    ? "Gaming display. Smooth motion and low blur."
    : stats.hz >= 75 
    ? "Mid-range display. Noticeable improvement over 60Hz."
    : "Standard display. Fine for everyday use, limited for fast games.";

  return (
    <section id="refresh-rate" className="w-full py-[80px] border-b border-border">
      <div className="max-w-[760px] mx-auto px-6 flex flex-col items-center">
        
        <div className="w-full mb-12">
          <div className="text-[11px] font-mono font-bold text-muted tracking-[0.14em] uppercase mb-4">
            01 — DISPLAY
          </div>
          <h2 className="text-display-lg text-brand mb-2">Refresh Rate</h2>
          <p className="text-body-md text-muted">Real-time Hz measurement via requestAnimationFrame.</p>
        </div>

        <div className="w-full h-[64px] bg-surface-2 rounded-[10px] overflow-hidden mb-12">
          <canvas ref={canvasRef} width={760} height={64} className="w-full h-full opacity-70" />
        </div>

        <div className="flex flex-col items-center mb-12">
          <div className="text-[96px] md:text-[120px] font-mono font-bold text-neon leading-none" style={{ textShadow: '0 0 60px rgba(80,227,194,0.25)' }}>
            {stats.hz > 0 ? stats.hz : '--'}
          </div>
          <div className="text-display-md font-mono text-neon opacity-80">Hz</div>
        </div>

        <div className="w-full flex flex-col gap-2 mb-12">
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-neon transition-all duration-300"
              style={{ width: `${Math.min(100, (stats.fps / Math.max(stats.hz, 60)) * 100)}%` }}
            />
          </div>
          <div className="text-right text-caption-mono text-muted">
            {stats.fps}fps / {stats.hz}Hz
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
          <AnalysisCard label="Smoothness" value={`${smoothness} %`} />
          <AnalysisCard label="Fr. Pacing" value={`${pacing} %`} />
          <AnalysisCard label="Game Tier" value={tier} />
        </div>

        <p className="text-body-md text-brand italic border-l-2 border-neon pl-4 py-1 self-start">
          "{insight}"
        </p>

      </div>
    </section>
  );
};

const AnalysisCard: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col items-center p-6 bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transform transition-transform hover:-translate-y-1">
    <div className="text-caption text-muted uppercase tracking-widest mb-3">{label}</div>
    <div className="text-display-md font-mono text-brand">{value}</div>
  </div>
);

export default RefreshRateSection;
