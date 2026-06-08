import React, { useState, useEffect, useRef } from 'react';
import { useHz } from '../../lib/hz-detector';

export default function VerticalScrolling() {
  const { hz } = useHz();
  const [speed, setSpeed] = useState(480);
  const [running, setRunning] = useState(true);
  
  const [col1Fps, setCol1Fps] = useState(30);
  const [col2Fps, setCol2Fps] = useState(60);
  const [col3Fps, setCol3Fps] = useState(120);
  
  const [contentType, setContentType] = useState<'text' | 'lines' | 'numbers'>('text');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  
  // States to keep track
  const posRef = useRef([0, 0, 0]);
  const lastFrameRef = useRef([performance.now(), performance.now(), performance.now()]);
  const stutterTimersRef = useRef([0, 0, 0]);
  
  const [stutterCount, setStutterCount] = useState(0);

  useEffect(() => {
    if (hz > 120 && col3Fps === 120) {
      setCol3Fps(hz);
    }
  }, [hz]);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const fpsTargets = [col1Fps, col2Fps, col3Fps];

    const generateContent = (type: string, i: number, yOffset: number) => {
        if (type === 'lines') {
            return `------- LINE ${i} -------`;
        } else if (type === 'numbers') {
            return `${i * 1000} ${i * 1001} ${i * 1002}`;
        }
        return `Lorem ipsum dolor sit ${i}`;
    };

    const loop = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const colW = W / 3;

      ctx.clearRect(0, 0, W, H);

      let detectedStutterThisFrame = false;

      fpsTargets.forEach((targetFps, i) => {
        const interval = 1000 / (targetFps || 60);
        const delta = now - lastFrameRef.current[i];
        
        if (delta >= interval) {
          // Detect stutter: if delta is significantly larger than interval (e.g. 1.5x)
          if (delta > interval * 1.5 && lastFrameRef.current[i] !== 0) {
              stutterTimersRef.current[i] = now + 200; // highlight for 200ms
              detectedStutterThisFrame = true;
          }

          posRef.current[i] = (posRef.current[i] + (speed / (targetFps || 60))) % H;
          lastFrameRef.current[i] = now;
        }
        
        const x = colW * i;
        ctx.fillStyle = '#0c0c0c';
        ctx.fillRect(x, 0, colW, H);
        
        // Stutter highlight border
        if (now < stutterTimersRef.current[i]) {
            ctx.strokeStyle = '#ff4444'; // --warn red
            ctx.lineWidth = 4;
            ctx.strokeRect(x + 2, 2, colW - 4, H - 4);
        } else {
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, 0, colW, H);
        }

        ctx.fillStyle = '#e8e8e8';
        ctx.font = '14px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';

        // Draw scrolling content
        const lineSpacing = 30;
        const numLines = Math.ceil(H / lineSpacing) + 1;
        for (let j = 0; j < numLines; j++) {
            const drawY = ((posRef.current[i] + j * lineSpacing) % (H + lineSpacing)) - lineSpacing;
            ctx.fillText(generateContent(contentType, j, drawY), x + colW / 2, drawY);
        }
      });

      if (detectedStutterThisFrame) {
          setStutterCount(c => c + 1);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, speed, col1Fps, col2Fps, col3Fps, contentType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || 800;
      canvas.height = Math.max(window.innerHeight * 0.6, 400); // 60vh
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const fpsOptions = [24, 30, 48, 60, 90, 120, 144, 165, 240, 360];
  const smoothness = Math.max(0, 100 - stutterCount);

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
            <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Smoothness: {smoothness}/100</span>
            <span style={{ color: stutterCount > 0 ? '#ff4444' : '#e8e8e8' }}>Stutter events: {stutterCount}</span>
            <span style={{ color: '#00ff88' }}>Current FPS: {hz}</span>
        </div>
      </div>

      <div style={{ padding: '16px', background: '#111111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>COL 1 FPS</label>
          <select value={col1Fps} onChange={(e) => setCol1Fps(Number(e.target.value))} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#e8e8e8', padding: '4px 8px', fontFamily: '"IBM Plex Mono", monospace' }}>
            {fpsOptions.map(f => <option key={f} value={f}>{f} fps</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>COL 2 FPS</label>
          <select value={col2Fps} onChange={(e) => setCol2Fps(Number(e.target.value))} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#e8e8e8', padding: '4px 8px', fontFamily: '"IBM Plex Mono", monospace' }}>
            {fpsOptions.map(f => <option key={f} value={f}>{f} fps</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>COL 3 FPS</label>
          <select value={col3Fps} onChange={(e) => setCol3Fps(Number(e.target.value))} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#e8e8e8', padding: '4px 8px', fontFamily: '"IBM Plex Mono", monospace' }}>
            {fpsOptions.map(f => <option key={f} value={f}>{f} fps</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>CONTENT</label>
          <select value={contentType} onChange={(e) => setContentType(e.target.value as any)} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#e8e8e8', padding: '4px 8px', fontFamily: '"IBM Plex Mono", monospace' }}>
            <option value="text">Text</option>
            <option value="lines">Lines</option>
            <option value="numbers">Numbers</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, minWidth: '150px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label style={{ color: '#555555', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>SPEED</label>
            <span style={{ color: '#e8e8e8', fontSize: '11px', fontFamily: '"IBM Plex Mono", monospace' }}>{speed} px/s</span>
          </div>
          <input type="range" min="100" max="2000" step="10" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: '100%' }} />
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
