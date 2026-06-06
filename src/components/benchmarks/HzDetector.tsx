import React, { useState, useEffect, useRef } from 'react';

export default function HzDetector() {
  const [hz, setHz] = useState(0);
  const [fps, setFps] = useState(0);
  const [running, setRunning] = useState(true);
  const [history, setHistory] = useState<number[]>([]);
  const frameTimesRef = useRef<number[]>([]);
  const lastRef = useRef(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const loop = (now: number) => {
      const delta = now - lastRef.current;
      lastRef.current = now;
      if (delta > 1 && delta < 200) {
        frameTimesRef.current.push(delta);
        if (frameTimesRef.current.length > 120) frameTimesRef.current.shift();
        const avg = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const measured = 1000 / avg;
        setFps(measured);
        const snapped = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 75, 90, 100, 119.88, 120, 144, 165, 180, 240, 300, 360, 480, 500, 540]
          .reduce((a, b) => Math.abs(b - measured) < Math.abs(a - measured) ? b : a);
        setHz(snapped);
        setHistory(h => {
          const newH = [...h, measured];
          if (newH.length > 60) newH.shift();
          return newH;
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const min = history.length ? Math.min(...history) : 0;
  const max = history.length ? Math.max(...history) : 0;
  const avg = history.length ? history.reduce((a, b) => a + b, 0) / history.length : 0;

  return (
    <div className="bench-layout">
      <div>
        <div className="canvas-area shadow-3" style={{ border: '1px solid var(--hairline)' }}>
          <div className="canvas-toolbar" style={{ background: 'var(--canvas-soft-2)' }}>
            <button className={`ctrl-btn ${running ? 'active' : ''}`} onClick={() => setRunning(r => !r)}>
              {running ? 'Pause' : 'Run'}
            </button>
            <button className="ctrl-btn" onClick={() => { frameTimesRef.current = []; setHistory([]); }}>Reset</button>
            <span className="ctrl-label caption-mono" style={{ marginLeft: 'auto' }}>
              {running ? <span className="blink" style={{ color: 'var(--cyan)' }}>LIVE</span> : 'PAUSED'}
            </span>
          </div>
          <div style={{ padding: '1.5rem', background: 'var(--canvas)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px', marginBottom: '0.5rem' }}>
              {Array.from({ length: 60 }, (_, i) => {
                const val = history[i] || 0;
                const h = val ? Math.max(4, (val / (max || 1)) * 100) : 0;
                let color = 'var(--ink)';
                if (val && hz > 0) {
                  if (val < hz * 0.8) color = 'var(--error)';
                  else if (val < hz * 0.95) color = 'var(--warning)';
                }
                return (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0',
                    background: color,
                    transition: 'height 0.1s', minHeight: val ? '2px' : '0'
                  }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="caption-mono">
              <span style={{ color: 'var(--mute)' }}>-60 frames</span>
              <span style={{ color: 'var(--mute)' }}>now</span>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--hairline)', borderRadius: 'var(--rounded-md)', overflow: 'hidden', border: '1px solid var(--hairline)' }}>
              {[['Min', min, 'var(--error)'], ['Avg', avg, 'var(--cyan)'], ['Max', max, 'var(--ink)']].map(([l, v, c]) => (
                <div key={l as string} style={{ background: 'var(--canvas-soft-2)', padding: '1rem', textAlign: 'center' }}>
                  <div className="caption-mono" style={{ color: 'var(--body)', marginBottom: '0.25rem' }}>{l}</div>
                  <div className="code" style={{ fontSize: '1.6rem', color: c as string }}>{(v as number).toFixed(2)}<span style={{ fontSize: '0.75rem', color: 'var(--mute)' }}> fps</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="stat-panel">
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Detected Refresh Rate</div>
          <div className="stat-card-val">{hz > 0 ? hz : '—'}<span className="stat-card-unit">{hz > 0 ? 'Hz' : ''}</span></div>
          <div className="stat-card-sub">Standard target</div>
          <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${Math.min(100, (hz / 360) * 100)}%` }} /></div>
        </div>
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Live Exact Hz</div>
          <div className="stat-card-val code" style={{ color: fps > hz * 0.95 ? 'var(--ink)' : 'var(--warning)' }}>
            {fps > 0 ? fps.toFixed(4) : '—'}<span className="stat-card-unit">Hz</span>
          </div>
          <div className="stat-card-sub">Decimal precision rendering</div>
        </div>
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Frame Time</div>
          <div className="stat-card-val code" style={{ fontSize: '1.6rem', color: 'var(--ink)' }}>
            {fps > 0 ? (1000 / fps).toFixed(2) : '—'}<span className="stat-card-unit">ms</span>
          </div>
          <div className="stat-card-sub">Time between frames</div>
        </div>
      </div>
    </div>
  );
}
