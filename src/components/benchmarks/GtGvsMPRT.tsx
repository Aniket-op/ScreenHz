import React, { useState, useEffect, useRef } from 'react';

export default function GtGvsMPRT() {
  const [gtgMs, setGtgMs] = useState(4);
  const [hz, setHz] = useState(165);
  const [speed, setSpeed] = useState(960);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height,halfW=W/2;
      const dt=(now-lastTime)/1000; lastTime=now;
      posRef.current=(posRef.current+speed*dt)%(halfW+40);
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#333'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(halfW,0); ctx.lineTo(halfW,H); ctx.stroke();
      // Left: MPRT blur (full frame persistence)
      const refreshMs=1000/hz;
      const mprt=refreshMs+gtgMs;
      const mprtBlurPx=speed*(mprt/1000);
      for(let b=Math.ceil(mprtBlurPx);b>=0;b--){
        ctx.fillStyle=`rgba(232,232,232,${(1-b/mprtBlurPx)*0.8})`;
        ctx.fillRect(posRef.current-20-b,H/2-20,40,40);
      }
      // Right: GtG only (sharper)
      const gtgBlurPx=speed*(gtgMs/1000);
      for(let b=Math.ceil(gtgBlurPx);b>=0;b--){
        ctx.fillStyle=`rgba(232,232,232,${(1-b/gtgBlurPx)*0.8})`;
        ctx.fillRect(halfW+posRef.current-20-b,H/2-20,40,40);
      }
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(`MPRT: ${mprt.toFixed(1)}ms (${Math.round(mprtBlurPx)}px blur)`,8,16);
      ctx.fillText(`GtG: ${gtgMs}ms (${Math.round(gtgBlurPx)}px blur)`,halfW+8,16);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[gtgMs,hz,speed]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>GtG: <span style={{color:'#e8e8e8'}}>{gtgMs}ms</span></span>
          <span style={{color:'#555'}}>Refresh: <span style={{color:'#e8e8e8'}}>{(1000/hz).toFixed(2)}ms ({hz}Hz)</span></span>
          <span style={{color:'#555'}}>MPRT: <span style={{color:'#e8e8e8'}}>{(1000/hz+gtgMs).toFixed(2)}ms</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:140}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>GTG (ms)</label><span style={{color:'#e8e8e8',fontSize:11}}>{gtgMs}ms</span></div>
          <input type="range" min={0} max={20} step={0.5} value={gtgMs} onChange={e=>setGtgMs(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>REFRESH RATE</label>
          <select value={hz} onChange={e=>setHz(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[60,75,90,120,144,165,240,360].map(n=><option key={n} value={n}>{n}Hz</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:140}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={120} max={3840} step={120} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
