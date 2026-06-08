import React, { useState, useEffect, useRef } from 'react';

export default function VRRSimulation() {
  const [mode, setMode] = useState<'sweep'|'fixed'|'stress'>('sweep');
  const [fixedFps, setFixedFps] = useState(60);
  const [speed, setSpeed] = useState(480);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);
  const deltasRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const [currentFps, setCurrentFps] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let animId: number; let sweepT = 0;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const dt = now - lastTimeRef.current; lastTimeRef.current = now;
      sweepT += dt / 1000;
      deltasRef.current.push(dt);
      if (deltasRef.current.length > 60) deltasRef.current.shift();
      posRef.current = (posRef.current + speed * dt / 1000) % (W + 60);
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H);
      // Object
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(posRef.current - 30, H/2 - 20, 60, 40);
      // Sparkline at bottom
      const sparkH = 48, sparkY = H - sparkH - 52;
      ctx.fillStyle = '#111'; ctx.fillRect(0, sparkY, W, sparkH);
      const mean = deltasRef.current.reduce((a,b)=>a+b,0) / (deltasRef.current.length||1);
      const barW = W / 60;
      deltasRef.current.forEach((d,i) => {
        const bh = Math.min(sparkH - 2, (d / 33.3) * (sparkH - 2));
        ctx.fillStyle = '#555'; ctx.fillRect(i*barW, sparkY + sparkH - bh, barW-1, bh);
      });
      // FPS label
      const fps = mean > 0 ? Math.round(1000/mean) : 0;
      ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace';
      ctx.fillText('FPS: ' + fps, 8, 20);
      ctx.fillText('VRR Range: 48–165', 8, 34);
      if (now % 200 < 20) setCurrentFps(fps);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [mode, fixedFps, speed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Current FPS: <span style={{color:'#00ff88'}}>{currentFps}</span></span>
          <span style={{color:'#555'}}>VRR Range: <span style={{color:'#e8e8e8'}}>48–165</span></span>
          <span style={{color:'#555'}}>Mode: <span style={{color:'#e8e8e8'}}>{mode}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        {(['sweep','fixed','stress'] as const).map(m=>(
          <button key={m} onClick={()=>setMode(m)} style={{background:'transparent',border:`1px solid ${mode===m?'#e8e8e8':'#2a2a2a'}`,color:mode===m?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{m}</button>
        ))}
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={1920} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
