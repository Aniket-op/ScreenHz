import React, { useState, useEffect, useRef } from 'react';

export default function FlickerTest() {
  const [frequency, setFrequency] = useState(120);
  const [dutyCycle, setDutyCycle] = useState(50);
  const [hiLevel, setHiLevel] = useState(255);
  const [loLevel, setLoLevel] = useState(0);
  const [waveform, setWaveform] = useState<'square'|'sine'>('square');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      tRef.current+=dt;
      let brightness: number;
      if (waveform==='square') {
        const period=1/frequency;
        const phase=(tRef.current%period)/period;
        brightness=phase<dutyCycle/100?hiLevel:loLevel;
      } else {
        brightness=loLevel+(hiLevel-loLevel)*(0.5+0.5*Math.sin(2*Math.PI*frequency*tRef.current));
      }
      const v=Math.round(brightness);
      ctx.fillStyle=`rgb(${v},${v},${v})`; ctx.fillRect(0,0,W,H);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [frequency, dutyCycle, hiLevel, loLevel, waveform]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Frequency: <span style={{color:'#e8e8e8'}}>{frequency}Hz</span></span>
          <span style={{color:'#555'}}>Duty: <span style={{color:'#e8e8e8'}}>{dutyCycle}%</span></span>
          <span style={{color:'#555'}}>Waveform: <span style={{color:'#e8e8e8'}}>{waveform}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>FREQUENCY</label><span style={{color:'#e8e8e8',fontSize:11}}>{frequency}Hz</span></div>
          <input type="range" min={1} max={500} value={frequency} onChange={e=>setFrequency(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:120}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>DUTY CYCLE</label><span style={{color:'#e8e8e8',fontSize:11}}>{dutyCycle}%</span></div>
          <input type="range" min={1} max={99} value={dutyCycle} onChange={e=>setDutyCycle(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>HI</label>
            <input type="number" min={0} max={255} value={hiLevel} onChange={e=>setHiLevel(+e.target.value)} style={{width:56,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>LO</label>
            <input type="number" min={0} max={255} value={loLevel} onChange={e=>setLoLevel(+e.target.value)} style={{width:56,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
          </div>
        </div>
        {(['square','sine'] as const).map(w=><button key={w} onClick={()=>setWaveform(w)} style={{background:'transparent',border:`1px solid ${waveform===w?'#e8e8e8':'#2a2a2a'}`,color:waveform===w?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{w}</button>)}
      </div>
    </div>
  );
}
