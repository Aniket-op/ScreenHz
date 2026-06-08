import React, { useState, useEffect, useRef } from 'react';

export default function StutterTearing() {
  const [speed, setSpeed] = useState(960);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);
  const deltasRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const [stutterCount, setStutterCount] = useState(0);
  const [variance, setVariance] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let stutters = 0; let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const dt = now - lastTimeRef.current; lastTimeRef.current = now;
      deltasRef.current.push(dt);
      if (deltasRef.current.length > 60) deltasRef.current.shift();
      posRef.current = (posRef.current + speed * dt / 1000) % (W + 8);
      if (dt > 25) stutters++;

      const chartH = Math.min(80, H * 0.3);
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H - chartH);
      // Moving bar
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(posRef.current - 4, 0, 8, H - chartH);
      // Frame chart
      ctx.fillStyle = '#111'; ctx.fillRect(0, H - chartH, W, chartH);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, H - chartH); ctx.lineTo(W, H - chartH); ctx.stroke();
      const mean = deltasRef.current.reduce((a,b)=>a+b,0) / (deltasRef.current.length||1);
      const barW = W / 60;
      deltasRef.current.forEach((d, i) => {
        const isStutter = d > mean * 1.5;
        ctx.fillStyle = isStutter ? '#ff4444' : '#e8e8e8';
        const bh = Math.min(chartH - 4, (d / 33.3) * (chartH - 4));
        ctx.fillRect(i * barW, H - bh - 2, barW - 1, bh);
      });
      // Hairline at expected
      const expectedY = H - ((mean / 33.3) * (chartH - 4)) - 2;
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, expectedY); ctx.lineTo(W, expectedY); ctx.stroke();

      if (now % 500 < 20) {
        setStutterCount(s => s + stutters); stutters = 0;
        const v = deltasRef.current.length > 1 ? Math.sqrt(deltasRef.current.reduce((s,d)=>s+(d-mean)**2,0)/deltasRef.current.length) : 0;
        setVariance(+v.toFixed(2));
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Stutter events: <span style={{color: stutterCount>0?'#ff4444':'#00ff88'}}>{stutterCount}</span></span>
          <span style={{color:'#555'}}>Frame variance: <span style={{color:'#e8e8e8'}}>{variance}ms</span></span>
          <span style={{color:'#555'}}>Status: <span style={{color: stutterCount>0?'#ff4444':'#00ff88'}}>{stutterCount>0?'⚠ Stutter':'✓ Clean'}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={3840} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <button onClick={()=>setStutterCount(0)} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>Reset Counter</button>
      </div>
    </div>
  );
}
