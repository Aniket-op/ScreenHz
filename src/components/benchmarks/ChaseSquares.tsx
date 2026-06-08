import React, { useState, useEffect, useRef } from 'react';

export default function ChaseSquares() {
  const [gridSize, setGridSize] = useState(8);
  const [speed, setSpeed] = useState(144);
  const [pattern, setPattern] = useState<'sequential'|'random'|'spiral'>('sequential');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indexRef = useRef(0);
  const lastStepRef = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let animId: number;
    const total = gridSize * gridSize;
    let order: number[] = [];
    if (pattern==='sequential') order=Array.from({length:total},(_,i)=>i);
    else if (pattern==='random') order=Array.from({length:total},(_,i)=>i).sort(()=>Math.random()-0.5);
    else {
      // spiral order
      const grid=Array.from({length:gridSize},()=>Array(gridSize).fill(-1));
      let top=0,bot=gridSize-1,left=0,right=gridSize-1,idx=0;
      while(top<=bot&&left<=right){
        for(let i=left;i<=right;i++)grid[top][i]=idx++;
        top++;
        for(let i=top;i<=bot;i++)grid[i][right]=idx++;
        right--;
        if(top<=bot){for(let i=right;i>=left;i--)grid[bot][i]=idx++;bot--;}
        if(left<=right){for(let i=bot;i>=top;i--)grid[i][left]=idx++;left++;}
      }
      order=Array(total);
      for(let r=0;r<gridSize;r++)for(let c=0;c<gridSize;c++)order[grid[r][c]]=r*gridSize+c;
    }
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W=canvas.width, H=canvas.height;
      if (now - lastStepRef.current >= 1000/speed) {
        indexRef.current = (indexRef.current+1)%total;
        lastStepRef.current = now;
      }
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      const cellW=W/gridSize, cellH=H/gridSize;
      const activeCell = order[indexRef.current];
      for (let i=0;i<total;i++) {
        const r=Math.floor(i/gridSize), c=i%gridSize;
        ctx.fillStyle = i===activeCell?'#ffffff':'#1a1a1a';
        ctx.fillRect(c*cellW+1, r*cellH+1, cellW-2, cellH-2);
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [gridSize, speed, pattern]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Grid: <span style={{color:'#e8e8e8'}}>{gridSize}×{gridSize}</span></span>
          <span style={{color:'#555'}}>Chase speed: <span style={{color:'#e8e8e8'}}>{speed} steps/s</span></span>
          <span style={{color:'#555'}}>Pattern: <span style={{color:'#e8e8e8'}}>{pattern}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>GRID SIZE</label>
          <select value={gridSize} onChange={e=>setGridSize(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[4,6,8,10,12,16].map(n=><option key={n} value={n}>{n}×{n}</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}/s</span></div>
          <input type="range" min={1} max={360} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        {(['sequential','random','spiral'] as const).map(p=><button key={p} onClick={()=>setPattern(p)} style={{background:'transparent',border:`1px solid ${pattern===p?'#e8e8e8':'#2a2a2a'}`,color:pattern===p?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{p}</button>)}
      </div>
    </div>
  );
}
