import React, { useState, useEffect, useRef } from 'react';

export default function InversionArtifacts() {
  const [freq, setFreq] = useState(2);
  const [scanSpeed, setScanSpeed] = useState(60);
  const [animated, setAnimated] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      if(animated) scanRef.current=(scanRef.current+scanSpeed*dt)%W;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      const sq=freq;
      for(let y=0;y<H;y+=sq) for(let x=0;x<W;x+=sq){
        const inv=x<scanRef.current;
        const base=(Math.floor(x/sq)+Math.floor(y/sq))%2===0;
        ctx.fillStyle=(inv?!base:base)?'#e8e8e8':'#111';
        ctx.fillRect(x,y,sq,sq);
      }
      // Scan line
      ctx.strokeStyle='#ff4444'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(scanRef.current,0); ctx.lineTo(scanRef.current,H); ctx.stroke();
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [freq, scanSpeed, animated]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Pattern: <span style={{color:'#e8e8e8'}}>{freq}px checker</span></span>
          <span style={{color:'#555'}}>Scan speed: <span style={{color:'#e8e8e8'}}>{scanSpeed}px/s</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>CHECKER SIZE</label>
          <select value={freq} onChange={e=>setFreq(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[1,2,4,8,16].map(n=><option key={n} value={n}>{n}px</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SCAN SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{scanSpeed}px/s</span></div>
          <input type="range" min={10} max={480} value={scanSpeed} onChange={e=>setScanSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <button onClick={()=>setAnimated(a=>!a)} style={{background:'transparent',border:`1px solid ${animated?'#e8e8e8':'#2a2a2a'}`,color:animated?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{animated?'Pause':'Animate'}</button>
      </div>
    </div>
  );
}
