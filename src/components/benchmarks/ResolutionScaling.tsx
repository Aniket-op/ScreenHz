import React, { useState, useEffect, useRef } from 'react';

export default function ResolutionScaling() {
  const [pattern, setPattern] = useState<'hlines'|'vlines'|'diag'|'checker'>('hlines');
  const [ppiIn, setPpiIn] = useState(27);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1;
    if (pattern === 'hlines') {
      for (let y = 0; y < H; y += 2) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    } else if (pattern === 'vlines') {
      for (let x = 0; x < W; x += 2) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    } else if (pattern === 'diag') {
      for (let x = -H; x < W+H; x += 2) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+H,H); ctx.stroke(); }
    } else if (pattern === 'checker') {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x+y)%2===0) { ctx.fillStyle='#e8e8e8'; ctx.fillRect(x,y,1,1); }
    }
  }, [pattern]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssW = typeof window !== 'undefined' ? window.screen.width : 0;
  const cssH = typeof window !== 'undefined' ? window.screen.height : 0;
  const diagPx = Math.sqrt((cssW * dpr)**2 + (cssH * dpr)**2);
  const ppi = ppiIn > 0 ? Math.round(diagPx / ppiIn) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>CSS: <span style={{color:'#e8e8e8'}}>{cssW}×{cssH}</span></span>
          <span style={{color:'#555'}}>DPR: <span style={{color:'#e8e8e8'}}>{dpr.toFixed(1)}</span></span>
          <span style={{color:'#555'}}>Est. PPI: <span style={{color:'#e8e8e8'}}>{ppi || '—'}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        {(['hlines','vlines','diag','checker'] as const).map(p=>(
          <button key={p} onClick={()=>setPattern(p)} style={{background:'transparent',border:`1px solid ${pattern===p?'#e8e8e8':'#2a2a2a'}`,color:pattern===p?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{p}</button>
        ))}
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>DISPLAY SIZE (inches)</label>
          <input type="number" min={10} max={100} value={ppiIn} onChange={e=>setPpiIn(+e.target.value)} style={{width:80,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
      </div>
    </div>
  );
}
