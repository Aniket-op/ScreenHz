import React, { useState, useEffect, useRef } from 'react';

export default function MPRTTest() {
  const [speed, setSpeed] = useState(960);
  const [showRef, setShowRef] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

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
      const W = canvas.width, H = canvas.height, halfW = W/2;
      const dt = (now-lastTime)/1000; lastTime = now;
      posRef.current = (posRef.current + speed * dt) % (halfW + 40);
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(halfW,0); ctx.lineTo(halfW,H); ctx.stroke();
      // Left: blurred edge (MPRT sim — use alpha)
      ctx.fillStyle = '#111'; ctx.fillRect(0,0,halfW,H);
      const blurPx = Math.round(speed / 60);
      for (let b = blurPx; b >= 0; b--) {
        ctx.fillStyle = `rgba(232,232,232,${(1 - b/blurPx) * 0.9})`;
        ctx.fillRect((posRef.current % halfW) - b, H/2-30, 8, 60);
      }
      // Right: sharp static reference
      if (showRef) {
        ctx.fillStyle = '#e8e8e8'; ctx.fillRect(halfW + halfW/2 - 4, H/2-30, 8, 60);
      }
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText('MPRT (blurred)', 8, 16);
      if(showRef) ctx.fillText('Reference (sharp)', halfW+8, 16);
      const mprt = (1/60*1000 + blurPx/60*1000/10).toFixed(1);
      ctx.fillText(`Blur width: ~${blurPx}px  Est. MPRT: ${mprt}ms`, 8, H-8);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, showRef]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Blur: <span style={{color:'#e8e8e8'}}>{Math.round(speed/60)}px</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={3840} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <button onClick={()=>setShowRef(s=>!s)} style={{background:'transparent',border:`1px solid ${showRef?'#e8e8e8':'#2a2a2a'}`,color:showRef?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{showRef?'Hide Reference':'Show Reference'}</button>
      </div>
    </div>
  );
}
