import React, { useState, useEffect, useRef } from 'react';

export default function LCDPixelResponse() {
  const [showOvershoot, setShowOvershoot] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(1);
  const [mode, setMode] = useState<'underdrive'|'normal'|'overdrive'>('normal');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const configs=[{gtg:1,label:'1ms GtG'},{gtg:4,label:'4ms GtG'},{gtg:16,label:'16ms GtG'}];
    const overshootMap={underdrive:0,normal:0.1,overdrive:0.3};
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000*animSpeed; lastTime=now;
      tRef.current=(tRef.current+dt)%2;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      const panelW=W/3;
      configs.forEach(({gtg,label},i)=>{
        const x=i*panelW;
        const t=tRef.current;
        // Transition: 0->1 in first half of cycle
        const phaseFrac=t<1?t:2-t; // 0..1..0
        const transitionFrac=Math.min(1,phaseFrac/(gtg/1000));
        const eased=1-Math.pow(1-transitionFrac,2);
        const overshoot=showOvershoot?overshootMap[mode]:0;
        const brightness=Math.min(1+overshoot,eased+overshoot*Math.max(0,1-transitionFrac*3));
        // Draw waveform
        const graphH=H*0.6,graphY=H*0.2;
        ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=1;
        ctx.strokeRect(x+8,graphY,panelW-16,graphH);
        // Draw response curve
        ctx.strokeStyle='#00ff88'; ctx.lineWidth=2;
        ctx.beginPath();
        const steps=100;
        for(let s=0;s<=steps;s++){
          const st=s/steps;
          const sf=st<0.5?st*2:2-st*2;
          const sf2=Math.min(1,sf/(gtg/1000));
          const se=1-Math.pow(1-sf2,2);
          const sb=Math.min(1+overshoot,se+overshoot*Math.max(0,1-sf2*3));
          const px=x+8+(s/steps)*(panelW-16);
          const py=graphY+graphH-(Math.min(1,sb)*graphH);
          s===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
        }
        ctx.stroke();
        // Hairline at 100%
        ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(x+8,graphY); ctx.lineTo(x+panelW-8,graphY); ctx.stroke();
        ctx.setLineDash([]);
        // Label
        ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(label,x+panelW/2,graphY+graphH+20);
        // Live pixel
        const pxSize=32;
        ctx.fillStyle=`rgb(${Math.round(brightness*232)},${Math.round(brightness*232)},${Math.round(brightness*232)})`;
        ctx.fillRect(x+panelW/2-pxSize/2,graphY+graphH+36,pxSize,pxSize);
      });
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[showOvershoot,animSpeed,mode]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>1ms GtG</span><span style={{color:'#555'}}>4ms GtG</span><span style={{color:'#555'}}>16ms GtG</span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <button onClick={()=>setShowOvershoot(s=>!s)} style={{background:'transparent',border:`1px solid ${showOvershoot?'#e8e8e8':'#2a2a2a'}`,color:showOvershoot?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{showOvershoot?'Hide Overshoot':'Show Overshoot'}</button>
        {(['underdrive','normal','overdrive'] as const).map(m=><button key={m} onClick={()=>setMode(m)} style={{background:'transparent',border:`1px solid ${mode===m?'#e8e8e8':'#2a2a2a'}`,color:mode===m?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{m}</button>)}
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:140}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>ANIM SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{animSpeed}x</span></div>
          <input type="range" min={0.1} max={3} step={0.1} value={animSpeed} onChange={e=>setAnimSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
