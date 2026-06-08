import React, { useState, useRef, useEffect } from 'react';

export default function DPICalculator() {
  const [physicalDist, setPhysicalDist] = useState(3.0);
  const [sensitivity, setSensitivity] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<{x:number;y:number}|null>(null);
  const endRef = useRef<{x:number;y:number}|null>(null);
  const [pixels, setPixels] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; draw(); };
    const draw = () => {
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1; ctx.setLineDash([8,8]);
      ctx.strokeRect(16,16,W-32,H-32);
      ctx.setLineDash([]);
      ctx.fillStyle='#555'; ctx.font='13px "IBM Plex Mono",monospace'; ctx.textAlign='center';
      ctx.fillText('Click and drag to measure pixel distance',W/2,H/2);
      if(startRef.current&&endRef.current){
        const s=startRef.current,e=endRef.current;
        ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=2; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(e.x,e.y); ctx.stroke();
        ctx.fillStyle='#00ff88';
        ctx.arc(s.x,s.y,5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x,e.y,5,0,Math.PI*2); ctx.fill();
        const dx=e.x-s.x,dy=e.y-s.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        setPixels(Math.round(dist));
      }
    };
    const onDown=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();startRef.current={x:e.clientX-r.left,y:e.clientY-r.top};endRef.current=null;};
    const onMove=(e:PointerEvent)=>{if(!startRef.current) return;const r=canvas.getBoundingClientRect();endRef.current={x:e.clientX-r.left,y:e.clientY-r.top};draw();};
    const onUp=()=>{draw();};
    canvas.addEventListener('pointerdown',onDown);
    canvas.addEventListener('pointermove',onMove);
    canvas.addEventListener('pointerup',onUp);
    resize(); window.addEventListener('resize',resize);
    return()=>{window.removeEventListener('resize',resize);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);};
  },[physicalDist]);

  const dpi = physicalDist > 0 && pixels > 0 ? Math.round(pixels / physicalDist) : 0;
  const edpi = dpi * sensitivity;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block',cursor:'crosshair'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Pixels: <span style={{color:'#e8e8e8'}}>{pixels}px</span></span>
          <span style={{color:'#555'}}>Est. DPI: <span style={{color:'#ffffff',fontSize:18}}>{dpi||'—'}</span></span>
          <span style={{color:'#555'}}>eDPI: <span style={{color:'#e8e8e8'}}>{dpi?Math.round(edpi):'—'}</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>PHYSICAL DIST (inches)</label>
          <input type="number" min={0.1} max={24} step={0.1} value={physicalDist} onChange={e=>setPhysicalDist(+e.target.value)} style={{width:80,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>GAME SENSITIVITY</label>
          <input type="number" min={0.01} max={100} step={0.1} value={sensitivity} onChange={e=>setSensitivity(+e.target.value)} style={{width:80,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        <p style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace",margin:0}}>
          Drag a line on the canvas equal to a measured physical distance on your desk with a ruler, then enter the ruler measurement above.
        </p>
      </div>
    </div>
  );
}
