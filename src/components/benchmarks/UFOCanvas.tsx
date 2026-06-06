import React, { useState, useEffect, useRef } from 'react';
import { useHz } from '../../lib/hz-detector';

export default function UFOCanvas() {
  const { hz } = useHz();
  const [speed, setSpeed] = useState(960);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(true);
  const rafRef = useRef<number>(0);
  const posRef = useRef([0, 0, 0]);
  const lastFrameRef = useRef([performance.now(), performance.now(), performance.now()]);
  const frameCountRef = useRef([0, 0, 0]);
  const fpsTimerRef = useRef(performance.now());
  
  // Define lanes: max_fps, max_fps/2, max_fps/4
  const targetHz = hz > 0 ? hz : 120; // fallback to 120 if measuring
  const lanes = [targetHz, Math.floor(targetHz / 2), Math.floor(targetHz / 4)];

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const loop = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const rowH = H / 3;

      ctx.clearRect(0, 0, W, H);

      lanes.forEach((targetFps, i) => {
        const interval = 1000 / (targetFps || 60);
        if (now - lastFrameRef.current[i] >= interval) {
          posRef.current[i] = (posRef.current[i] + (speed / (targetFps || 60))) % (W + 60);
          lastFrameRef.current[i] = now;
          frameCountRef.current[i]++;
        }
        
        const y = rowH * i;
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, y, W, rowH);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + rowH - 1);
        ctx.lineTo(W, y + rowH - 1);
        ctx.stroke();

        // fps label
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillText(`${targetFps} fps`, 16, y + rowH / 2 + 5);

        // draw UFO
        const x = posRef.current[i] - 30;
        const cy = y + rowH / 2;
        const gradient = ctx.createRadialGradient(x, cy, 0, x, cy, 30);
        gradient.addColorStop(0, 'rgba(0,229,255,0.9)');
        gradient.addColorStop(0.4, 'rgba(0,229,255,0.4)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, cy, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '24px serif';
        ctx.fillText('🛸', x - 15, cy + 8);
      });

      if (now - fpsTimerRef.current > 1000) {
        frameCountRef.current = [0, 0, 0];
        fpsTimerRef.current = now;
      }
      
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, speed, lanes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || 800;
      canvas.height = 450;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div>
      <div className="canvas-area shadow-3" style={{ border: '1px solid var(--hairline)' }}>
        <div className="canvas-toolbar" style={{ background: 'var(--canvas-soft-2)' }}>
          <span className="ctrl-label caption-mono">Speed</span>
          <input type="range" min="120" max="3840" step="120" value={speed} onChange={e => setSpeed(+e.target.value)} style={{ width: '120px' }} />
          <span className="caption-mono" style={{ color: 'var(--body)', minWidth: '80px' }}>{speed} px/s</span>
          
          <button className={`ctrl-btn ${running ? 'active' : ''}`} onClick={() => setRunning(r => !r)} style={{ marginLeft: 'auto' }}>
            {running ? 'Pause' : 'Run'}
          </button>
        </div>
        <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
      </div>
      <div className="shadow-2" style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-lg)', background: 'var(--canvas)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)' }}>
        <p className="body-sm" style={{ color: 'var(--body)' }}>
          Compare motion clarity at different frame rates. At lower FPS, the UFO appears blurrier or stutters between frames — this is motion blur and low temporal resolution. Higher frame rates produce sharper, more fluid motion. Each lane runs independently at its own FPS target synchronized via <code className="code" style={{ color: 'var(--ink)', background: 'var(--canvas-soft-2)', padding: '0 4px', borderRadius: '4px', border: '1px solid var(--hairline)' }}>requestAnimationFrame</code>.
        </p>
      </div>
    </div>
  );
}
