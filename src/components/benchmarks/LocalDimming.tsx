import React, { useState, useEffect, useRef } from 'react';

export default function LocalDimming() {
  const [boxSize, setBoxSize] = useState(200);
  const [mode, setMode] = useState<'static'|'moving'>('static');
  const [bg, setBg] = useState<'black'|'dimgrey'>('black');
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
      const dt = (now-lastTime)/1000; lastTime=now;
      ctx.fillStyle = bg === 'black' ? '#000000' : '#1a1a1a';
      ctx.fillRect(0,0,W,H);
      if (mode === 'moving') posRef.current = (posRef.current + 240*dt) % (W + boxSize);
      const bx = mode === 'moving' ? posRef.current - boxSize/2 : W/2 - boxSize/2;
      const by = H/2 - boxSize/2;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, boxSize, boxSize);
      const apl = Math.round((boxSize*boxSize) / (W*H) * 100);
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(`APL: ${apl}%  Size: ${boxSize}×${boxSize}px`, 8, 16);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [boxSize, mode, bg]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Mode: <span style={{color:'#e8e8e8'}}>{mode}</span></span>
          <span style={{color:'#555'}}>Size: <span style={{color:'#e8e8e8'}}>{boxSize}×{boxSize}px</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>BOX SIZE</label><span style={{color:'#e8e8e8',fontSize:11}}>{boxSize}px</span></div>
          <input type="range" min={20} max={800} step={10} value={boxSize} onChange={e=>setBoxSize(+e.target.value)} style={{width:'100%'}}/>
        </div>
        {(['static','moving'] as const).map(m=><button key={m} onClick={()=>setMode(m)} style={{background:'transparent',border:`1px solid ${mode===m?'#e8e8e8':'#2a2a2a'}`,color:mode===m?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{m}</button>)}
        {(['black','dimgrey'] as const).map(b=><button key={b} onClick={()=>setBg(b)} style={{background:'transparent',border:`1px solid ${bg===b?'#e8e8e8':'#2a2a2a'}`,color:bg===b?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{b}</button>)}
      </div>
    </div>
  );
}
