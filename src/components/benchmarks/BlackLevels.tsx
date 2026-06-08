import React, { useState, useEffect, useRef } from 'react';

export default function BlackLevels() {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showRef, setShowRef] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const draw = () => {
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
      const steps = 16;
      const sw = W / steps;
      for (let i = 0; i < steps; i++) {
        const v = Math.round((i / (steps-1)) * 30);
        ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(i*sw, 0, sw, H/2);
      }
      // Full gradient
      const grad = ctx.createLinearGradient(0, H/2, W, H/2);
      grad.addColorStop(0,'#000000'); grad.addColorStop(1,'#1e1e1e');
      ctx.fillStyle = grad; ctx.fillRect(0, H/2, W, H/4);
      // PLUGE bars
      if (showRef) {
        const bw = W/5;
        ctx.fillStyle = '#000000'; ctx.fillRect(bw,   H*3/4, bw, H/4);
        ctx.fillStyle = 'rgb(3,3,3)'; ctx.fillRect(bw*2, H*3/4, bw, H/4);
        ctx.fillStyle = 'rgb(18,18,18)'; ctx.fillRect(bw*3, H*3/4, bw, H/4);
        ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('Sub-black', bw+bw/2, H-8); ctx.fillText('Black', bw*2+bw/2, H-8); ctx.fillText('Near-black', bw*3+bw/2, H-8);
      }
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace'; ctx.textAlign='left';
      ctx.fillText('16 steps: 0–30 RGB', 8, 16);
    };
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; draw(); };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, [showRef]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Visible steps: <span style={{color:'#e8e8e8'}}>{visibleSteps} / 16</span></span>
          <span style={{color:'#555',fontSize:11}}>Adjust monitor brightness until sub-black is invisible</span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>STEPS I CAN SEE</label>
          <input type="number" min={0} max={16} value={visibleSteps} onChange={e=>setVisibleSteps(+e.target.value)} style={{width:60,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        <button onClick={()=>setShowRef(s=>!s)} style={{background:'transparent',border:`1px solid ${showRef?'#e8e8e8':'#2a2a2a'}`,color:showRef?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{showRef?'Hide PLUGE':'Show PLUGE'}</button>
      </div>
    </div>
  );
}
