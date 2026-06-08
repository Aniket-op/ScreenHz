import React, { useState, useEffect, useRef } from 'react';

export default function CalibrationPatterns() {
  const patterns = ['White','Black','Red','Green','Blue','Grey Ramp','Color Bars','Resolution'];
  const [patternIndex, setPatternIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const draw = () => {
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W=canvas.width,H=canvas.height;
      const p=patterns[patternIndex];
      if (p==='White') { ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H); }
      else if (p==='Black') { ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H); }
      else if (p==='Red') { ctx.fillStyle='#ff0000'; ctx.fillRect(0,0,W,H); }
      else if (p==='Green') { ctx.fillStyle='#00ff00'; ctx.fillRect(0,0,W,H); }
      else if (p==='Blue') { ctx.fillStyle='#0000ff'; ctx.fillRect(0,0,W,H); }
      else if (p==='Grey Ramp') {
        const g=ctx.createLinearGradient(0,0,W,0); g.addColorStop(0,'#000'); g.addColorStop(1,'#fff');
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
        for(let i=0;i<10;i++){ctx.fillStyle='#555';ctx.fillText(Math.round(i/9*255)+'',i*W/10+4,16);}
      }
      else if (p==='Color Bars') {
        const cols=['#fff','#ff0','#0ff','#0f0','#f0f','#f00','#00f','#000'];
        cols.forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(i*W/8,0,W/8,H);});
      }
      else {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
        ctx.strokeStyle='#fff'; ctx.lineWidth=1;
        for(let x=0;x<W;x+=8){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
        for(let y=0;y<H;y+=8){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
        ctx.fillStyle='#fff'; ctx.font='14px "IBM Plex Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(`${W}×${H}`, W/2, H/2);
      }
    };
    const resize=()=>{canvas.width=canvas.parentElement?.offsetWidth||800;canvas.height=canvas.parentElement?.offsetHeight||400;draw();};
    resize(); window.addEventListener('resize',resize); return ()=>window.removeEventListener('resize',resize);
  }, [patternIndex]);

  const apl = ['100','0','33','33','33','50','50','50'][patternIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Pattern: <span style={{color:'#e8e8e8'}}>{patterns[patternIndex]}</span></span>
          <span style={{color:'#555'}}>APL: <span style={{color:'#e8e8e8'}}>{apl}%</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 8, alignItems: 'center' }}>
        {patterns.map((p,i)=><button key={p} onClick={()=>setPatternIndex(i)} style={{background:'transparent',border:`1px solid ${patternIndex===i?'#e8e8e8':'#2a2a2a'}`,color:patternIndex===i?'#e8e8e8':'#555',padding:'6px 12px',fontFamily:"'IBM Plex Mono',monospace",fontSize:11,borderRadius:4,cursor:'pointer'}}>{p}</button>)}
      </div>
    </div>
  );
}
