import React, { useState, useEffect, useRef } from 'react';

export default function GhostingTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(true);
  const [overdrive, setOverdrive] = useState('off');
  const posRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const loop = () => {
      const W = canvas.width, H = canvas.height;
      posRef.current = (posRef.current + 4) % (W + 60);
      const x = posRef.current;

      // Persistence effect
      const persistence = overdrive === 'off' ? 0.7 : overdrive === 'low' ? 0.85 : 0.95;
      ctx.fillStyle = `rgba(13,13,13,${1 - persistence})`;
      ctx.fillRect(0, 0, W, H);

      // Inverse ghosting simulation
      if (overdrive === 'high') {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(x - 30, H / 2 - 25, 5, 50); // overshoot artifact ahead/behind
      }

      // Draw sharp object
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 25, H / 2 - 25, 50, 50);

      // Add a moving checker pattern inside
      ctx.fillStyle = 'rgba(0,229,255,0.6)';
      for (let tx = 0; tx < 50; tx += 10) {
        for (let ty = 0; ty < 50; ty += 10) {
          if ((tx + ty) % 20 === 0)
            ctx.fillRect(x - 25 + tx, H / 2 - 25 + ty, 10, 10);
        }
      }
      
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, overdrive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || 800;
      canvas.height = 240;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className="bench-layout">
      <div>
        <div className="canvas-area shadow-3" style={{ border: '1px solid var(--hairline)' }}>
          <div className="canvas-toolbar" style={{ background: 'var(--canvas-soft-2)' }}>
            <span className="ctrl-label caption-mono">Overdrive</span>
            {['off', 'low', 'high'].map(v => (
              <button key={v} className={`ctrl-btn ${overdrive === v ? 'active' : ''}`} onClick={() => setOverdrive(v)}>
                {v.toUpperCase()}
              </button>
            ))}
            <button className={`ctrl-btn ${running ? 'active' : ''}`} onClick={() => setRunning(r => !r)} style={{ marginLeft: 'auto' }}>
              {running ? 'Pause' : 'Run'}
            </button>
          </div>
          <canvas ref={canvasRef} style={{ width: '100%', display: 'block', borderRadius: '0 0 var(--rounded-md) var(--rounded-md)' }} />
        </div>
        <div className="shadow-2" style={{ marginTop: 'var(--spacing-md)', background: 'var(--canvas)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-lg)' }}>
          <p className="body-sm" style={{ color: 'var(--body)' }}>
            Ghosting occurs when a pixel doesn't transition fast enough, leaving a smear trail behind moving objects. Toggle overdrive levels to see how aggressive overdrive reduces ghosting — but too much causes inverse ghosting (bright halo ahead of motion).
          </p>
        </div>
      </div>
      <div className="stat-panel">
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Overdrive Mode</div>
          <div className="code" style={{ fontSize: '1.4rem', color: overdrive === 'off' ? 'var(--body)' : overdrive === 'low' ? 'var(--warning)' : 'var(--error)', marginTop: '0.25rem' }}>
            {overdrive.toUpperCase()}
          </div>
          <div className="stat-card-sub">
            {overdrive === 'off' ? 'Pixel persistence visible' : overdrive === 'low' ? 'Reduced smearing' : 'Minimal ghosting (Overshoot risk)'}
          </div>
        </div>
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Panel Type Guide</div>
          <div className="body-sm" style={{ color: 'var(--body)', marginTop: '0.5rem' }}>
            <div style={{ marginBottom: 'var(--spacing-xs)' }}>🔵 <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>IPS</strong> — worst ghosting, best colors</div>
            <div style={{ marginBottom: 'var(--spacing-xs)' }}>🟡 <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>VA</strong> — severe smearing in dark areas</div>
            <div style={{ marginBottom: 'var(--spacing-xs)' }}>🟢 <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>TN</strong> — least ghosting, poor viewing angle</div>
            <div style={{ marginBottom: 'var(--spacing-xs)' }}>⚡ <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>OLED</strong> — near-zero ghosting</div>
          </div>
        </div>
      </div>
    </div>
  );
}
