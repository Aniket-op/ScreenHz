import React, { useState, useEffect, useRef } from 'react';
import { useHz } from '../../lib/hz-detector';

export default function MarqueeTest() {
  const { hz } = useHz();
  const [speed, setSpeed] = useState(480);
  const [running, setRunning] = useState(true);
  
  const [lane1Fps, setLane1Fps] = useState(30);
  const [lane2Fps, setLane2Fps] = useState(60);
  const [lane3Fps, setLane3Fps] = useState(120);
  
  const [fontSize, setFontSize] = useState(24);
  const [customText, setCustomText] = useState("THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  
  const posRef = useRef([0, 0, 0]);
  const lastFrameRef = useRef([performance.now(), performance.now(), performance.now()]);
  
  useEffect(() => {
    if (hz > 120 && lane3Fps === 120) {
      setLane3Fps(hz);
    }
  }, [hz]);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const fpsTargets = [lane1Fps, lane2Fps, lane3Fps];

    const loop = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const rowH = H / 3;

      ctx.clearRect(0, 0, W, H);

      fpsTargets.forEach((targetFps, i) => {
        const interval = 1000 / (targetFps || 60);
        
        if (now - lastFrameRef.current[i] >= interval) {
          // Negative speed because marquee usually scrolls right to left
          posRef.current[i] = posRef.current[i] - (speed / (targetFps || 60));
          lastFrameRef.current[i] = now;
        }
        
        const y = rowH * i;
        ctx.fillStyle = '#0c0c0c';
        ctx.fillRect(0, y, W, rowH);
        
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + rowH - 1);
        ctx.lineTo(W, y + rowH - 1);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `${fontSize}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const textWidth = ctx.measureText(customText).width;
        // Wrap text
        if (posRef.current[i] < -textWidth - 50) {
            posRef.current[i] = W;
        }

        ctx.fillText(customText, posRef.current[i], y + rowH / 2);
        
        // Draw a second copy for seamless looping if it fits
        if (posRef.current[i] + textWidth < W) {
             ctx.fillText(customText, posRef.current[i] + textWidth + 50, y + rowH / 2);
        }
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, speed, lane1Fps, lane2Fps, lane3Fps, fontSize, customText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || 800;
      canvas.height = Math.max(window.innerHeight * 0.6, 300); // 60vh
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const fpsOptions = [24, 30, 48, 60, 90, 120, 144, 165, 240, 360];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', display: 'block', background: '#0c0c0c' }} />
        
        {/* Stat Row */}
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            background: 'rgba(17, 17, 17, 0.8)',
            borderTop: '1px solid #222',
            color: '#dim',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '13px'
        }}>
            <span style={{ color: '#e8e8e8' }}>Lane 1: {lane1Fps}fps</span>
            <span style={{ color: '#e8e8e8' }}>Lane 2: {lane2Fps}fps</span>
            <span style={{ color: '#e8e8e8' }}>Lane 3: {lane3Fps}fps</span>
        </div>
      </div>

      <div style={{ padding: '16px', background: '#111111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>LANE 1 FPS</label>
          <select value={lane1Fps} onChange={(e) => setLane1Fps(Number(e.target.value))} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#e8e8e8', padding: '4px 8px', fontFamily: '"IBM Plex Mono", monospace' }}>
            {fpsOptions.map(f => <option key={f} value={f}>{f} fps</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>LANE 2 FPS</label>
          <select value={lane2Fps} onChange={(e) => setLane2Fps(Number(e.target.value))} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#e8e8e8', padding: '4px 8px', fontFamily: '"IBM Plex Mono", monospace' }}>
            {fpsOptions.map(f => <option key={f} value={f}>{f} fps</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>LANE 3 FPS</label>
          <select value={lane3Fps} onChange={(e) => setLane3Fps(Number(e.target.value))} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#e8e8e8', padding: '4px 8px', fontFamily: '"IBM Plex Mono", monospace' }}>
            {fpsOptions.map(f => <option key={f} value={f}>{f} fps</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>FONT SIZE</label>
          <input type="number" min="10" max="120" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ width: '60px', background: 'transparent', border: '1px solid #2a2a2a', color: '#e8e8e8', padding: '4px 8px', fontFamily: '"IBM Plex Mono", monospace' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, minWidth: '150px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>SPEED</label>
            <span style={{ color: '#e8e8e8', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>{speed} px/s</span>
          </div>
          <input type="range" min="50" max="2000" step="10" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 2, minWidth: '200px' }}>
          <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>CUSTOM TEXT</label>
          <input type="text" value={customText} onChange={(e) => setCustomText(e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px solid #2a2a2a', color: '#e8e8e8', padding: '4px 8px', fontFamily: '"IBM Plex Mono", monospace' }} />
        </div>

        <button 
          onClick={() => setRunning(!running)}
          style={{ 
            background: 'transparent', 
            border: '1px solid #2a2a2a', 
            color: '#555555',
            padding: '6px 14px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
          {running ? 'Pause' : 'Run'}
        </button>
      </div>
    </div>
  );
}
