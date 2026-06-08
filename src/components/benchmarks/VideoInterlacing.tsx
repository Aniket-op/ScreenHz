import React, { useState, useEffect, useRef } from 'react';

export default function VideoInterlacing() {
  const [motionSpeed, setMotionSpeed] = useState(240);
  const [deintMode, setDeintMode] = useState<'none'|'bob'|'blend'>('none');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);
  const field = useRef(0);

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
      field.current=field.current^1;
      posRef.current=(posRef.current+motionSpeed*dt)%(halfW+40);
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      // Divider
      ctx.strokeStyle='#333'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(halfW,0); ctx.lineTo(halfW,H); ctx.stroke();
      // LEFT: interlaced
      for(let y=field.current;y<H;y+=2){
        ctx.fillStyle='#111'; ctx.fillRect(0,y,halfW,1);
      }
      const lx=posRef.current-20;
      if(deintMode==='none'){
        // Draw only one field
        for(let dy=0;dy<40;dy+=2) ctx.fillStyle='#e8e8e8',ctx.fillRect(lx,H/2-20+dy+field.current,40,1);
      } else if(deintMode==='bob'){
        ctx.fillStyle='#e8e8e8'; ctx.fillRect(lx,H/2-20,40,40);
      } else {
        ctx.fillStyle='rgba(232,232,232,0.5)'; ctx.fillRect(lx,H/2-20,40,40);
        ctx.fillStyle='rgba(232,232,232,0.5)'; ctx.fillRect(lx,H/2-21,40,40);
      }
      // RIGHT: progressive
      ctx.fillStyle='#e8e8e8'; ctx.fillRect(halfW+posRef.current-20,H/2-20,40,40);
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText('Interlaced 30i',8,16); ctx.fillText('Progressive 60p',halfW+8,16);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[motionSpeed,deintMode]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Left: <span style={{color:'#e8e8e8'}}>Interlaced 30i</span></span>
          <span style={{color:'#555'}}>Right: <span style={{color:'#e8e8e8'}}>Progressive 60p</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{motionSpeed}px/s</span></div>
          <input type="range" min={30} max={960} step={30} value={motionSpeed} onChange={e=>setMotionSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        {(['none','bob','blend'] as const).map(d=><button key={d} onClick={()=>setDeintMode(d)} style={{background:'transparent',border:`1px solid ${deintMode===d?'#e8e8e8':'#2a2a2a'}`,color:deintMode===d?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{d}</button>)}
      </div>
    </div>
  );
}
