import React, { useState, useEffect, useRef } from 'react';

export default function PhantomArray() {
  const [trailCount, setTrailCount] = useState(6);
  const [fadeTime, setFadeTime] = useState(80);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailsRef = useRef<{x:number;y:number;t:number}[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const cy = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
      trailsRef.current.push({ x: (cx - rect.left) * (canvas.width / rect.width), y: (cy - rect.top) * (canvas.height / rect.height), t: performance.now() });
      if (trailsRef.current.length > 200) trailsRef.current.shift();
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove as any, { passive: true });
    return () => { canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('touchmove', onMove as any); };
  }, []);

  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H);
      // Filter recent trails
      const cutoff = now - fadeTime * trailCount;
      const recent = trailsRef.current.filter(t => t.t > cutoff);
      for (let i = 0; i < recent.length; i++) {
        const age = now - recent[i].t;
        const alpha = Math.max(0, 1 - age / (fadeTime * trailCount));
        ctx.fillStyle = `rgba(232,232,232,${alpha.toFixed(2)})`;
        ctx.fillRect(recent[i].x - 8, recent[i].y - 8, 16, 16);
      }
      // Crosshair
      if (recent.length > 0) {
        const last = recent[recent.length - 1];
        ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(last.x - 12, last.y); ctx.lineTo(last.x + 12, last.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(last.x, last.y - 12); ctx.lineTo(last.x, last.y + 12); ctx.stroke();
      }
      ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Move your mouse to test', W/2, H - 24);
      ctx.textAlign = 'left';
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [trailCount, fadeTime]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Trail length: <span style={{color:'#e8e8e8'}}>{trailCount}</span></span>
          <span style={{color:'#555'}}>Fade time: <span style={{color:'#e8e8e8'}}>{fadeTime}ms</span></span>
          <span style={{color:'#555'}}>Move your mouse to test</span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>TRAIL COUNT</label><span style={{color:'#e8e8e8',fontSize:11}}>{trailCount}</span></div>
          <input type="range" min={2} max={12} value={trailCount} onChange={e=>setTrailCount(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>FADE TIME (ms)</label><span style={{color:'#e8e8e8',fontSize:11}}>{fadeTime}ms</span></div>
          <input type="range" min={20} max={300} step={10} value={fadeTime} onChange={e=>setFadeTime(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
