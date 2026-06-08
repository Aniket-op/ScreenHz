import React, { useState, useEffect, useRef } from 'react';

export default function BrowserTimingPlot() {
  const [windowSize, setWindowSize] = useState(120);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deltasRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const [stats, setStats] = useState({mean:0,sigma:0,jank:0,timerRes:0});

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let animId: number; let frameIdx=0;
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=now-lastTimeRef.current; lastTimeRef.current=now;
      deltasRef.current.push(dt);
      if(deltasRef.current.length>windowSize) deltasRef.current.shift();
      frameIdx++;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      const mean=deltasRef.current.reduce((a,b)=>a+b,0)/(deltasRef.current.length||1);
      const pts=deltasRef.current;
      // Scatter
      const ptW=W/(windowSize||1);
      pts.forEach((d,i)=>{
        const isJank=d>mean*1.5;
        const y=H/2-(d-mean)*(H/4/Math.max(1,mean));
        ctx.fillStyle=isJank?'#ff4444':'#e8e8e8';
        ctx.fillRect(i*ptW,Math.max(4,Math.min(H-4,y)),Math.max(1,ptW-1),2);
      });
      // Hairline at expected
      ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(`Expected: ${mean.toFixed(2)}ms`,8,16);
      if(frameIdx%30===0){
        const sigma=Math.sqrt(pts.reduce((s,d)=>s+(d-mean)**2,0)/(pts.length||1));
        const jank=pts.filter(d=>d>mean*1.5).length;
        setStats({mean:+mean.toFixed(2),sigma:+sigma.toFixed(3),jank,timerRes:+performance.now().toString().split('.')[1]?.length||0});
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[windowSize]);

  const exportCSV=()=>{
    const csv=deltasRef.current.map((d,i)=>`${i},${d.toFixed(3)}`).join('\n');
    const a=document.createElement('a'); a.href='data:text/csv,'+encodeURIComponent('frame,delta_ms\n'+csv);
    a.download='frame-timing.csv'; a.click();
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Mean: <span style={{color:'#00ff88'}}>{stats.mean}ms</span></span>
          <span style={{color:'#555'}}>σ: <span style={{color:'#e8e8e8'}}>{stats.sigma}ms</span></span>
          <span style={{color:'#555'}}>Jank: <span style={{color:stats.jank>0?'#ff4444':'#00ff88'}}>{stats.jank}</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>WINDOW</label>
          <select value={windowSize} onChange={e=>setWindowSize(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[60,120,300,600].map(n=><option key={n} value={n}>{n} frames</option>)}
          </select>
        </div>
        <button onClick={exportCSV} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>Export CSV</button>
        <button onClick={()=>{deltasRef.current=[];}} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>Reset</button>
      </div>
    </div>
  );
}
