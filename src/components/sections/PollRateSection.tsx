import React, { useEffect, useRef, useState } from 'react';
import { PollRateDetector, KNOWN_POLL_RATES } from '../../lib/poll-rate';

interface Props {
  pollRateDetectorRef: React.MutableRefObject<PollRateDetector>;
  detectedPollRate: number;
}

const PollRateSection: React.FC<Props> = ({ pollRateDetectorRef, detectedPollRate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [intervals, setIntervals] = useState<number[]>([]);

  useEffect(() => {
    let handle: number;
    const loop = () => {
      setIntervals(pollRateDetectorRef.current.getIntervals());
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(handle);
  }, [pollRateDetectorRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = canvas.width / 60;
    const maxInterval = detectedPollRate > 0 ? (1000 / detectedPollRate) * 3 : 20;

    intervals.forEach((interval, i) => {
      const h = Math.min(canvas.height, (interval / maxInterval) * canvas.height);
      const y = canvas.height - h;
      
      // Color by spread
      const target = detectedPollRate > 0 ? 1000 / detectedPollRate : 1;
      const diff = Math.abs(interval - target);
      const ratio = diff / target;
      
      ctx.fillStyle = ratio < 0.2 ? 'var(--color-neon)' : ratio < 0.5 ? 'var(--color-heat)' : 'rgba(255,255,255,0.1)';
      ctx.fillRect(i * barWidth, y, barWidth - 1, h);
    });
  }, [intervals, detectedPollRate]);

  return (
    <section id="poll-rate" className="w-full py-[80px] border-b border-border">
      <div className="max-w-[760px] mx-auto px-6 flex flex-col items-center">
        
        <div className="w-full mb-12">
          <div className="text-[11px] font-mono font-bold text-muted tracking-[0.14em] uppercase mb-4">
            05 — POLLING
          </div>
          <h2 className="text-display-lg text-brand mb-2">Mouse Poll Rate</h2>
          <p className="text-body-md text-muted">How often your mouse reports to the OS.</p>
        </div>

        <div className="relative w-full h-[200px] bg-surface rounded-[10px] overflow-hidden mb-12 flex flex-col items-center justify-center p-8">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
             <canvas ref={canvasRef} width={600} height={120} className="w-full h-[120px] opacity-40" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {!detectedPollRate && (
              <div className="text-body-sm text-muted uppercase tracking-[0.2em] animate-pulse">
                Move your mouse anywhere on the page
              </div>
            )}
            
            {detectedPollRate > 0 && (
              <>
                <div className="text-[64px] font-mono font-bold text-brand leading-none mb-2">
                  {detectedPollRate} <span className="text-xl">Hz</span>
                </div>
                <div className="text-caption-mono text-neon uppercase tracking-widest">
                  Detected with high confidence
                </div>
              </>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="text-caption text-muted uppercase tracking-widest">Common poll rates</div>
          <div className="flex flex-wrap gap-2">
            {KNOWN_POLL_RATES.map(rate => (
              <div 
                key={rate}
                className={`px-4 py-2 rounded-full text-caption-mono font-bold transition-all
                  ${detectedPollRate === rate ? 'bg-pulse text-brand shadow-[0_0_15px_var(--color-pulse)]' : 'bg-surface-2 text-muted border border-white/5'}`}
              >
                {rate}Hz
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default PollRateSection;
