import React, { useState, useEffect, useRef } from 'react';

export default function ColorRainbow() {
  const [speed, setSpeed] = useState(1920);
  const [bg, setBg] = useState<'black'|'grey'|'white'>('black');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const bgMap={black:'#000',grey:'#555',white:'#fff'};
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      posRef.current=(posRef.current+speed*dt)%(W+W);
      ctx.fillStyle=bgMap[bg]; ctx.fillRect(0,0,W,H);
      // Sharp vertical edge: black left, white right — moving
      const ex=posRef.current-W;
      if(ex>-W&&ex<W){
        ctx.fillStyle='#000'; ctx.fillRect(0,0,Math.max(0,ex),H);
        ctx.fillStyle='#fff'; ctx.fillRect(Math.max(0,ex),0,W-Math.max(0,ex),H);
      }
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(`Speed: ${speed}px/s — RGB fringing visible at periphery at high speed`,8,16);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[speed,bg]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Effect visible at <span style={{color:'#e8e8e8'}}>&gt;800px/s</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={120} max={3840} step={120} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        {(['black','grey','white'] as const).map(b=><button key={b} onClick={()=>setBg(b)} style={{background:'transparent',border:`1px solid ${bg===b?'#e8e8e8':'#2a2a2a'}`,color:bg===b?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{b}</button>)}
      </div>
    </div>
  );
}
