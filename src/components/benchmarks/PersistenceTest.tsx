import React, { useState, useEffect, useRef } from 'react';

export default function PersistenceTest() {
  const [speed, setSpeed] = useState(720);
  const [spokeCount, setSpokeCount] = useState(12);
  const [direction, setDirection] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime = performance.now(); let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const dt = (now - lastTime) / 1000; lastTime = now;
      angleRef.current += direction * speed * dt * Math.PI / 180;
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H);
      const cx = W/2, cy = H/2, r = Math.min(W, H) * 0.4;
      ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1;
      for (let i = 0; i < spokeCount; i++) {
        const a = angleRef.current + (i / spokeCount) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      }
      // Hub
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, spokeCount, direction]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}°/s</span></span>
          <span style={{color:'#555'}}>Spokes: <span style={{color:'#e8e8e8'}}>{spokeCount}</span></span>
          <span style={{color:'#555'}}>Direction: <span style={{color:'#e8e8e8'}}>{direction > 0 ? 'CW' : 'CCW'}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED (°/s)</label>
            <span style={{color:'#e8e8e8',fontSize:11}}>{speed}</span>
          </div>
          <input type="range" min={0} max={3600} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPOKES</label>
          <input type="number" min={4} max={24} value={spokeCount} onChange={e=>setSpokeCount(+e.target.value)} style={{width:60,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        <button onClick={()=>setDirection(d=>-d)} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>
          Flip Direction
        </button>
      </div>
    </div>
  );
}
