import React, { useState, useEffect, useRef } from 'react';

export default function StrobeCrosstalk() {
  const [phase, setPhase] = useState(50);
  const [speed, setSpeed] = useState(480);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

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
      posRef.current=(posRef.current+speed*dt)%(W+60);
      ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      const x=posRef.current-30;
      const barH=60;
      // Main bar
      ctx.fillStyle='#e8e8e8'; ctx.fillRect(x,H/2-barH/2,60,barH);
      // Ghost due to phase misalignment
      const ghostOffset=(phase-50)*2;
      if (Math.abs(ghostOffset)>5) {
        const ghostAlpha=Math.abs(ghostOffset)/100*0.7;
        ctx.fillStyle=`rgba(232,232,232,${ghostAlpha.toFixed(2)})`;
        ctx.fillRect(x,H/2-barH/2-ghostOffset,60,barH);
      }
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(`Phase: ${phase}% — ${Math.abs(phase-50)<5?'Clean':'Crosstalk visible'}`, 8, 16);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [phase, speed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Phase: <span style={{color:'#e8e8e8'}}>{phase}%</span></span>
          <span style={{color:'#555'}}>Crosstalk: <span style={{color:Math.abs(phase-50)<5?'#00ff88':'#ff4444'}}>{Math.abs(phase-50)<5?'Clean':'Visible'}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>STROBE PHASE</label><span style={{color:'#e8e8e8',fontSize:11}}>{phase}%</span></div>
          <input type="range" min={0} max={100} value={phase} onChange={e=>setPhase(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={1920} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
