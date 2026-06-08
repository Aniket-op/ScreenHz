import React, { useState, useEffect, useRef } from 'react';

export default function ScanOut() {
  const [hz, setHz] = useState(60);
  const [stripeH, setStripeH] = useState(4);
  const [orientation, setOrientation] = useState<'h'|'v'>('h');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef(0);

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
      const limit=orientation==='h'?H:W;
      scanRef.current=(scanRef.current+limit*hz*dt)%limit;
      ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      const stripeCount=Math.ceil(limit/(stripeH*2));
      for(let i=0;i<stripeCount;i++){
        const pos=((i*stripeH*2+scanRef.current)%limit);
        ctx.fillStyle='#e8e8e8';
        if(orientation==='h') ctx.fillRect(0,pos,W,stripeH);
        else ctx.fillRect(pos,0,stripeH,H);
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [hz, stripeH, orientation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Stripe freq: <span style={{color:'#e8e8e8'}}>{hz}Hz</span></span>
          <span style={{color:'#555'}}>Stripe height: <span style={{color:'#e8e8e8'}}>{stripeH}px</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>FREQUENCY (Hz)</label>
          <select value={hz} onChange={e=>setHz(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[30,60,90,120,144,165,240].map(n=><option key={n} value={n}>{n}Hz</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>STRIPE HEIGHT</label>
          <input type="number" min={1} max={20} value={stripeH} onChange={e=>setStripeH(+e.target.value)} style={{width:60,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        {(['h','v'] as const).map(d=><button key={d} onClick={()=>setOrientation(d)} style={{background:'transparent',border:`1px solid ${orientation===d?'#e8e8e8':'#2a2a2a'}`,color:orientation===d?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{d==='h'?'Horizontal':'Vertical'}</button>)}
      </div>
    </div>
  );
}
