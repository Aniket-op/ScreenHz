import React, { useState, useRef, useCallback } from 'react';

export default function PollRateMeter() {
  const [pollHz, setPollHz] = useState(0);
  const [raw, setRaw] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [active, setActive] = useState(false);
  const timesRef = useRef<number[]>([]);
  const lastRef = useRef(0);
  const barsRef = useRef<number[]>(new Array(40).fill(0));
  const [bars, setBars] = useState<number[]>(new Array(40).fill(0));

  const handleMove = useCallback(() => {
    const now = performance.now();
    if (lastRef.current) {
      const delta = now - lastRef.current;
      if (delta > 0.1 && delta < 50) {
        timesRef.current.push(delta);
        if (timesRef.current.length > 200) timesRef.current.shift();
        const avg = timesRef.current.reduce((a, b) => a + b, 0) / timesRef.current.length;
        const measured = 1000 / avg;
        const snapped = [125, 250, 500, 1000, 2000, 4000, 8000].reduce((a, b) =>
          Math.abs(b - measured) < Math.abs(a - measured) ? b : a
        );
        setPollHz(snapped);
        setRaw(Math.round(measured));
        const variance = Math.sqrt(timesRef.current.map(t => Math.pow(t - avg, 2)).reduce((a, b) => a + b, 0) / timesRef.current.length);
        setJitter(Number(variance.toFixed(2)));
        barsRef.current = [...barsRef.current.slice(1), Math.min(100, (measured / 1000) * 100)];
        setBars([...barsRef.current]);
      }
    }
    lastRef.current = now;
    setActive(true);
  }, []);

  return (
    <div className="bench-layout">
      <div>
        <div className="canvas-area shadow-3" onMouseMove={handleMove} style={{ border: '1px solid var(--hairline)' }}>
          <div className="canvas-toolbar" style={{ background: 'var(--canvas-soft-2)' }}>
            <span className="ctrl-label caption-mono">Move mouse inside this area</span>
            {active && <span className="caption-mono" style={{ color: 'var(--cyan)', marginLeft: '1rem' }}>TRACKING</span>}
            <button className="ctrl-btn" onClick={() => { timesRef.current = []; setPollHz(0); setRaw(0); setActive(false); }} style={{ marginLeft: 'auto' }}>Reset</button>
          </div>
          <div style={{ padding: '1.5rem', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'var(--canvas)' }}>
            {!active && (
              <div style={{ textAlign: 'center', color: 'var(--mute)', paddingBottom: '3rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖱️</div>
                <div className="caption-mono">Move your mouse here to measure poll rate</div>
              </div>
            )}
            <div style={{ height: '120px', alignItems: 'flex-end', display: 'flex', gap: '3px', paddingBottom: '0.5rem' }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  flex: 1, height: `${Math.max(2, h)}%`, borderRadius: '2px 2px 0 0',
                  background: h > 90 ? 'var(--success)' : h > 60 ? 'var(--primary)' : 'var(--warning)',
                  transition: 'height 0.05s'
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', paddingTop: '0.5rem', borderTop: '1px solid var(--hairline)' }}>
              {[125, 250, 500, 1000].map(h => (
                <span key={h} style={{ color: pollHz === h ? 'var(--primary)' : 'inherit' }}>{h}Hz</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="stat-panel">
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Poll Rate</div>
          <div className="stat-card-val">{pollHz || '—'}<span className="stat-card-unit">{pollHz ? 'Hz' : ''}</span></div>
          <div className="stat-card-sub">Standard target</div>
          <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${pollHz ? Math.min(100, (pollHz / 1000) * 100) : 0}%` }} /></div>
        </div>
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Raw Measured</div>
          <div className="code" style={{ fontSize: '1.5rem', color: 'var(--ink)' }}>{raw || '—'}<span style={{ fontSize: '0.8rem', color: 'var(--mute)' }}>{raw ? ' Hz' : ''}</span></div>
        </div>
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Jitter</div>
          <div className="code" style={{ fontSize: '1.5rem', color: jitter < 0.5 ? 'var(--ink)' : jitter < 1.5 ? 'var(--warning)' : 'var(--error)' }}>
            {jitter || '—'}<span style={{ fontSize: '0.8rem', color: 'var(--mute)' }}>{jitter ? ' ms σ' : ''}</span>
          </div>
          <div className="stat-card-sub">{jitter < 0.5 ? 'Excellent consistency' : jitter < 1.5 ? 'Good' : jitter > 0 ? 'High variance' : ''}</div>
        </div>
      </div>
    </div>
  );
}
