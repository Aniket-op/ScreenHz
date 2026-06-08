import React, { useEffect, useRef } from 'react';

export default function ChromaSubsampling() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; draw(); };
    const draw = () => {
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0,0,W,H);
      const rowH = H / 3;
      // Row 1: colored text on colored bg
      const pairs = [['#ff0000','#00ff00'],['#00ff00','#0000ff'],['#0000ff','#ff0000'],['#ffff00','#0000ff']];
      pairs.forEach(([fg,bg],i) => {
        const x = i * W/4;
        ctx.fillStyle = bg; ctx.fillRect(x, 0, W/4, rowH);
        ctx.fillStyle = fg; ctx.font = 'bold 24px "IBM Plex Mono",monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('TEXT', x + W/8, rowH/2);
      });
      // Row 2: fine color checkerboard
      const sqSz = 2;
      for (let y = rowH; y < rowH*2; y += sqSz) for (let x = 0; x < W; x += sqSz) {
        ctx.fillStyle = (Math.floor(x/sqSz)+Math.floor((y-rowH)/sqSz))%2===0 ? '#ff0000' : '#00ff00';
        ctx.fillRect(x, y, sqSz, sqSz);
      }
      // Row 3: gradient text
      const grad = ctx.createLinearGradient(0, rowH*2, W, rowH*2);
      grad.addColorStop(0,'#ff0000'); grad.addColorStop(0.5,'#00ff00'); grad.addColorStop(1,'#0000ff');
      ctx.fillStyle = grad; ctx.font = 'bold 32px "IBM Plex Mono",monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('GRADIENT TEXT — SHARP = 4:4:4 / BLURRY = 4:2:2', W/2, rowH*2.5);
    };
    draw();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>4:4:4 = <span style={{color:'#00ff88'}}>Sharp text</span></span>
          <span style={{color:'#555'}}>4:2:2 = <span style={{color:'#ff4444'}}>Blurry colored text</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', color: '#555', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>
        If colored text appears blurry or has color fringing, your connection is using 4:2:2 chroma subsampling. Switch to full RGB or 4:4:4 mode in your GPU/display settings.
      </div>
    </div>
  );
}
