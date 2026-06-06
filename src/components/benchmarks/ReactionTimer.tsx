import React, { useState, useRef } from 'react';

export default function ReactionTimer() {
  const [state, setState] = useState<'ready' | 'wait' | 'go' | 'result' | 'early'>('ready');
  const [history, setHistory] = useState<number[]>([]);
  const startRef = useRef(0);
  const timeoutRef = useRef<number>(0);
  const [lastMs, setLastMs] = useState(0);

  const handleClick = () => {
    if (state === 'ready' || state === 'result' || state === 'early') {
      setState('wait');
      const waitTime = 1000 + Math.random() * 3000;
      timeoutRef.current = window.setTimeout(() => {
        setState('go');
        startRef.current = performance.now();
      }, waitTime);
    } else if (state === 'wait') {
      clearTimeout(timeoutRef.current);
      setState('early');
    } else if (state === 'go') {
      const ms = Math.round(performance.now() - startRef.current);
      setLastMs(ms);
      setHistory(h => [...h, ms]);
      setState('result');
    }
  };

  const avg = history.length ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : 0;
  const best = history.length ? Math.min(...history) : 0;

  return (
    <div className="bench-layout">
      <div>
        <div className="canvas-area shadow-3" style={{ border: '1px solid var(--hairline)' }}>
          <div className="canvas-toolbar" style={{ background: 'var(--canvas-soft-2)' }}>
            <span className="ctrl-label caption-mono">Visual Stimulus Test</span>
            <button className="ctrl-btn" onClick={() => setHistory([])} style={{ marginLeft: 'auto' }}>Reset Avg</button>
          </div>
          <div 
            onClick={handleClick}
            style={{ 
              minHeight: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', borderRadius: '0 0 var(--rounded-lg) var(--rounded-lg)', transition: 'background 0.15s',
              flexDirection: 'column', gap: '1rem', textAlign: 'center', userSelect: 'none',
              background: state === 'ready' ? 'var(--canvas)' : state === 'wait' ? 'var(--error-soft)' : state === 'go' ? 'var(--cyan-soft)' : 'var(--canvas)',
              borderTop: '1px solid var(--hairline)'
            }}
          >
            {state === 'ready' && (
              <>
                <div style={{ fontSize: '3rem' }}>⚡</div>
                <div className="display-md">Click to Start</div>
                <div style={{ color: 'var(--body)' }}>When the red box turns green, click as fast as you can.</div>
              </>
            )}
            {state === 'wait' && (
              <>
                <div style={{ fontSize: '3rem' }}>🔴</div>
                <div className="display-md" style={{ color: 'var(--error-deep)' }}>Wait for Green...</div>
              </>
            )}
            {state === 'go' && (
              <>
                <div style={{ fontSize: '3rem' }}>🟢</div>
                <div className="display-lg" style={{ color: 'var(--cyan-deep)' }}>CLICK!</div>
              </>
            )}
            {state === 'early' && (
              <>
                <div style={{ fontSize: '3rem' }}>❌</div>
                <div className="display-md" style={{ color: 'var(--error)' }}>Too Early!</div>
                <div style={{ color: 'var(--body)' }}>Click to try again.</div>
              </>
            )}
            {state === 'result' && (
              <>
                <div className="code" style={{ fontSize: '4rem', fontWeight: 500, color: 'var(--ink)' }}>{lastMs} ms</div>
                <div style={{ color: 'var(--mute)' }}>Click to keep going.</div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="stat-panel">
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Last Score</div>
          <div className="stat-card-val">{lastMs || '—'}<span className="stat-card-unit">{lastMs ? 'ms' : ''}</span></div>
          <div className="stat-card-sub">Your previous attempt</div>
          <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${lastMs ? Math.min(100, Math.max(0, 100 - (lastMs-150)/3)) : 0}%` }} /></div>
        </div>
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Average (5 attempts)</div>
          <div className="code" style={{ fontSize: '1.5rem', color: 'var(--cyan-deep)' }}>{avg || '—'}<span style={{ fontSize: '0.8rem', color: 'var(--mute)' }}>{avg ? ' ms' : ''}</span></div>
          <div className="stat-card-sub">{history.length} attempts recorded</div>
        </div>
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Personal Best</div>
          <div className="code" style={{ fontSize: '1.5rem', color: 'var(--ink)' }}>{best || '—'}<span style={{ fontSize: '0.8rem', color: 'var(--mute)' }}>{best ? ' ms' : ''}</span></div>
        </div>
      </div>
    </div>
  );
}
