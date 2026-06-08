import React, { useState, useEffect, useRef } from 'react';

export default function HDRTest() {
  const [pat, setPat] = useState<'brightness'|'color'|'contrast'>('brightness');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; draw(); };
    const draw = () => {
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
      if (pat === 'brightness') {
        const steps = 10;
        for (let i = 0; i < steps; i++) {
          const v = Math.round((i / (steps-1)) * 255);
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(i*(W/steps), 0, W/steps, H);
          ctx.fillStyle = v > 128 ? '#000' : '#fff';
          ctx.font = '11px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
          ctx.fillText(v+'', i*(W/steps)+W/steps/2, H-8);
        }
      } else if (pat === 'color') {
        const colors = ['#ff0000','#00ff00','#0000ff','#ffffff','#ffff00','#00ffff','#ff00ff','#ff8800'];
        colors.forEach((c,i) => { ctx.fillStyle=c; ctx.fillRect(i*(W/colors.length),0,W/colors.length,H); });
      } else {
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W/2,H);
        ctx.fillStyle = '#000'; ctx.fillRect(W/2,0,W/2,H);
        ctx.fillStyle = '#555'; ctx.font = '13px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
        ctx.fillText('If HDR active: left brighter than 100% SDR', W/2, H-16);
      }
    };
    draw();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [pat]);

  const hdrSupported = typeof window !== 'undefined' && window.matchMedia?.('(dynamic-range: high)').matches;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>HDR detected: <span style={{color:hdrSupported?'#00ff88':'#ff4444'}}>{hdrSupported?'Yes':'No'}</span></span>
          <span style={{color:'#555'}}>Pattern: <span style={{color:'#e8e8e8'}}>{pat}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', gap: 16, alignItems: 'center' }}>
        {(['brightness','color','contrast'] as const).map(p=>(
          <button key={p} onClick={()=>setPat(p)} style={{background:'transparent',border:`1px solid ${pat===p?'#e8e8e8':'#2a2a2a'}`,color:pat===p?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{p}</button>
        ))}
      </div>
    </div>
  );
}
