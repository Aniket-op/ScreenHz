import React, { useEffect, useRef, useState } from 'react';

const COMMON_DPI = [400, 800, 1000, 1200, 1600, 3200, 6400, 12800];

interface Props {
  onDpiChange: (dpi: number) => void;
}

const DpiMeterSection: React.FC<Props> = ({ onDpiChange }) => {
  const [screenWidthCm, setScreenWidthCm] = useState(52);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [pixelsMoved, setPixelsMoved] = useState(0);
  const [estimatedDpi, setEstimatedDpi] = useState(0);
  const [snappedDpi, setSnappedDpi] = useState(0);
  const [dotPos, setDotPos] = useState(0); // 0 to 1
  
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);

  const startMeasurement = () => {
    setIsMeasuring(true);
    setPixelsMoved(0);
    setEstimatedDpi(0);
    setSnappedDpi(0);
    setDotPos(0);
    startXRef.current = null;
  };

  const reset = () => {
    setIsMeasuring(false);
    setPixelsMoved(0);
    setEstimatedDpi(0);
    setSnappedDpi(0);
    setDotPos(0);
    startXRef.current = null;
    onDpiChange(0);
  };

  useEffect(() => {
    if (!isMeasuring) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      
      // Calculate dot position based on mouse X relative to track
      const relativeX = e.clientX - rect.left;
      const pos = Math.max(0, Math.min(1, relativeX / rect.width));
      setDotPos(pos);

      if (startXRef.current === null) {
        startXRef.current = e.screenX;
        return;
      }
      
      const totalDelta = Math.abs(e.screenX - startXRef.current);
      setPixelsMoved(totalDelta);

      // Live update DPI
      if (totalDelta > 50) {
        const physicalCmMoved = (pos * (rect.width / window.screen.width)) * screenWidthCm;
        const physicalInches = physicalCmMoved / 2.54;
        if (physicalInches > 0) {
          const dpi = totalDelta / physicalInches;
          setEstimatedDpi(dpi);
          
          let snapped = dpi;
          let minDiff = Infinity;
          for (const common of COMMON_DPI) {
            const diff = Math.abs(dpi - common);
            if (diff < minDiff) {
              minDiff = diff;
              snapped = common;
            }
          }
          setSnappedDpi(snapped);
          onDpiChange(Math.round(snapped));
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMeasuring, screenWidthCm, onDpiChange]);

  const insight = snappedDpi > 0
    ? `${snappedDpi} DPI — ${snappedDpi <= 800 ? 'Low sensitivity. Ideal for precision aiming.' : snappedDpi <= 1600 ? 'Medium sensitivity. Balanced for all genres.' : 'High sensitivity. Best for high-res displays.'}`
    : "Measure your actual mouse sensitivity.";

  return (
    <section id="dpi-meter" className="w-full py-[80px] border-b border-border">
      <div className="max-w-[760px] mx-auto px-6 flex flex-col items-center">
        
        <div className="w-full mb-12">
          <div className="text-[11px] font-mono font-bold text-muted tracking-[0.14em] uppercase mb-4">
            03 — MOUSE
          </div>
          <h2 className="text-display-lg text-brand mb-2">DPI Meter</h2>
          <p className="text-body-md text-muted">Measure your actual mouse sensitivity.</p>
        </div>

        <div className="w-full flex items-center gap-4 mb-12">
          <span className="text-body-sm text-muted">Screen width (cm):</span>
          <div className="flex items-center bg-surface-2 rounded-md border border-white/5 overflow-hidden">
            <input 
              type="number" 
              value={screenWidthCm}
              onChange={(e) => setScreenWidthCm(Number(e.target.value))}
              className="w-20 bg-transparent px-3 py-1.5 text-brand font-mono text-sm focus:outline-none"
            />
            <div className="flex flex-col border-l border-white/5">
              <button onClick={() => setScreenWidthCm(s => s + 1)} className="px-2 py-0.5 hover:bg-white/5 text-[8px]">▲</button>
              <button onClick={() => setScreenWidthCm(s => s - 1)} className="px-2 py-0.5 hover:bg-white/5 text-[8px] border-t border-white/5">▼</button>
            </div>
          </div>
        </div>

        <div 
          ref={trackRef}
          onMouseEnter={() => !isMeasuring && startMeasurement()}
          className="relative w-full h-[64px] bg-surface rounded-[10px] overflow-hidden mb-12 cursor-ew-resize group"
        >
          {/* TRACK HINT */}
          {!isMeasuring && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-muted uppercase tracking-[0.2em] group-hover:opacity-0 transition-opacity">
              hover here and sweep →
            </div>
          )}

          {/* RULER TICKS */}
          <div className="absolute bottom-0 left-0 w-full h-4 flex justify-between px-2 opacity-20">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-px bg-white ${i % 5 === 0 ? 'h-full' : 'h-2'}`} />
                {i === 0 && <span className="text-[8px] mt-1">0cm</span>}
                {i === 10 && <span className="text-[8px] mt-1">{screenWidthCm}cm</span>}
              </div>
            ))}
          </div>

          {/* SWEEP TRACK CONTENT */}
          {isMeasuring && (
            <>
              {/* TRAIL */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent to-heat/40"
                style={{ width: `${dotPos * 100}%` }}
              />
              {/* MOVING DOT */}
              <div 
                className="absolute top-1/2 w-[14px] h-[14px] bg-heat rounded-full shadow-[0_0_15px_var(--color-heat)] -translate-y-1/2 -translate-x-1/2 transition-transform duration-75"
                style={{ left: `${dotPos * 100}%` }}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          <div className="flex flex-col p-6 bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
            <div className="text-[36px] font-mono text-brand leading-none mb-2">
              {snappedDpi > 0 ? snappedDpi.toLocaleString() : '--'}
            </div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-muted">DPI (nearest)</div>
          </div>
          <div className="flex flex-col p-6 bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
            <div className="text-[36px] font-mono text-brand leading-none mb-2">
              {pixelsMoved > 0 ? pixelsMoved.toLocaleString() : '--'}
            </div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-muted">Counts recorded</div>
          </div>
        </div>

        <button 
          onClick={reset}
          className="text-caption font-bold text-muted hover:text-red-500 uppercase tracking-widest mb-12 transition-colors"
        >
          [RESET]
        </button>

        <p className="text-body-md text-brand italic border-l-2 border-heat pl-4 py-1 self-start">
          "{insight}"
        </p>

      </div>
    </section>
  );
};

export default DpiMeterSection;
