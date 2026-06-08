import React, { useState, useEffect, useRef } from 'react';

export default function MovingPhoto() {
  const [speed, setSpeed] = useState(480);
  const [density, setDensity] = useState<'low'|'medium'|'high'>('medium');
  const [dir, setDir] = useState<'left'|'right'>('left');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLCanvasElement | null>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth||800;
      canvas.height = canvas.parentElement?.offsetHeight||400;
      generateScene();
    };
    const generateScene = () => {
      const W = canvas.width, H = canvas.height;
      const sc = document.createElement('canvas'); sc.width = W*2; sc.height = H;
      const ctx = sc.getContext('2d'); if (!ctx) return;
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,W*2,H);
      const count = density==='low'?20:density==='medium'?60:120;
      for (let i=0;i<count;i++) {
        const x=Math.random()*W*2, y=Math.random()*H;
        const type=Math.floor(Math.random()*3);
        ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=1;
        if (type===0) { ctx.strokeRect(x,y,40+Math.random()*80,20+Math.random()*60); }
        else if (type===1) { ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.random()*120,y+Math.random()*120);ctx.stroke(); }
        else { ctx.font=`${8+Math.random()*16}px "IBM Plex Mono",monospace`; ctx.fillStyle='#e8e8e8'; ctx.fillText('SCREENHZ',x,y); }
      }
      sceneRef.current = sc;
    };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, [density]);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W=canvas.width, H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      if (dir==='left') posRef.current = (posRef.current+speed*dt)%(W);
      else posRef.current = (posRef.current-speed*dt+W)%W;
      ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      if (sceneRef.current) {
        ctx.drawImage(sceneRef.current, -posRef.current, 0);
        ctx.drawImage(sceneRef.current, W-posRef.current, 0);
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [speed, dir]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Density: <span style={{color:'#e8e8e8'}}>{density}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={2000} step={10} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        {(['low','medium','high'] as const).map(d=><button key={d} onClick={()=>setDensity(d)} style={{background:'transparent',border:`1px solid ${density===d?'#e8e8e8':'#2a2a2a'}`,color:density===d?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{d}</button>)}
        {(['left','right'] as const).map(d=><button key={d} onClick={()=>setDir(d)} style={{background:'transparent',border:`1px solid ${dir===d?'#e8e8e8':'#2a2a2a'}`,color:dir===d?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{d}</button>)}
      </div>
    </div>
  );
}
