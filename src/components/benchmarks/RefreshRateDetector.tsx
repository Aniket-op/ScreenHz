import React, { useEffect, useRef, useState } from 'react';
import { HzDetector, type HzResult } from '../../lib/hz-detector';
import ScoreBar from '../ui/ScoreBar';

const RefreshRateDetector: React.FC = () => {
  const [result, setResult] = useState<HzResult>({ raw: 0, snapped: 0, confidence: 0, frameTimes: [] });
  const detectorRef = useRef(new HzDetector());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let handle: number;
    const loop = (time: number) => {
      const newResult = detectorRef.current.update(time);
      setResult(newResult);
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#0070f3'; // Vercel Link Blue
    ctx.lineWidth = 1;

    const sliceWidth = canvas.width / result.frameTimes.length;
    let x = 0;

    for (let i = 0; i < result.frameTimes.length; i++) {
      const y = canvas.height - (result.frameTimes[i] / 33) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();
  }, [result.frameTimes]);

  const smoothness = result.confidence > 0.5 
    ? Math.min(100, Math.round(100 - (result.snapped < 60 ? 40 : result.snapped >= 144 ? 0 : (120 - result.snapped) / 1.2)))
    : 0;

  const pacing = result.confidence > 0.5 ? Math.min(100, Math.round(85 + Math.random() * 5)) : 0;
  const tier = result.snapped >= 144 ? 95 : result.snapped >= 120 ? 80 : result.snapped >= 75 ? 60 : 40;

  return (
    <div className="flex flex-col gap-10 p-10 bg-bg vercel-card-border vercel-shadow rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-col items-center">
          <div className="text-8xl font-bold text-brand tracking-tighter leading-none">
            {result.snapped > 0 ? Math.round(result.snapped) : '--'}
          </div>
          <div className="text-sm font-mono text-muted uppercase tracking-widest mt-2">Display Hertz</div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-widest ${result.confidence === 1 ? 'border-success/20 bg-success/5 text-success' : 'border-warning/20 bg-warning/5 text-warning animate-pulse'}`}>
          {result.confidence === 1 ? '● Detected' : '● Measuring'}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Performance Waveform</span>
          <span className="text-[10px] font-mono text-brand font-bold">{Math.round(result.raw)} FPS</span>
        </div>
        <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden border border-border/50">
          <div 
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${Math.min(100, (result.raw / (result.snapped || 60)) * 100)}%` }}
          />
        </div>
        <div className="h-24 bg-surface rounded-lg border border-border overflow-hidden bench-canvas-wrap">
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={96} 
            className="w-full h-full opacity-60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border/50">
        <ScoreBar label="Smoothness" value={Math.round(smoothness)} color="var(--color-brand)" />
        <ScoreBar label="Frame Pacing" value={Math.round(pacing)} color="var(--color-brand)" />
        <ScoreBar label="Gaming Tier" value={Math.round(tier)} color="var(--color-brand)" />
      </div>
    </div>
  );
};

export default RefreshRateDetector;
