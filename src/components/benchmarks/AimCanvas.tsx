import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function AimCanvas() {
  const [running, setRunning] = useState(false);
  const [targetSize, setTargetSize] = useState<'S'|'M'|'L'>('M');
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<{x:number;y:number;r:number}>({x:200,y:200,r:30});
  const lastClickRef = useRef(performance.now());
  const clickTimesRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const sizeMap={S:15,M:30,L:50};

  const placeTarget=useCallback(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const r=sizeMap[targetSize];
    const margin=r+16;
    targetRef.current={
      x:margin+Math.random()*(canvas.width-margin*2),
      y:margin+Math.random()*(canvas.height-margin*2),
      r
    };
  },[targetSize]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const resize=()=>{canvas.width=canvas.parentElement?.offsetWidth||800;canvas.height=canvas.parentElement?.offsetHeight||400;};
    resize(); window.addEventListener('resize',resize); return()=>window.removeEventListener('resize',resize);
  },[]);

  useEffect(()=>{
    if(!running) return;
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{if(t<=1){setRunning(false);if(timerRef.current)clearInterval(timerRef.current);return 0;}return t-1;});
    },1000);
    return()=>{if(timerRef.current)clearInterval(timerRef.current);};
  },[running]);

  const start=()=>{setRunning(true);setTimeLeft(30);setScore(0);setHits(0);setMisses(0);setAvgTime(0);clickTimesRef.current=[];placeTarget();};

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    let animId: number;
    const loop=()=>{
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      if(!running){
        ctx.fillStyle='#555'; ctx.font='14px "IBM Plex Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(timeLeft===0?'Session complete — press Start':'Press Start to begin',W/2,H/2);
        ctx.textAlign='left';
      } else {
        const {x,y,r}=targetRef.current;
        ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-r*0.3,y); ctx.lineTo(x+r*0.3,y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y-r*0.3); ctx.lineTo(x,y+r*0.3); ctx.stroke();
        ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
        ctx.fillText(`${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`,8,18);
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[running,timeLeft]);

  const handleClick=(e:React.MouseEvent)=>{
    if(!running) return;
    const canvas=canvasRef.current; if(!canvas) return;
    const rect=canvas.getBoundingClientRect();
    const cx=e.clientX-rect.left,cy=e.clientY-rect.top;
    const {x,y,r}=targetRef.current;
    const dist=Math.sqrt((cx-x)**2+(cy-y)**2);
    const now=performance.now();
    const elapsed=now-lastClickRef.current; lastClickRef.current=now;
    if(dist<=r){
      setScore(s=>s+1); setHits(h=>h+1);
      clickTimesRef.current.push(elapsed);
      setAvgTime(Math.round(clickTimesRef.current.reduce((a,b)=>a+b,0)/clickTimesRef.current.length));
      placeTarget();
    } else {
      setMisses(m=>m+1);
    }
  };

  const accuracy=hits+misses>0?Math.round(hits/(hits+misses)*100):100;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} onClick={handleClick} style={{width:'100%',height:'100%',display:'block',cursor:'crosshair'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Score: <span style={{color:'#ffffff',fontSize:18}}>{score}</span></span>
          <span style={{color:'#555'}}>Accuracy: <span style={{color:'#e8e8e8'}}>{accuracy}%</span></span>
          <span style={{color:'#555'}}>Avg time: <span style={{color:'#e8e8e8'}}>{avgTime}ms</span></span>
          <span style={{color:'#555'}}>Time: <span style={{color:'#00ff88'}}>{String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <button onClick={start} style={{background:'transparent',border:'1px solid #e8e8e8',color:'#e8e8e8',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{running?'Restart':'Start (30s)'}</button>
        {(['S','M','L'] as const).map(s=><button key={s} onClick={()=>setTargetSize(s)} style={{background:'transparent',border:`1px solid ${targetSize===s?'#e8e8e8':'#2a2a2a'}`,color:targetSize===s?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{s}</button>)}
      </div>
    </div>
  );
}
