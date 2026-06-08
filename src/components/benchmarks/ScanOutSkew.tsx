import React, { useState, useEffect, useRef } from 'react';

export default function ScanOutSkew() {
  const [speed, setSpeed] = useState(1920);
  const [dir, setDir] = useState<'h'|'v'>('h');
  const [objType, setObjType] = useState<'lines'|'grid'>('lines');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const skewFactor=0.3;
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      posRef.current=(posRef.current+speed*dt)%(W+20);
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=1;
      if(objType==='lines'){
        for(let i=0;i<5;i++){
          const x=(posRef.current+i*40)%W;
          // Skew: each row offset slightly
          ctx.beginPath();
          for(let y=0;y<H;y+=4){
            const skewX=x+y*skewFactor*(dir==='h'?1:0);
            y===0?ctx.moveTo(skewX,y):ctx.lineTo(skewX,y);
          }
          ctx.stroke();
        }
      } else {
        const gridSz=40;
        for(let row=0;row<H/gridSz+1;row++){
          for(let col=0;col<W/gridSz+1;col++){
            const bx=(posRef.current+col*gridSz)%W;
            const by=row*gridSz;
            const skewX=bx+by*skewFactor;
            ctx.strokeRect(skewX,by,gridSz-1,gridSz-1);
          }
        }
      }
      const tiltDeg=(Math.atan(skewFactor)*180/Math.PI).toFixed(1);
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(`Tilt: ~${tiltDeg}°  Speed: ${speed}px/s  Scan: Top→Bottom`,8,16);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[speed,dir,objType]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Scan: <span style={{color:'#e8e8e8'}}>Top→Bottom</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={120} max={3840} step={120} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        {(['lines','grid'] as const).map(o=><button key={o} onClick={()=>setObjType(o)} style={{background:'transparent',border:`1px solid ${objType===o?'#e8e8e8':'#2a2a2a'}`,color:objType===o?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{o}</button>)}
      </div>
    </div>
  );
}
