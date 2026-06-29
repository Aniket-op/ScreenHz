import React, { useState, useEffect, useRef, useCallback } from 'react';

const SNAPPED_RATES = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 75, 90, 100, 119.88, 120, 144, 165, 180, 240, 300, 360, 480, 500, 540];
const BG_OPTIONS = [
  { label: 'Dark',  value: '#0a0a0a',  text: '#fff' },
  { label: 'White', value: '#ffffff',  text: '#000' },
  { label: 'Gray',  value: '#808080',  text: '#fff' },
  { label: 'Cyan',  value: '#00e5ff',  text: '#000' },
  { label: 'Lime',  value: '#b5ff00',  text: '#000' },
];
const ANIM_TYPES  = ['UFO', 'Ball', 'Bar'] as const;
const ANIM_SPEEDS = ['Slow', 'Medium', 'Fast'] as const;
const SPEED_PX: Record<string, number> = { Slow: 1.2, Medium: 2.5, Fast: 5 };

type AnimType  = typeof ANIM_TYPES[number];
type AnimSpeed = typeof ANIM_SPEEDS[number];

// ────────────────────────────────────────────────────────────
//  Smoothness comparison canvas (runs at window rAF)
// ────────────────────────────────────────────────────────────
function SmoothnessCanvas({ targetHz, animType, speed, bgColor }: {
  targetHz: number; animType: AnimType; speed: AnimSpeed; bgColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef    = useRef([0, 0, 0]);   // positions for 3 rows
  const rafRef    = useRef(0);
  const lastRef   = useRef(performance.now());

  const ROWS = [
    { hz: targetHz,  label: `${targetHz} Hz (Your Screen)`,  color: '#00e5ff' },
    { hz: 60,        label: '60 Hz (Standard Display)',       color: '#a3a3a3' },
    { hz: 30,        label: '30 Hz (Low Frame Rate)',         color: '#ff6b6b' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pxPerFrame = SPEED_PX[speed];

    const draw = (now: number) => {
      const elapsed = now - lastRef.current;
      lastRef.current = now;
      const W = canvas.width, H = canvas.height;
      const rowH = Math.floor(H / 3);

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      ROWS.forEach((row, i) => {
        const y0 = i * rowH;
        const framesElapsed = elapsed / (1000 / row.hz);
        posRef.current[i] = (posRef.current[i] + pxPerFrame * framesElapsed) % (W + 80);

        // row label
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = bgColor === '#ffffff' ? '#333' : '#aaa';
        ctx.fillText(row.label, 8, y0 + 16);

        const cx = posRef.current[i] - 40;
        const cy = y0 + rowH / 2 + 4;

        if (animType === 'UFO') {
          // UFO body
          ctx.beginPath();
          ctx.ellipse(cx, cy, 28, 12, 0, 0, Math.PI * 2);
          ctx.fillStyle = row.color;
          ctx.fill();
          // dome
          ctx.beginPath();
          ctx.ellipse(cx, cy - 10, 14, 10, 0, Math.PI, 0);
          ctx.fillStyle = row.color + 'aa';
          ctx.fill();
          // lights
          [-14, 0, 14].forEach((dx, li) => {
            ctx.beginPath();
            ctx.arc(cx + dx, cy + 4, 3, 0, Math.PI * 2);
            ctx.fillStyle = li === 1 ? '#ffe066' : '#fff';
            ctx.fill();
          });
        } else if (animType === 'Ball') {
          ctx.beginPath();
          ctx.arc(cx, cy, 16, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, 16);
          grad.addColorStop(0, '#fff');
          grad.addColorStop(1, row.color);
          ctx.fillStyle = grad;
          ctx.fill();
        } else {
          // Bar
          ctx.fillStyle = row.color;
          ctx.fillRect(cx - 6, y0 + rowH * 0.15, 12, rowH * 0.7);
        }
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetHz, animType, speed, bgColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = canvas.parentElement?.offsetWidth  || 400;
      canvas.height = canvas.parentElement?.offsetHeight || 240;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', borderRadius: 'var(--rounded-md)' }}
    />
  );
}

// ────────────────────────────────────────────────────────────
//  Sparkline wave canvas
// ────────────────────────────────────────────────────────────
function WaveCanvas({ history, targetHz }: { history: number[]; targetHz: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (history.length < 2) return;

    const max = targetHz * 1.1;
    const min = Math.max(0, targetHz * 0.7);
    const mid = targetHz;

    // midline
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const midY = H - ((mid - min) / (max - min)) * H;
    ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();

    // wave
    ctx.beginPath();
    ctx.strokeStyle = '#00c97a';
    ctx.lineWidth   = 2;
    history.forEach((v, i) => {
      const x = (i / (history.length - 1)) * W;
      const y = H - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * H;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [history, targetHz]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = canvas.parentElement?.offsetWidth  || 400;
    canvas.height = canvas.parentElement?.offsetHeight || 60;
    const obs = new ResizeObserver(() => {
      canvas.width  = canvas.parentElement?.offsetWidth  || 400;
      canvas.height = canvas.parentElement?.offsetHeight || 60;
    });
    if (canvas.parentElement) obs.observe(canvas.parentElement);
    return () => obs.disconnect();
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// ────────────────────────────────────────────────────────────
//  Main component
// ────────────────────────────────────────────────────────────
export default function MobileHzDetector() {
  const [hz,          setHz]         = useState(0);
  const [fps,         setFps]        = useState(0);
  const [running,     setRunning]    = useState(true);
  const [history,     setHistory]    = useState<number[]>([]);
  const [totalFrames, setTotal]      = useState(0);
  const [animType,    setAnimType]   = useState<AnimType>('UFO');
  const [animSpeed,   setAnimSpeed]  = useState<AnimSpeed>('Medium');
  const [bgColor,     setBgColor]    = useState('#0a0a0a');
  const [isFullscreen,setFullscreen] = useState(false);

  const frameTimesRef = useRef<number[]>([]);
  const lastRef       = useRef(performance.now());
  const rafRef        = useRef(0);
  const frameCountRef = useRef(0);

  const jitter = (() => {
    if (history.length < 2) return 0;
    const ft = history.map(h => 1000 / h);
    const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
    const variance = ft.reduce((a, b) => a + (b - avg) ** 2, 0) / ft.length;
    return Math.sqrt(variance);
  })();
  const minHz = history.length ? Math.min(...history) : 0;
  const maxHz = history.length ? Math.max(...history) : 0;

  useEffect(() => {
    if (!running) { cancelAnimationFrame(rafRef.current); return; }
    const loop = (now: number) => {
      const delta = now - lastRef.current;
      lastRef.current = now;
      if (delta > 1 && delta < 200) {
        frameTimesRef.current.push(delta);
        frameCountRef.current++;
        if (frameTimesRef.current.length > 120) frameTimesRef.current.shift();
        const avg = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const measured = 1000 / avg;
        const snapped = SNAPPED_RATES.reduce((a, b) => Math.abs(b - measured) < Math.abs(a - measured) ? b : a);
        setFps(measured);
        setHz(snapped);
        setTotal(frameCountRef.current);
        setHistory(h => { const n = [...h, measured]; if (n.length > 120) n.shift(); return n; });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const handleReset = () => {
    frameTimesRef.current = [];
    frameCountRef.current = 0;
    setHistory([]);
    setHz(0);
    setFps(0);
    setTotal(0);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false));
    }
  };

  const stable = history.length > 30 && jitter < 2;
  const stableColor = stable ? '#00c97a' : '#ffaa00';

  return (
    <div className="bench-layout">
      {/* ── Left / Main column ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Toolbar */}
        <div className="canvas-area shadow-3" style={{ border: '1px solid var(--hairline)' }}>
          <div className="canvas-toolbar" style={{ background: 'var(--canvas-soft-2)', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: stableColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: stableColor, display: 'inline-block', animation: stable ? 'none' : 'blink 1s infinite' }} />
              {stable ? 'Stable Rate Detected' : history.length < 10 ? 'Measuring…' : 'Calibrating…'}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
              <button className="ctrl-btn" onClick={handleReset}>↺ Restart</button>
              <button className="ctrl-btn" onClick={handleFullscreen}>⛶ Full Screen</button>
            </div>
          </div>

          {/* Main Hz display */}
          <div style={{ padding: '1.5rem', background: 'var(--canvas)' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Big Hz number */}
              <div style={{ minWidth: 160, textAlign: 'center' }}>
                <div className="caption-mono" style={{ color: 'var(--mute)', marginBottom: '0.25rem', fontSize: '0.72rem' }}>DETECTED REFRESH RATE</div>
                <div style={{ fontSize: 'clamp(3.5rem, 10vw, 6rem)', fontWeight: 900, color: 'var(--ink)', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                  {hz > 0 ? hz : '—'}
                  {hz > 0 && <span style={{ fontSize: '1.8rem', color: '#00c97a', marginLeft: '0.15em' }}>Hz</span>}
                </div>
                <div className="caption-mono" style={{ color: 'var(--mute)', marginTop: '0.5rem', fontSize: '0.78rem' }}>
                  Live Real-Time Hz: <span style={{ color: 'var(--ink)' }}>{fps > 0 ? fps.toFixed(2) : '—'} Hz</span>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ flex: 1, minWidth: 220, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'var(--hairline)', borderRadius: 'var(--rounded-md)', overflow: 'hidden', border: '1px solid var(--hairline)', alignSelf: 'flex-start' }}>
                {[
                  ['MIN RATE',     minHz > 0 ? minHz.toFixed(1) + ' Hz' : '—', 'var(--error)'],
                  ['MAX RATE',     maxHz > 0 ? maxHz.toFixed(1) + ' Hz' : '—', 'var(--ink)'],
                  ['STUTTER JITTER', jitter > 0 ? jitter.toFixed(3) + ' ms' : '—', jitter > 2 ? 'var(--warning)' : '#00c97a'],
                  ['TOTAL FRAMES',  totalFrames > 0 ? totalFrames.toLocaleString() : '—', 'var(--cyan)'],
                ].map(([label, value, color]) => (
                  <div key={label} style={{ background: 'var(--canvas-soft-2)', padding: '0.85rem', textAlign: 'center' }}>
                    <div className="caption-mono" style={{ color: 'var(--mute)', marginBottom: '0.2rem', fontSize: '0.65rem' }}>{label}</div>
                    <div className="code" style={{ color, fontSize: '1.1rem', fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consistency Wave */}
            <div style={{ marginTop: '1rem' }}>
              <div className="caption-mono" style={{ color: 'var(--mute)', fontSize: '0.7rem', marginBottom: '0.35rem', textAlign: 'right' }}>FPS Consistency Wave</div>
              <div style={{ height: 64, background: 'var(--canvas-soft-2)', borderRadius: 'var(--rounded)', border: '1px solid var(--hairline)', overflow: 'hidden' }}>
                <WaveCanvas history={history} targetHz={hz || 60} />
              </div>
            </div>
          </div>
        </div>

        {/* Smoothness comparison */}
        <div className="canvas-area shadow-3" style={{ border: '1px solid var(--hairline)' }}>
          <div className="canvas-toolbar" style={{ background: 'var(--canvas-soft-2)', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="caption-mono" style={{ fontSize: '0.78rem', color: 'var(--body)', fontWeight: 600 }}>Hz Visual Smoothness Comparison</span>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
              {ANIM_TYPES.map(t => (
                <button key={t} className={`ctrl-btn ${animType === t ? 'active' : ''}`} onClick={() => setAnimType(t)} style={{ fontSize: '0.72rem' }}>
                  {t === 'UFO' ? '🛸' : t === 'Ball' ? '⚽' : '▌'} {t}
                </button>
              ))}
              <span style={{ width: 1, background: 'var(--hairline)', margin: '0 0.15rem' }} />
              {ANIM_SPEEDS.map(s => (
                <button key={s} className={`ctrl-btn ${animSpeed === s ? 'active' : ''}`} onClick={() => setAnimSpeed(s)} style={{ fontSize: '0.72rem' }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ background: bgColor, height: 240, overflow: 'hidden', position: 'relative' }}>
            <SmoothnessCanvas targetHz={hz || 60} animType={animType} speed={animSpeed} bgColor={bgColor} />
          </div>
          {/* BG color picker */}
          <div style={{ padding: '0.6rem 1rem', background: 'var(--canvas-soft-2)', borderTop: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="caption-mono" style={{ fontSize: '0.7rem', color: 'var(--mute)' }}>BACKGROUND COLOR</span>
            {BG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                title={opt.label}
                onClick={() => setBgColor(opt.value)}
                style={{
                  width: 24, height: 24, borderRadius: '50%', border: bgColor === opt.value ? '3px solid var(--primary)' : '2px solid var(--hairline)',
                  background: opt.value, cursor: 'pointer', padding: 0, transition: 'transform 0.15s',
                  transform: bgColor === opt.value ? 'scale(1.25)' : 'scale(1)',
                }}
              />
            ))}
            <span className="caption-mono" style={{ fontSize: '0.67rem', color: 'var(--mute)', marginLeft: 'auto', maxWidth: 260 }}>
              Tip: Use Cyan or Lime to check LCD panel pixel response rate &amp; ghosting
            </span>
          </div>
        </div>
      </div>

      {/* ── Right / Stat panel ── */}
      <div className="stat-panel">
        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Detected Refresh Rate</div>
          <div className="stat-card-val">{hz > 0 ? hz : '—'}<span className="stat-card-unit">{hz > 0 ? 'Hz' : ''}</span></div>
          <div className="stat-card-sub">Snapped to nearest standard</div>
          <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${Math.min(100, (hz / 480) * 100)}%` }} /></div>
        </div>

        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Live Exact Hz</div>
          <div className="stat-card-val code" style={{ color: fps > 0 && hz > 0 && fps > hz * 0.95 ? 'var(--ink)' : 'var(--warning)', fontSize: '1.6rem' }}>
            {fps > 0 ? fps.toFixed(2) : '—'}<span className="stat-card-unit">Hz</span>
          </div>
          <div className="stat-card-sub">Decimal-precision rAF timing</div>
        </div>

        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Frame Time</div>
          <div className="stat-card-val code" style={{ fontSize: '1.5rem', color: 'var(--ink)' }}>
            {fps > 0 ? (1000 / fps).toFixed(2) : '—'}<span className="stat-card-unit">ms</span>
          </div>
          <div className="stat-card-sub">Time between frames</div>
        </div>

        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Stutter Jitter</div>
          <div className="stat-card-val code" style={{ fontSize: '1.5rem', color: jitter > 2 ? 'var(--warning)' : '#00c97a' }}>
            {jitter > 0 ? jitter.toFixed(3) : '—'}<span className="stat-card-unit">ms</span>
          </div>
          <div className="stat-card-sub">{jitter > 2 ? '⚠ Frame inconsistency detected' : '✓ Frame timing consistent'}</div>
        </div>

        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">LTPO Status</div>
          <div style={{ padding: '0.75rem 0' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--body)', lineHeight: 1.5 }}>
              {hz > 0 && hz < 60 ? (
                <span style={{ color: '#00c97a', fontWeight: 700 }}>✓ LTPO: Low-rate detected ({hz} Hz)</span>
              ) : hz >= 90 ? (
                <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>✓ High refresh ({hz} Hz)</span>
              ) : (
                <span style={{ color: 'var(--mute)' }}>Measuring…</span>
              )}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--mute)', marginTop: '0.4rem' }}>
              LTPO panels dynamically switch Hz. Watch the live counter change when your screen is idle vs active.
            </p>
          </div>
        </div>

        <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
          <div className="stat-card-label caption-mono">Session Frames</div>
          <div className="stat-card-val code" style={{ fontSize: '1.8rem', color: 'var(--ink)' }}>
            {totalFrames.toLocaleString()}<span className="stat-card-unit" style={{ fontSize: '0.8rem' }}>frames</span>
          </div>
          <div className="stat-card-sub">Counted since last reset</div>
        </div>
      </div>
    </div>
  );
}
