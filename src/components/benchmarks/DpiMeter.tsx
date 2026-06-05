import React, { useEffect, useRef, useState } from 'react';
import ScoreBar from '../ui/ScoreBar';

const COMMON_DPI = [400, 800, 1000, 1200, 1600, 3200, 6400, 12800];

interface DpiMeterProps {
  onResult?: (dpi: number) => void;
}

const DpiMeter: React.FC<DpiMeterProps> = ({ onResult }) => {
  const [screenWidthCm, setScreenWidthCm] = useState(52);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [pixelsMoved, setPixelsMoved] = useState(0);
  const [estimatedDpi, setEstimatedDpi] = useState(0);
  const [snappedDpi, setSnappedDpi] = useState(0);
  
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);

  const startMeasurement = () => {
    setIsMeasuring(true);
    setPixelsMoved(0);
    setEstimatedDpi(0);
    startXRef.current = null;
  };

  useEffect(() => {
    if (!isMeasuring) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (startXRef.current === null) {
        startXRef.current = e.screenX;
        return;
      }
      
      const totalDelta = Math.abs(e.screenX - startXRef.current);
      setPixelsMoved(totalDelta);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMeasuring]);

  const finishMeasurement = () => {
    setIsMeasuring(false);
    
    if (!trackRef.current) return;
    const trackWidthPx = trackRef.current.offsetWidth;
    
    // We assume the user swept across the visual track which represents a physical portion of the screen
    // physicalDistance = (trackWidthPx / screenResolutionWidth) * screenWidthCm
    // Since screenX is in device pixels, we need to compare with screen width in device pixels
    const physicalCmMoved = (trackWidthPx / window.screen.width) * screenWidthCm;
    const physicalInches = physicalCmMoved / 2.54;
    const dpi = pixelsMoved / physicalInches;
    
    if (dpi > 0) {
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
      if (onResult) onResult(Math.round(snapped));
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 bg-surface rounded-xl border border-border shadow-xl">
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-mono font-bold text-brand uppercase tracking-tighter">DPI Estimator</h3>
        <p className="text-xs font-mono text-muted leading-relaxed uppercase tracking-widest">
          MOVE MOUSE SLOWLY LEFT → RIGHT ACROSS FULL SCREEN
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-4 bg-surface-elevated p-3 rounded-lg border border-border">
          <label className="text-[10px] font-mono font-bold text-muted uppercase whitespace-nowrap">SCREEN WIDTH (cm):</label>
          <input 
            type="number" 
            value={screenWidthCm}
            onChange={(e) => setScreenWidthCm(Number(e.target.value))}
            className="w-full bg-bg border border-border rounded px-3 py-1 text-brand font-mono text-xs focus:outline-none focus:border-cyber transition-colors"
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={isMeasuring ? finishMeasurement : startMeasurement}
            className={`w-full py-3 font-mono text-xs font-bold rounded border transition-all tracking-widest ${isMeasuring ? 'bg-heat/10 border-heat text-heat animate-pulse' : 'bg-transparent border-neon text-neon hover:bg-neon/10'}`}
          >
            {isMeasuring ? 'CLICK TO FINISH' : 'START CALIBRATION'}
          </button>
        </div>
      </div>

      <div 
        ref={trackRef}
        className="h-20 bg-bg rounded-lg border border-border relative overflow-hidden flex items-center px-4 cursor-ew-resize"
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-cyber shadow-[0_0_10px_#00ccff]" />
        <div className="absolute inset-y-0 right-0 w-1 bg-cyber shadow-[0_0_10px_#00ccff]" />
        
        {isMeasuring && (
          <div 
            className="absolute h-0.5 bg-heat/40 shadow-[0_0_10px_rgba(255,107,53,0.4)] pointer-events-none transition-all duration-75"
            style={{ width: `${Math.min(100, (pixelsMoved / 2000) * 100)}%`, left: 0 }}
          />
        )}
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] font-mono font-bold text-muted uppercase tracking-[0.4em]">
            {isMeasuring ? 'Recording counts...' : 'Sweep track'}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-4 flex justify-between px-1 opacity-20">
          {[...Array(11)].map((_, i) => (
            <div key={i} className={`w-px bg-white ${i % 5 === 0 ? 'h-full' : 'h-2'}`} />
          ))}
        </div>
      </div>

      {estimatedDpi > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 bg-bg border border-border rounded-lg">
            <div className="text-[10px] font-mono font-bold text-muted uppercase mb-1">Estimated DPI</div>
            <div className="text-2xl font-mono font-bold text-cyber">{Math.round(estimatedDpi)}</div>
          </div>
          <div className="p-4 bg-bg border border-border rounded-lg">
            <div className="text-[10px] font-mono font-bold text-muted uppercase mb-1">Counts Recorded</div>
            <div className="text-2xl font-mono font-bold text-pulse">{pixelsMoved}</div>
          </div>
        </div>
      )}

      <div className="score-section border-t border-border pt-6 flex flex-col gap-4">
        <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">DPI Rating</div>
        <ScoreBar 
          label="Precision" 
          value={Math.min(100, Math.round(estimatedDpi / 6400 * 100))} 
          displayValue={`${snappedDpi}`} 
          color="var(--color-heat)" 
        />
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest mt-2">
          {snappedDpi === 400 ? 'Low DPI — good for FPS precision' : snappedDpi === 800 ? 'Standard gaming DPI' : 'High sensitivity setup'}
        </p>
      </div>
    </div>
  );
};

export default DpiMeter;
