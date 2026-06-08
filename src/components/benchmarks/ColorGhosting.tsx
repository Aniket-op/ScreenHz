import React, { useState, useEffect, useRef } from 'react';

export default function ColorGhosting() {
  const [speed, setSpeed] = useState(960);
  const [objSize, setObjSize] = useState(40);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef([0,80,160,240]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime = performance.now(); let animId: number;
    const colors = ['#ff3333','#33ff33','#3333ff','#ffffff'];
    const labels = ['Red','Green','Blue','White'];
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const dt = (now-lastTime)/1000; lastTime=now;
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0,0,W,H);
      const rowH = H / 4;
      colors.forEach((c, i) => {
        posRef.current[i] = (posRef.current[i] + speed * dt) % (W + objSize);
        const y = i * rowH;
        ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, y, W, rowH);
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y+rowH-1); ctx.lineTo(W, y+rowH-1); ctx.stroke();
        ctx.fillStyle = c; ctx.fillRect(posRef.current[i] - objSize, y + rowH/2 - objSize/2, objSize, objSize);
        ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace';
        ctx.fillText(labels[i], 8, y + 16);
      });
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, objSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Trailing color fringe = panel ghosting</span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={3840} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:120}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>OBJECT SIZE</label><span style={{color:'#e8e8e8',fontSize:11}}>{objSize}px</span></div>
          <input type="range" min={10} max={120} value={objSize} onChange={e=>setObjSize(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
