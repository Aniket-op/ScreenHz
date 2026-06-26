import React, { useEffect, useRef, useState } from 'react';

interface Stats {
  hz: number;
  fps: number;
  frameTime: number;
  status: 'measuring' | 'detected';
}

/** Read current theme and subscribe to changes */
function useTheme() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const read = () =>
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export default function SpeedometerHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameTimesRef = useRef<number[]>([]);
  const lastRef = useRef(0);
  const rafRef = useRef(0);
  const animHzRef = useRef(0);
  const [stats, setStats] = useState<Stats>({ hz: 0, fps: 0, frameTime: 0, status: 'measuring' });
  const [resolution, setResolution] = useState('');
  const isDark = useTheme();

  useEffect(() => {
    setResolution(`${window.screen.width} × ${window.screen.height}`);
  }, []);

  useEffect(() => {
    let detectedHz = 0;

    const STANDARDS = [60, 75, 90, 100, 120, 144, 165, 180, 240, 300, 360, 480];

    const draw = (now: number) => {
      // ─── Measure Hz ───
      if (lastRef.current > 0) {
        const delta = now - lastRef.current;
        if (delta > 1 && delta < 200) {
          frameTimesRef.current.push(delta);
          if (frameTimesRef.current.length > 120) frameTimesRef.current.shift();

          if (frameTimesRef.current.length >= 30) {
            const avg = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
            const measured = 1000 / avg;
            const snapped = STANDARDS.reduce((a, b) => Math.abs(b - measured) < Math.abs(a - measured) ? b : a);
            detectedHz = snapped;

            setStats({
              hz: snapped,
              fps: Math.round(measured * 10) / 10,
              frameTime: Math.round((avg) * 100) / 100,
              status: frameTimesRef.current.length >= 60 ? 'detected' : 'measuring',
            });
          }
        }
      }
      lastRef.current = now;

      // ─── Draw Speedometer ───
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return; }

      const dark = document.documentElement.getAttribute('data-theme') !== 'light';
      const trackColor     = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      const tickMajor      = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)';
      const tickMinor      = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)';
      const labelColor     = dark ? 'rgba(255,255,255,0.4)'  : 'rgba(0,0,0,0.5)';
      const hubInner       = dark ? '#333' : '#e0e0e0';
      const hubOuter       = dark ? '#111' : '#c8c8c8';
      const hubStroke      = dark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.15)';

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H * 0.68;
      const R = Math.min(W * 0.42, H * 0.72);
      const START_ANGLE = Math.PI * 1.1;   // 198°
      const END_ANGLE   = Math.PI * 1.9;   // 342°  → total arc = 0.8π
      const ARC_SPAN    = END_ANGLE - START_ANGLE;
      const MAX_HZ      = 500;

      // Smooth animation
      animHzRef.current += (detectedHz - animHzRef.current) * 0.05;
      const animHz = animHzRef.current;

      // ── Background arc (track) ──
      ctx.beginPath();
      ctx.arc(cx, cy, R, START_ANGLE, END_ANGLE);
      ctx.lineWidth = 14;
      ctx.strokeStyle = trackColor;
      ctx.lineCap = 'round';
      ctx.stroke();

      // ── Gradient progress arc ──
      if (animHz > 0) {
        const progress = Math.min(1, animHz / MAX_HZ);
        const progressEnd = START_ANGLE + ARC_SPAN * progress;

        // Outer glow
        ctx.beginPath();
        ctx.arc(cx, cy, R, START_ANGLE, progressEnd);
        ctx.lineWidth = 28;
        ctx.strokeStyle = 'rgba(0,229,255,0.06)';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Main gradient arc
        const grad = ctx.createLinearGradient(
          cx + R * Math.cos(START_ANGLE), cy + R * Math.sin(START_ANGLE),
          cx + R * Math.cos(progressEnd), cy + R * Math.sin(progressEnd)
        );
        grad.addColorStop(0, '#7928ca');
        grad.addColorStop(0.5, '#00e5ff');
        grad.addColorStop(1, '#00ff87');
        ctx.beginPath();
        ctx.arc(cx, cy, R, START_ANGLE, progressEnd);
        ctx.lineWidth = 14;
        ctx.strokeStyle = grad;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // ── Tick marks ──
      const TICKS = [60, 120, 144, 240, 360, 480];
      TICKS.forEach(std => {
        const angle = START_ANGLE + ARC_SPAN * (std / MAX_HZ);
        const isMajor = [60, 120, 144, 240, 360].includes(std);
        const tickLen = isMajor ? 14 : 8;
        const t1x = cx + (R - tickLen) * Math.cos(angle);
        const t1y = cy + (R - tickLen) * Math.sin(angle);
        const t2x = cx + (R + 4) * Math.cos(angle);
        const t2y = cy + (R + 4) * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(t1x, t1y);
        ctx.lineTo(t2x, t2y);
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.strokeStyle = isMajor ? tickMajor : tickMinor;
        ctx.lineCap = 'round';
        ctx.stroke();

        if (isMajor) {
          const lx = cx + (R + 20) * Math.cos(angle);
          const ly = cy + (R + 20) * Math.sin(angle);
          ctx.fillStyle = labelColor;
          ctx.font = `500 10px 'JetBrains Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${std}`, lx, ly);
        }
      });

      // ── Needle ──
      if (animHz > 1) {
        const needleAngle = START_ANGLE + ARC_SPAN * Math.min(1, animHz / MAX_HZ);
        const nx = cx + (R - 18) * Math.cos(needleAngle);
        const ny = cy + (R - 18) * Math.sin(needleAngle);

        // Shadow glow
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#00e5ff';
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Needle tip dot
        ctx.beginPath();
        ctx.arc(nx, ny, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Center hub ──
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
      hubGrad.addColorStop(0, hubInner);
      hubGrad.addColorStop(1, hubOuter);
      ctx.fillStyle = hubGrad;
      ctx.fill();
      ctx.strokeStyle = hubStroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Handle DPI-aware canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Reactive colors based on theme
  const ink        = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.80)';
  const muted      = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)';
  const hzColor    = isDark ? '#00e5ff' : '#0070f3';
  const hzInactive = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)';
  const hzShadow   = isDark ? '0 0 24px rgba(0,229,255,0.5)' : '0 0 20px rgba(0,112,243,0.25)';
  const hertzLabel = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
      {/* Canvas */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', aspectRatio: '4/3', display: 'block' }}
          aria-label={`Speedometer showing ${stats.hz || 0} Hz refresh rate`}
        />
        {/* Center overlay: Hz value */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '62%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: stats.hz > 0 ? 'clamp(2.5rem, 8vw, 4rem)' : '3rem',
            lineHeight: 1,
            letterSpacing: '-0.05em',
            color: stats.hz > 0 ? hzColor : hzInactive,
            textShadow: stats.hz > 0 ? hzShadow : 'none',
            transition: 'color 0.4s, text-shadow 0.4s',
          }}>
            {stats.hz > 0 ? stats.hz : '—'}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500, fontSize: '0.7rem',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: hertzLabel, marginTop: '0.15rem',
          }}>
            Hertz
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Exact FPS', value: stats.fps > 0 ? `${stats.fps.toFixed(1)}` : '—' },
          { label: 'Frame Time', value: stats.frameTime > 0 ? `${stats.frameTime}ms` : '—' },
          { label: 'Resolution', value: resolution || '—' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              fontSize: '1rem', color: ink,
            }}>
              {item.value}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: muted, marginTop: '0.2rem',
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Status badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.35rem 1rem', borderRadius: '100px',
        border: `1px solid ${stats.status === 'detected' ? 'rgba(0,255,135,0.3)' : 'rgba(245,166,35,0.3)'}`,
        background: stats.status === 'detected' ? 'rgba(0,255,135,0.07)' : 'rgba(245,166,35,0.07)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
        fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: stats.status === 'detected' ? '#00ff87' : '#f5a623',
      }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'currentColor',
          animation: 'blink 1.5s step-start infinite',
        }} />
        {stats.status === 'detected' ? '● Detected' : '● Measuring…'}
      </div>
    </div>
  );
}
