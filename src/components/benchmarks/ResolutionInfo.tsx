import React, { useState, useEffect, useRef, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────────────────
//  Checker pattern canvas (1:1 pixel test)
// ────────────────────────────────────────────────────────────────────────────
function CheckerCanvas({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.screen.width  * dpr;
    canvas.height = window.screen.height * dpr;
    canvas.style.width  = '100vw';
    canvas.style.height = '100vh';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const isWhite = (x + y) % 2 === 0;
        const idx = (y * W + x) * 4;
        data[idx]     = isWhite ? 255 : 0;
        data[idx + 1] = isWhite ? 255 : 0;
        data[idx + 2] = isWhite ? 255 : 0;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', cursor: 'crosshair' }} onClick={onClose}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '0.5rem 1.25rem',
        borderRadius: 999, fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace",
        border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none',
      }}>
        1:1 Checker Pattern — Click anywhere to close
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  Device comparison table data
// ────────────────────────────────────────────────────────────────────────────
const DEVICES = [
  { name: 'iPhone 15 Pro',     res: '2556×1179', dpr: '3.0',  ppi: '460', type: 'Phone' },
  { name: 'iPhone 15',         res: '2556×1179', dpr: '3.0',  ppi: '460', type: 'Phone' },
  { name: 'Samsung S24 Ultra', res: '3088×1440', dpr: '3.75', ppi: '505', type: 'Phone' },
  { name: 'Pixel 8 Pro',       res: '2992×1344', dpr: '3.5',  ppi: '489', type: 'Phone' },
  { name: 'iPad Pro 12.9"',    res: '2732×2048', dpr: '2.0',  ppi: '264', type: 'Tablet' },
  { name: 'MacBook Pro 14"',   res: '3024×1964', dpr: '2.0',  ppi: '254', type: 'Laptop' },
  { name: 'MacBook Air M2',    res: '2560×1664', dpr: '2.0',  ppi: '224', type: 'Laptop' },
  { name: '4K Monitor (27")',   res: '3840×2160', dpr: '1.0–2', ppi: '163', type: 'Monitor' },
  { name: '1440p Monitor (27")',res: '2560×1440', dpr: '1.0',  ppi: '109', type: 'Monitor' },
];

const TYPE_COLOR: Record<string, string> = {
  Phone: '#00c97a', Tablet: '#00e5ff', Laptop: '#a78bfa', Monitor: '#f59e0b',
};

// ────────────────────────────────────────────────────────────────────────────
//  Stat card component
// ────────────────────────────────────────────────────────────────────────────
function StatRow({ label, value, sub, color = 'var(--ink)', badge }: {
  label: string; value: string; sub?: string; color?: string; badge?: string;
}) {
  return (
    <div style={{
      padding: '1rem 1.25rem',
      background: 'var(--canvas-soft-2)',
      borderRadius: 'var(--rounded-md)',
      border: '1px solid var(--hairline)',
      display: 'flex', flexDirection: 'column', gap: '0.2rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="caption-mono" style={{ fontSize: '0.7rem', color: 'var(--mute)' }}>{label}</span>
        {badge && (
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: 999, background: TYPE_COLOR[badge] + '22', color: TYPE_COLOR[badge], fontWeight: 700 }}>{badge}</span>
        )}
      </div>
      <div className="code" style={{ fontSize: '1.35rem', fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--mute)' }}>{sub}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  Main Component
// ────────────────────────────────────────────────────────────────────────────
export default function ResolutionInfo() {
  const [mounted,   setMounted]   = useState(false);
  const [vw,        setVw]        = useState(0);
  const [vh,        setVh]        = useState(0);
  const [checker,   setChecker]   = useState(false);
  const [orient,    setOrient]    = useState('');

  // Wait for client-side render
  useEffect(() => {
    setMounted(true);
    const update = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
      setOrient(window.screen?.orientation?.type?.includes('portrait') ? 'Portrait' : 'Landscape');
    };
    update();
    window.addEventListener('resize', update);
    window.screen?.orientation?.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.screen?.orientation?.removeEventListener?.('change', update);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="bench-layout">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--mute)' }}>
          Loading display info…
        </div>
      </div>
    );
  }

  const dpr      = window.devicePixelRatio || 1;
  const cssW     = window.screen.width;
  const cssH     = window.screen.height;
  const physW    = Math.round(cssW * dpr);
  const physH    = Math.round(cssH * dpr);
  const colorDep = window.screen.colorDepth;
  
  // Aspect ratio
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const g = gcd(physW, physH);
  const arW = physW / g, arH = physH / g;
  // Simplify large ratios
  const aspectLabel = (() => {
    const r = physW / physH;
    if (Math.abs(r - 16/9) < 0.02) return '16:9';
    if (Math.abs(r - 16/10) < 0.02) return '16:10';
    if (Math.abs(r - 4/3) < 0.02) return '4:3';
    if (Math.abs(r - 21/9) < 0.03) return '21:9';
    if (Math.abs(r - 32/9) < 0.03) return '32:9';
    if (Math.abs(r - 1) < 0.01) return '1:1';
    return `${arW}:${arH}`;
  })();

  const deviceType = (() => {
    if (navigator.maxTouchPoints > 0) {
      return cssW < 768 ? 'Phone' : 'Tablet';
    }
    return cssW > 1800 ? 'Monitor' : 'Laptop';
  })();

  return (
    <>
      {checker && <CheckerCanvas onClose={() => setChecker(false)} />}

      <div className="bench-layout">
        {/* ── Left: Stats ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Main stats grid */}
          <div className="canvas-area shadow-3" style={{ border: '1px solid var(--hairline)' }}>
            <div className="canvas-toolbar" style={{ background: 'var(--canvas-soft-2)' }}>
              <span className="caption-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--body)' }}>Display Resolution & DPI Info</span>
              <button
                className="ctrl-btn"
                style={{ marginLeft: 'auto', background: 'var(--primary)', color: 'var(--bg)', fontWeight: 700 }}
                onClick={() => setChecker(true)}
              >
                ⊞ 1:1 Checker Test
              </button>
            </div>
            <div style={{ padding: '1.25rem', background: 'var(--canvas)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <StatRow
                label="Physical Resolution"
                value={`${physW} × ${physH}`}
                sub="Device pixels (logical × DPR)"
                color="var(--ink)"
                badge={deviceType}
              />
              <StatRow
                label="CSS / Logical Resolution"
                value={`${cssW} × ${cssH}`}
                sub="CSS pixels (window.screen)"
                color="var(--cyan)"
              />
              <StatRow
                label="Device Pixel Ratio (DPR)"
                value={dpr % 1 === 0 ? `${dpr}.0×` : `${dpr}×`}
                sub={dpr === 1 ? '1:1 — standard display' : dpr >= 2 ? 'HiDPI / Retina' : 'Scaled display'}
                color={dpr >= 2 ? '#00c97a' : dpr === 1 ? 'var(--mute)' : 'var(--warning)'}
              />
              <StatRow
                label="Aspect Ratio"
                value={aspectLabel}
                sub={`${physW / physH > 1 ? 'Landscape' : 'Portrait'} format`}
                color="var(--ink)"
              />
              <StatRow
                label="Color Bit Depth"
                value={`${colorDep}-bit`}
                sub={colorDep >= 30 ? '10-bit+ (HDR capable)' : colorDep === 24 ? '8-bit per channel (SDR)' : 'Standard'}
                color={colorDep >= 30 ? '#00c97a' : 'var(--ink)'}
              />
              <StatRow
                label="Screen Orientation"
                value={orient}
                sub={`Detected via screen.orientation`}
                color="var(--ink)"
              />
            </div>
          </div>

          {/* Live Viewport Tracker */}
          <div className="canvas-area shadow-3" style={{ border: '1px solid var(--hairline)' }}>
            <div className="canvas-toolbar" style={{ background: 'var(--canvas-soft-2)' }}>
              <span className="caption-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--body)' }}>
                📐 Live Viewport Tracker
                <span className="blink" style={{ color: 'var(--cyan)', marginLeft: '0.5rem', fontSize: '0.7rem' }}>LIVE</span>
              </span>
            </div>
            <div style={{ padding: '1.25rem', background: 'var(--canvas)' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div className="caption-mono" style={{ color: 'var(--mute)', fontSize: '0.7rem', marginBottom: '0.3rem' }}>VIEWPORT WIDTH × HEIGHT</div>
                  <div className="code" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                    {vw}<span style={{ color: 'var(--mute)', fontSize: '1.2rem' }}> × </span>{vh}
                    <span style={{ fontSize: '0.9rem', color: 'var(--mute)', marginLeft: '0.2em' }}>px</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--mute)', marginTop: '0.3rem' }}>Resize your window to see this update in real time</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', minWidth: 200 }}>
                  {[
                    ['Viewport W', vw + ' px'],
                    ['Viewport H', vh + ' px'],
                    ['Vw ratio', (vw / cssW * 100).toFixed(1) + '% of screen'],
                    ['Vh ratio', (vh / cssH * 100).toFixed(1) + '% of screen'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: 'var(--canvas-soft-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded)', padding: '0.5rem 0.75rem' }}>
                      <div className="caption-mono" style={{ fontSize: '0.65rem', color: 'var(--mute)' }}>{l}</div>
                      <div className="code" style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual viewport bar */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ height: 8, background: 'var(--hairline)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: '100%', width: `${(vw / cssW) * 100}%`, background: 'var(--primary)', borderRadius: 999, transition: 'width 0.1s' }} />
                </div>
                <div className="caption-mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.65rem', color: 'var(--mute)' }}>
                  <span>0px</span><span>Viewport: {vw}px</span><span>Screen: {cssW}px</span>
                </div>
              </div>
            </div>
          </div>

          {/* 1:1 info box */}
          <div style={{ padding: '1rem 1.25rem', background: 'var(--canvas-soft)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-md)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--body)', marginBottom: '0.3rem' }}>What is the 1:1 Checker Test?</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--mute)', lineHeight: 1.6, margin: 0 }}>
                Renders a true 1px alternating black/white pattern at your screen's physical pixel count. If your OS is applying DPI scaling, the pattern will appear blurred, gray, or show moiré — revealing scaling artifacts. A perfect Retina/HiDPI display will render it as a uniform 50% gray.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Stat panel + devices table ── */}
        <div className="stat-panel">
          <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
            <div className="stat-card-label caption-mono">Physical Resolution</div>
            <div className="stat-card-val" style={{ fontSize: '1.5rem' }}>{physW}<span className="stat-card-unit">×{physH}</span></div>
            <div className="stat-card-sub">True device pixels</div>
          </div>

          <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
            <div className="stat-card-label caption-mono">Device Pixel Ratio</div>
            <div className="stat-card-val code" style={{ color: dpr >= 2 ? '#00c97a' : 'var(--warning)' }}>
              {dpr}×<span className="stat-card-unit">{dpr >= 2 ? 'Retina' : 'Standard'}</span>
            </div>
            <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${Math.min(100, (dpr / 4) * 100)}%` }} /></div>
          </div>

          <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
            <div className="stat-card-label caption-mono">Aspect Ratio</div>
            <div className="stat-card-val">{aspectLabel}</div>
            <div className="stat-card-sub">Display format</div>
          </div>

          <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)' }}>
            <div className="stat-card-label caption-mono">Color Depth</div>
            <div className="stat-card-val code" style={{ color: colorDep >= 24 ? '#00c97a' : 'var(--warning)' }}>
              {colorDep}<span className="stat-card-unit">bit</span>
            </div>
            <div className="stat-card-sub">{colorDep >= 30 ? '10-bit HDR' : '8-bit SDR'}</div>
          </div>

          {/* Device comparison */}
          <div className="stat-card shadow-2" style={{ border: '1px solid var(--hairline)', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>
              <div className="caption-mono" style={{ fontSize: '0.72rem', color: 'var(--mute)' }}>Device Comparison</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead>
                  <tr style={{ background: 'var(--canvas-soft-2)' }}>
                    {['Device', 'Resolution', 'DPR', 'PPI'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--mute)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '0.65rem', borderBottom: '1px solid var(--hairline)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEVICES.map((d, i) => (
                    <tr key={d.name} style={{ borderBottom: '1px solid var(--hairline)', background: i % 2 === 0 ? 'transparent' : 'var(--canvas-soft-2)' }}>
                      <td style={{ padding: '0.45rem 0.75rem', color: 'var(--body)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_COLOR[d.type], flexShrink: 0 }} />
                          {d.name}
                        </span>
                      </td>
                      <td style={{ padding: '0.45rem 0.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--mute)', fontSize: '0.68rem' }}>{d.res}</td>
                      <td style={{ padding: '0.45rem 0.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--mute)', fontSize: '0.68rem' }}>{d.dpr}</td>
                      <td style={{ padding: '0.45rem 0.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--mute)', fontSize: '0.68rem' }}>{d.ppi}</td>
                    </tr>
                  ))}
                  {/* User row */}
                  <tr style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', borderTop: '2px solid var(--primary)' }}>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                        Your Device
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--primary)', fontWeight: 700, fontSize: '0.68rem' }}>{physW}×{physH}</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--primary)', fontWeight: 700, fontSize: '0.68rem' }}>{dpr}×</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--mute)', fontSize: '0.68rem' }}>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
