import React, { useState, useEffect, useRef } from 'react';

export default function WhiteLevels() {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showChecker, setShowChecker] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const draw = () => {
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H);
      const steps = 16;
      const sw = W / steps;
      for (let i = 0; i < steps; i++) {
        const v = 225 + Math.round((i / (steps-1)) * 30);
        ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(i*sw, 0, sw, H/2);
        ctx.fillStyle='#aaa'; ctx.font='11px "IBM Plex Mono",monospace'; ctx.textAlign='center';
        if(i%4===0) ctx.fillText(v+'', i*sw+sw/2, H/2-4);
      }
      const grad = ctx.createLinearGradient(0,H/2,W,H/2);
      grad.addColorStop(0,'#e1e1e1'); grad.addColorStop(1,'#ffffff');
      ctx.fillStyle=grad; ctx.fillRect(0,H/2,W,showChecker?H/4:H/2);
      if (showChecker) {
        const sqSz=2;
        for(let y=H*3/4;y<H;y+=sqSz) for(let x=0;x<W;x+=sqSz) {
          ctx.fillStyle=(Math.floor(x/sqSz)+Math.floor((y-H*3/4)/sqSz))%2===0?'#ffffff':'#e8e8e8';
          ctx.fillRect(x,y,sqSz,sqSz);
        }
      }
    };
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; draw(); };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, [showChecker]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Visible steps: <span style={{color:'#e8e8e8'}}>{visibleSteps} / 16</span></span>
          <span style={{color:'#555'}}>APL: <span style={{color:'#e8e8e8'}}>100%</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>STEPS I CAN SEE</label>
          <input type="number" min={0} max={16} value={visibleSteps} onChange={e=>setVisibleSteps(+e.target.value)} style={{width:60,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        <button onClick={()=>setShowChecker(s=>!s)} style={{background:'transparent',border:`1px solid ${showChecker?'#e8e8e8':'#2a2a2a'}`,color:showChecker?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{showChecker?'Hide Checker':'Show Checker'}</button>
      </div>
    </div>
  );
}
