import React, { useState, useEffect, useRef } from 'react';

export default function BFITest() {
  const [dutyCycle, setDutyCycle] = useState(50);
  const [speed, setSpeed] = useState(480);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let pos = 0; let lastTime = performance.now(); let frame = 0; let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height, halfW = W / 2;
      const dt = now - lastTime; lastTime = now;
      pos = (pos + speed * dt / 1000) % (W + 60);
      frame++;
      const isBlackFrame = (frame % 2 === 0) && ((frame % 2) / 2 * 100 > dutyCycle);

      // Left: normal
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, halfW, H);
      const lx = (pos % halfW) - 30;
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(lx, H/2 - 20, 60, 40);

      // Divider
      ctx.fillStyle = '#222'; ctx.fillRect(halfW, 0, 1, H);

      // Right: BFI
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(halfW + 1, 0, halfW - 1, H);
      const showFrame = Math.floor(now / (1000 / 60)) % 100 < dutyCycle;
      if (showFrame) {
        const rx = (pos % halfW) - 30;
        ctx.fillStyle = '#e8e8e8'; ctx.fillRect(halfW + 1 + rx, H/2 - 20, 60, 40);
      }

      // Labels
      ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillText('NORMAL', 8, 16);
      ctx.fillText('BFI ' + dutyCycle + '% duty', halfW + 8, 16);

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [dutyCycle, speed]);

  const brightness = Math.round(dutyCycle);
  const clarityGain = Math.round((100 - dutyCycle) * 0.4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Duty cycle: <span style={{color:'#e8e8e8'}}>{dutyCycle}%</span></span>
          <span style={{color:'#555'}}>Perceived brightness: <span style={{color:'#e8e8e8'}}>-{100-brightness}%</span></span>
          <span style={{color:'#555'}}>Motion clarity: <span style={{color:'#00ff88'}}>+{clarityGain}%</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>DUTY CYCLE</label>
            <span style={{color:'#e8e8e8',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>{dutyCycle}%</span>
          </div>
          <input type="range" min={10} max={90} value={dutyCycle} onChange={e=>setDutyCycle(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label>
            <span style={{color:'#e8e8e8',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>{speed} px/s</span>
          </div>
          <input type="range" min={60} max={1920} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
