import React, { useState, useEffect, useRef } from 'react';

export default function MovingLine() {
  const [speed, setSpeed] = useState(480);
  const [thickness, setThickness] = useState(1);
  const [dir, setDir] = useState<'h'|'v'>('h');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth||800; canvas.height = canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime = performance.now(); let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const dt = (now-lastTime)/1000; lastTime=now;
      const limit = dir==='h' ? W : H;
      posRef.current = (posRef.current + speed*dt) % (limit+thickness);
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      if (dir==='h') ctx.fillRect(posRef.current-thickness, 0, thickness, H);
      else ctx.fillRect(0, posRef.current-thickness, W, thickness);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, thickness, dir]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Multiple dashes = PWM flicker detected</span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={50} max={2000} step={10} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>THICKNESS</label>
          <input type="number" min={1} max={4} value={thickness} onChange={e=>setThickness(+e.target.value)} style={{width:48,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        {(['h','v'] as const).map(d=><button key={d} onClick={()=>setDir(d)} style={{background:'transparent',border:`1px solid ${dir===d?'#e8e8e8':'#2a2a2a'}`,color:dir===d?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{d==='h'?'Horizontal':'Vertical'}</button>)}
      </div>
    </div>
  );
}
