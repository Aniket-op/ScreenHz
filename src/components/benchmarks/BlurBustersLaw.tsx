import React, { useState, useEffect, useRef } from 'react';
import { useHz } from '../../lib/hz-detector';

export default function BlurBustersLaw() {
  const { hz: detectedHz } = useHz();
  const [velocity, setVelocity] = useState(960);
  const [hz, setHz] = useState(165);
  const [showFormula, setShowFormula] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(()=>{ if(detectedHz>0) setHz(detectedHz); },[detectedHz]);

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
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      posRef.current=(posRef.current+velocity*dt)%(W+60);
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      const blurPx=velocity/(hz);
      // Blur trail
      ctx.fillStyle='rgba(232,232,232,0.15)';
      ctx.fillRect(posRef.current-60-blurPx,H/2-20,blurPx,40);
      // Object
      ctx.fillStyle='#e8e8e8'; ctx.fillRect(posRef.current-30,H/2-20,60,40);
      if(showFormula){
        ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
        ctx.fillText(`Blur = velocity / Hz = ${velocity} / ${hz} = ${blurPx.toFixed(1)}px`,8,16);
        ctx.fillText(`Refresh period: ${(1000/hz).toFixed(2)}ms`,8,30);
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[velocity,hz,showFormula]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Blur: <span style={{color:'#e8e8e8'}}>{(velocity/hz).toFixed(1)}px</span></span>
          <span style={{color:'#555'}}>At: <span style={{color:'#e8e8e8'}}>{velocity}px/s ÷ {hz}Hz</span></span>
          <span style={{color:'#555'}}>Your display: <span style={{color:'#00ff88'}}>{detectedHz||hz}Hz</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>VELOCITY</label><span style={{color:'#e8e8e8',fontSize:11}}>{velocity}px/s</span></div>
          <input type="range" min={60} max={3840} step={60} value={velocity} onChange={e=>setVelocity(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>Hz</label>
          <select value={hz} onChange={e=>setHz(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[60,75,90,120,144,165,240,360].map(n=><option key={n} value={n}>{n}Hz</option>)}
          </select>
        </div>
        <button onClick={()=>setShowFormula(s=>!s)} style={{background:'transparent',border:`1px solid ${showFormula?'#e8e8e8':'#2a2a2a'}`,color:showFormula?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{showFormula?'Hide Formula':'Show Formula'}</button>
      </div>
    </div>
  );
}
