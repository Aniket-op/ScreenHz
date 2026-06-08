import React, { useState, useEffect, useRef } from 'react';

export default function EyeTrackingBlur() {
  const [speed, setSpeed] = useState(480);
  const [barSize, setBarSize] = useState(40);
  const [showRef, setShowRef] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime = performance.now(); let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const dt = (now - lastTime) / 1000; lastTime = now;
      posRef.current = (posRef.current + speed * dt) % (W + barSize);
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H);
      // Moving bar
      const x = posRef.current - barSize;
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x, H/2 - barSize/2, barSize, barSize);
      // Static reference
      if (showRef) {
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1;
        ctx.strokeRect(16, H/2 - barSize/2, barSize, barSize);
        ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace';
        ctx.fillText('REF', 16 + barSize/2 - 12, H/2 + 4);
      }
      // Instruction
      ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Follow the moving bar with your eyes', W/2, H - 24);
      ctx.textAlign = 'left';
      // Estimated blur label
      const blurPx = (speed / 60).toFixed(1);
      ctx.fillStyle = '#555'; ctx.fillText('Est. blur at 60Hz: ~' + blurPx + 'px', 16, 20);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, barSize, showRef]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Est. blur: <span style={{color:'#e8e8e8'}}>{(speed/60).toFixed(1)}px</span></span>
          <span style={{color:'#555'}}>Bar size: <span style={{color:'#e8e8e8'}}>{barSize}px</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={2000} step={10} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>BAR SIZE</label><span style={{color:'#e8e8e8',fontSize:11}}>{barSize}px</span></div>
          <input type="range" min={10} max={120} value={barSize} onChange={e=>setBarSize(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <button onClick={()=>setShowRef(s=>!s)} style={{background:'transparent',border:`1px solid ${showRef?'#e8e8e8':'#2a2a2a'}`,color:showRef?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>
          {showRef ? 'Hide Reference' : 'Show Reference'}
        </button>
      </div>
    </div>
  );
}
