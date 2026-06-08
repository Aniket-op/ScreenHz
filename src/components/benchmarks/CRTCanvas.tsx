import React, { useState, useEffect, useRef } from 'react';

export default function CRTCanvas() {
  const [persistence, setPersistence] = useState<'fast'|'medium'|'slow'>('medium');
  const [scanGap, setScanGap] = useState(2);
  const [resolution, setResolution] = useState(480);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const decayMap={fast:0.05,medium:0.02,slow:0.008};
    const decay=decayMap[persistence];
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      // Fade existing
      ctx.fillStyle=`rgba(0,0,0,${decay*60})`; ctx.fillRect(0,0,W,H);
      const linesPerFrame=Math.ceil(resolution*60*dt);
      for(let i=0;i<linesPerFrame;i++){
        const y=Math.floor(scanRef.current)*(H/resolution);
        const brightness=128+Math.random()*127;
        ctx.fillStyle=`rgba(${brightness},${brightness*0.9},${brightness*0.7},0.9)`;
        ctx.fillRect(0,y,W,H/resolution-scanGap);
        scanRef.current=(scanRef.current+1)%resolution;
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [persistence, scanGap, resolution]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Scanlines: <span style={{color:'#e8e8e8'}}>{resolution}</span></span>
          <span style={{color:'#555'}}>Persistence: <span style={{color:'#e8e8e8'}}>{persistence}</span></span>
          <span style={{color:'#555'}}>Gap: <span style={{color:'#e8e8e8'}}>{scanGap}px</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        {(['fast','medium','slow'] as const).map(p=><button key={p} onClick={()=>setPersistence(p)} style={{background:'transparent',border:`1px solid ${persistence===p?'#e8e8e8':'#2a2a2a'}`,color:persistence===p?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{p}</button>)}
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>RESOLUTION</label>
          <select value={resolution} onChange={e=>setResolution(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[240,480,1080].map(n=><option key={n} value={n}>{n}p</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SCAN GAP</label>
          <input type="number" min={0} max={8} value={scanGap} onChange={e=>setScanGap(+e.target.value)} style={{width:48,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
      </div>
    </div>
  );
}
