import React, { useState, useEffect, useRef } from 'react';

export default function AliasingTest() {
  const [pat, setPat] = useState<'diagonal'|'curves'|'text'|'subpixel'>('diagonal');
  const [animated, setAnimated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W=canvas.width,H=canvas.height;
      if (animated) angleRef.current += 0.5;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=1; ctx.imageSmoothingEnabled=false;
      if (pat==='diagonal') {
        for (let a=0;a<=45;a+=5) {
          const rad=(a+angleRef.current)*Math.PI/180;
          ctx.save(); ctx.translate(W/2,H/2); ctx.rotate(rad);
          for (let x=-W;x<W;x+=20) { ctx.beginPath(); ctx.moveTo(x,-H); ctx.lineTo(x,H); ctx.stroke(); }
          ctx.restore();
        }
      } else if (pat==='curves') {
        for (let i=0;i<8;i++) {
          ctx.beginPath(); ctx.arc(W/2,H/2,(i+1)*40+angleRef.current*2,0,Math.PI*2); ctx.stroke();
        }
      } else if (pat==='text') {
        ctx.fillStyle='#e8e8e8';
        [8,9,10,11,12].forEach((sz,i)=>{ ctx.font=`${sz}px "IBM Plex Mono",monospace`; ctx.fillText('ScreenHz Aliasing Test 01',16,40+i*22); });
      } else {
        // Subpixel stripes
        ['#ff0000','#00ff00','#0000ff'].forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(i*(W/3),0,W/3,H); });
        ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle='#000';
        ctx.font='32px "IBM Plex Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('Subpixel Stripe Test', W/2, H/2);
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [pat, animated]);

  const dpr = typeof window!=='undefined'?window.devicePixelRatio||1:1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>DPR: <span style={{color:'#e8e8e8'}}>{dpr.toFixed(1)}</span></span>
          <span style={{color:'#555'}}>Pattern: <span style={{color:'#e8e8e8'}}>{pat}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        {(['diagonal','curves','text','subpixel'] as const).map(p=><button key={p} onClick={()=>setPat(p)} style={{background:'transparent',border:`1px solid ${pat===p?'#e8e8e8':'#2a2a2a'}`,color:pat===p?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{p}</button>)}
        <button onClick={()=>setAnimated(a=>!a)} style={{background:'transparent',border:`1px solid ${animated?'#e8e8e8':'#2a2a2a'}`,color:animated?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{animated?'Stop':'Animate'}</button>
      </div>
    </div>
  );
}
