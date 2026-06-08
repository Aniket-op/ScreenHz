import React, { useState, useEffect, useRef } from 'react';
import { useHz } from '../../lib/hz-detector';

export default function VideoGameMotion() {
  const { hz } = useHz();
  const [speed, setSpeed] = useState(960);
  const [running, setRunning] = useState(true);
  const [blurOverlay, setBlurOverlay] = useState(false);
  
  const [lane1Fps, setLane1Fps] = useState(30);
  const [lane2Fps, setLane2Fps] = useState(60);
  const [lane3Fps, setLane3Fps] = useState(120);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef([0, 0, 0]);
  const lastFrameRef = useRef([performance.now(), performance.now(), performance.now()]);
  
  useEffect(() => {
    // If we detect a 144Hz or higher monitor, default lane 3 to that.
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
          posRef.current[i] = (posRef.current[i] + (speed / (targetFps || 60))) % (W + 100);
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

        // draw object (checkerboard rect)
        const x = posRef.current[i] - 50;
        const cy = y + rowH / 2;
        const rectH = 40;
        const rectW = 60;
        const rectY = cy - rectH / 2;
        
        ctx.fillStyle = '#222222';
        ctx.fillRect(x, rectY, rectW, rectH);
        
        ctx.fillStyle = '#e8e8e8';
        const squareSize = 10;
        for (let r = 0; r < rectH / squareSize; r++) {
          for (let c = 0; c < rectW / squareSize; c++) {
            if ((r + c) % 2 === 0) {
              ctx.fillRect(x + c * squareSize, rectY + r * squareSize, squareSize, squareSize);
            }
          }
        }

        if (blurOverlay) {
            // Simulated blur visualization overlay
            ctx.fillStyle = 'rgba(232, 232, 232, 0.1)';
            const blurWidth = speed / targetFps;
            ctx.fillRect(x - blurWidth, rectY, blurWidth, rectH);
        }
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, speed, lane1Fps, lane2Fps, lane3Fps, blurOverlay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || 800;
      canvas.height = Math.max(window.innerHeight * 0.6, 400); // Take 60vh
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
        
        {/* Stat Row embedded at bottom of canvas area */}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>SPEED</label>
            <span style={{ color: '#e8e8e8', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>{speed} px/s</span>
          </div>
          <input type="range" min="120" max="3840" step="120" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <button 
          onClick={() => setBlurOverlay(!blurOverlay)}
          style={{ 
            background: 'transparent', 
            border: `1px solid ${blurOverlay ? '#e8e8e8' : '#2a2a2a'}`, 
            color: blurOverlay ? '#e8e8e8' : '#555555',
            padding: '6px 14px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
          {blurOverlay ? 'Hide Blur Overlay' : 'Show Blur Overlay'}
        </button>

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
