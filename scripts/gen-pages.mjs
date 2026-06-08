import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pagesDir = join(root, 'src', 'pages');
const benchDir = join(root, 'src', 'components', 'benchmarks');
const guidesDir = join(pagesDir, 'guides');

if (!existsSync(guidesDir)) mkdirSync(guidesDir, { recursive: true });

// ─── Shared helpers ────────────────────────────────────────────────────────────
const btn = (style = '') => `style="background:transparent;border:1px solid #2a2a2a;color:#555;padding:6px 14px;font-family:'IBM Plex Mono',monospace;font-size:12px;border-radius:4px;cursor:pointer;${style}"`;
const label = (text) => `<label style="color:#555;font-size:11px;font-family:'IBM Plex Mono',monospace;">${text}</label>`;
const select = (id, opts, defaultVal) => `<select id="${id}" style="background:#111;border:1px solid #2a2a2a;color:#e8e8e8;padding:4px 8px;font-family:'IBM Plex Mono',monospace;">${opts.map(o => `<option value="${o}" ${o == defaultVal ? 'selected' : ''}>${o}</option>`).join('')}</select>`;

const pageStyle = `display:flex;flex-direction:column;height:100vh;background:#0c0c0c;color:#e8e8e8;font-family:'IBM Plex Mono',monospace;`;
const navBar = (title) => `
    <div style="height:48px;border-bottom:1px solid #222;display:flex;align-items:center;padding:0 24px;flex-shrink:0;">
      <a href="/" style="color:#555;text-decoration:none;margin-right:16px;">← Back</a>
      <h1 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0;">${title}</h1>
    </div>`;

const statRow = (stats) => `
    <div style="height:48px;display:flex;align-items:center;justify-content:space-around;background:#111;border-top:1px solid #222;font-family:'IBM Plex Mono',monospace;font-size:13px;padding:0 16px;flex-shrink:0;">
      ${stats.map(s => `<span style="color:#555;">${s}</span>`).join('<span style="color:#222;">·</span>')}
    </div>`;

const controls = (items) => `
    <div style="padding:16px;background:#111;border-top:1px solid #222;display:flex;flex-wrap:wrap;gap:16px;align-items:center;flex-shrink:0;">
      ${items}
    </div>`;

const seoArticle = (h2, body) => `
    <section style="padding:32px 24px;max-width:800px;margin:0 auto;line-height:1.7;color:#e8e8e8;">
      <h2 style="font-size:18px;margin-bottom:16px;">${h2}</h2>
      ${body}
    </section>`;

// ─── Astro page template ────────────────────────────────────────────────────────
function astroPage({ slug, component, title, description, canvasSlot, controlsSlot, statSlot, articleH2, articleBody, jsonLdFeatures }) {
  const importLine = component ? `import ${component} from '../components/benchmarks/${component}.tsx';` : '';
  const componentTag = component ? `<${component} client:load />` : canvasSlot || '';

  return `---
import Base from '../layouts/Base.astro';
${importLine}

const title = "${title}";
const description = "${description}";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": title,
  "url": "https://screenhz.com/${slug}",
  "description": description,
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web Browser",
  "featureList": [${(jsonLdFeatures || ['Interactive canvas benchmark']).map(f => `"${f}"`).join(', ')}],
  "offers": { "@type": "Offer", "price": "0" }
};
---

<Base title={title} description={description} jsonLd={jsonLd}>
  <div style="${pageStyle}">
    ${navBar(title)}
    <div style="flex-grow:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;">
      ${componentTag}
    </div>
    ${seoArticle(articleH2, articleBody)}
  </div>
</Base>
`;
}

// ─── React canvas component template ───────────────────────────────────────────
function canvasComponent({ name, imports, state, setupEffect, drawFn, statRow: sr, ctrlsJsx, rafLoop }) {
  return `import React, { useState, useEffect, useRef, useCallback } from 'react';
${imports || ''}

export default function ${name}() {
${state || ''}

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || 800;
      canvas.height = canvas.parentElement?.offsetHeight || 400;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

${setupEffect || ''}

  // Main rAF loop
  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      ${rafLoop}
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [${rafLoop.match(/\b(?:speed|dutyCycle|frequency|running|phase|spokeCount|trailCount|gridSize|gtgMs|hz|lineThickness|overdrive|persistence|scanlines|resolution|deintMode|waveform|hiLevel|loLevel|patternIndex)\b/g)?.filter((v,i,a) => a.indexOf(v)===i).join(', ') || ''}]);

  const STAT_ROW_HEIGHT = 48;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        {/* Stat row overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: STAT_ROW_HEIGHT, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
          ${sr}
        </div>
      </div>
      {/* Controls */}
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', flexShrink: 0 }}>
        ${ctrlsJsx}
      </div>
    </div>
  );
}
`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Generate all pages
// ══════════════════════════════════════════════════════════════════════════════

// ─── PAGE 6: BFI Test ─────────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'BFITest.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function BFITest() {
  const [dutyCycle, setDutyCycle] = useState(50);
  const [speed, setSpeed] = useState(480);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let pos = 0; let lastTime = performance.now(); let frame = 0; let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height, halfW = W / 2;
      const dt = now - lastTime; lastTime = now;
      pos = (pos + speed * dt / 1000) % (W + 60);
      frame++;
      const isBlackFrame = (frame % 2 === 0) && ((frame % 2) / 2 * 100 > dutyCycle);

      // Left: normal
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, halfW, H);
      const lx = (pos % halfW) - 30;
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(lx, H/2 - 20, 60, 40);

      // Divider
      ctx.fillStyle = '#222'; ctx.fillRect(halfW, 0, 1, H);

      // Right: BFI
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(halfW + 1, 0, halfW - 1, H);
      const showFrame = Math.floor(now / (1000 / 60)) % 100 < dutyCycle;
      if (showFrame) {
        const rx = (pos % halfW) - 30;
        ctx.fillStyle = '#e8e8e8'; ctx.fillRect(halfW + 1 + rx, H/2 - 20, 60, 40);
      }

      // Labels
      ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillText('NORMAL', 8, 16);
      ctx.fillText('BFI ' + dutyCycle + '% duty', halfW + 8, 16);

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [dutyCycle, speed]);

  const brightness = Math.round(dutyCycle);
  const clarityGain = Math.round((100 - dutyCycle) * 0.4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Duty cycle: <span style={{color:'#e8e8e8'}}>{dutyCycle}%</span></span>
          <span style={{color:'#555'}}>Perceived brightness: <span style={{color:'#e8e8e8'}}>-{100-brightness}%</span></span>
          <span style={{color:'#555'}}>Motion clarity: <span style={{color:'#00ff88'}}>+{clarityGain}%</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>DUTY CYCLE</label>
            <span style={{color:'#e8e8e8',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>{dutyCycle}%</span>
          </div>
          <input type="range" min={10} max={90} value={dutyCycle} onChange={e=>setDutyCycle(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label>
            <span style={{color:'#e8e8e8',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>{speed} px/s</span>
          </div>
          <input type="range" min={60} max={1920} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
`);
console.log('✓ BFITest.tsx');

// ─── PAGE 7: Persistence of Vision ───────────────────────────────────────────
writeFileSync(join(benchDir, 'PersistenceTest.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function PersistenceTest() {
  const [speed, setSpeed] = useState(720);
  const [spokeCount, setSpokeCount] = useState(12);
  const [direction, setDirection] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);

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
      const dt = (now - lastTime) / 1000; lastTime = now;
      angleRef.current += direction * speed * dt * Math.PI / 180;
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H);
      const cx = W/2, cy = H/2, r = Math.min(W, H) * 0.4;
      ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1;
      for (let i = 0; i < spokeCount; i++) {
        const a = angleRef.current + (i / spokeCount) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      }
      // Hub
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, spokeCount, direction]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}°/s</span></span>
          <span style={{color:'#555'}}>Spokes: <span style={{color:'#e8e8e8'}}>{spokeCount}</span></span>
          <span style={{color:'#555'}}>Direction: <span style={{color:'#e8e8e8'}}>{direction > 0 ? 'CW' : 'CCW'}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED (°/s)</label>
            <span style={{color:'#e8e8e8',fontSize:11}}>{speed}</span>
          </div>
          <input type="range" min={0} max={3600} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPOKES</label>
          <input type="number" min={4} max={24} value={spokeCount} onChange={e=>setSpokeCount(+e.target.value)} style={{width:60,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        <button onClick={()=>setDirection(d=>-d)} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>
          Flip Direction
        </button>
      </div>
    </div>
  );
}
`);
console.log('✓ PersistenceTest.tsx');

// ─── PAGE 8: Eye Tracking Blur ────────────────────────────────────────────────
writeFileSync(join(benchDir, 'EyeTrackingBlur.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function EyeTrackingBlur() {
  const [speed, setSpeed] = useState(480);
  const [barSize, setBarSize] = useState(40);
  const [showRef, setShowRef] = useState(true);
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
      const dt = (now - lastTime) / 1000; lastTime = now;
      posRef.current = (posRef.current + speed * dt) % (W + barSize);
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H);
      // Moving bar
      const x = posRef.current - barSize;
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x, H/2 - barSize/2, barSize, barSize);
      // Static reference
      if (showRef) {
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1;
        ctx.strokeRect(16, H/2 - barSize/2, barSize, barSize);
        ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace';
        ctx.fillText('REF', 16 + barSize/2 - 12, H/2 + 4);
      }
      // Instruction
      ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Follow the moving bar with your eyes', W/2, H - 24);
      ctx.textAlign = 'left';
      // Estimated blur label
      const blurPx = (speed / 60).toFixed(1);
      ctx.fillStyle = '#555'; ctx.fillText('Est. blur at 60Hz: ~' + blurPx + 'px', 16, 20);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, barSize, showRef]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Est. blur: <span style={{color:'#e8e8e8'}}>{(speed/60).toFixed(1)}px</span></span>
          <span style={{color:'#555'}}>Bar size: <span style={{color:'#e8e8e8'}}>{barSize}px</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={2000} step={10} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>BAR SIZE</label><span style={{color:'#e8e8e8',fontSize:11}}>{barSize}px</span></div>
          <input type="range" min={10} max={120} value={barSize} onChange={e=>setBarSize(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <button onClick={()=>setShowRef(s=>!s)} style={{background:'transparent',border:\`1px solid \${showRef?'#e8e8e8':'#2a2a2a'}\`,color:showRef?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>
          {showRef ? 'Hide Reference' : 'Show Reference'}
        </button>
      </div>
    </div>
  );
}
`);
console.log('✓ EyeTrackingBlur.tsx');

// ─── PAGE 9: Phantom Array ────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'PhantomArray.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function PhantomArray() {
  const [trailCount, setTrailCount] = useState(6);
  const [fadeTime, setFadeTime] = useState(80);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailsRef = useRef<{x:number;y:number;t:number}[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const cy = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
      trailsRef.current.push({ x: (cx - rect.left) * (canvas.width / rect.width), y: (cy - rect.top) * (canvas.height / rect.height), t: performance.now() });
      if (trailsRef.current.length > 200) trailsRef.current.shift();
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove as any, { passive: true });
    return () => { canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('touchmove', onMove as any); };
  }, []);

  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H);
      // Filter recent trails
      const cutoff = now - fadeTime * trailCount;
      const recent = trailsRef.current.filter(t => t.t > cutoff);
      for (let i = 0; i < recent.length; i++) {
        const age = now - recent[i].t;
        const alpha = Math.max(0, 1 - age / (fadeTime * trailCount));
        ctx.fillStyle = \`rgba(232,232,232,\${alpha.toFixed(2)})\`;
        ctx.fillRect(recent[i].x - 8, recent[i].y - 8, 16, 16);
      }
      // Crosshair
      if (recent.length > 0) {
        const last = recent[recent.length - 1];
        ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(last.x - 12, last.y); ctx.lineTo(last.x + 12, last.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(last.x, last.y - 12); ctx.lineTo(last.x, last.y + 12); ctx.stroke();
      }
      ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Move your mouse to test', W/2, H - 24);
      ctx.textAlign = 'left';
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [trailCount, fadeTime]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Trail length: <span style={{color:'#e8e8e8'}}>{trailCount}</span></span>
          <span style={{color:'#555'}}>Fade time: <span style={{color:'#e8e8e8'}}>{fadeTime}ms</span></span>
          <span style={{color:'#555'}}>Move your mouse to test</span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>TRAIL COUNT</label><span style={{color:'#e8e8e8',fontSize:11}}>{trailCount}</span></div>
          <input type="range" min={2} max={12} value={trailCount} onChange={e=>setTrailCount(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>FADE TIME (ms)</label><span style={{color:'#e8e8e8',fontSize:11}}>{fadeTime}ms</span></div>
          <input type="range" min={20} max={300} step={10} value={fadeTime} onChange={e=>setFadeTime(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
`);
console.log('✓ PhantomArray.tsx');

// ─── PAGE 10: Stutter & Tearing ───────────────────────────────────────────────
writeFileSync(join(benchDir, 'StutterTearing.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function StutterTearing() {
  const [speed, setSpeed] = useState(960);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);
  const deltasRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const [stutterCount, setStutterCount] = useState(0);
  const [variance, setVariance] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let stutters = 0; let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const dt = now - lastTimeRef.current; lastTimeRef.current = now;
      deltasRef.current.push(dt);
      if (deltasRef.current.length > 60) deltasRef.current.shift();
      posRef.current = (posRef.current + speed * dt / 1000) % (W + 8);
      if (dt > 25) stutters++;

      const chartH = Math.min(80, H * 0.3);
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H - chartH);
      // Moving bar
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(posRef.current - 4, 0, 8, H - chartH);
      // Frame chart
      ctx.fillStyle = '#111'; ctx.fillRect(0, H - chartH, W, chartH);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, H - chartH); ctx.lineTo(W, H - chartH); ctx.stroke();
      const mean = deltasRef.current.reduce((a,b)=>a+b,0) / (deltasRef.current.length||1);
      const barW = W / 60;
      deltasRef.current.forEach((d, i) => {
        const isStutter = d > mean * 1.5;
        ctx.fillStyle = isStutter ? '#ff4444' : '#e8e8e8';
        const bh = Math.min(chartH - 4, (d / 33.3) * (chartH - 4));
        ctx.fillRect(i * barW, H - bh - 2, barW - 1, bh);
      });
      // Hairline at expected
      const expectedY = H - ((mean / 33.3) * (chartH - 4)) - 2;
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, expectedY); ctx.lineTo(W, expectedY); ctx.stroke();

      if (now % 500 < 20) {
        setStutterCount(s => s + stutters); stutters = 0;
        const v = deltasRef.current.length > 1 ? Math.sqrt(deltasRef.current.reduce((s,d)=>s+(d-mean)**2,0)/deltasRef.current.length) : 0;
        setVariance(+v.toFixed(2));
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Stutter events: <span style={{color: stutterCount>0?'#ff4444':'#00ff88'}}>{stutterCount}</span></span>
          <span style={{color:'#555'}}>Frame variance: <span style={{color:'#e8e8e8'}}>{variance}ms</span></span>
          <span style={{color:'#555'}}>Status: <span style={{color: stutterCount>0?'#ff4444':'#00ff88'}}>{stutterCount>0?'⚠ Stutter':'✓ Clean'}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={3840} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <button onClick={()=>setStutterCount(0)} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>Reset Counter</button>
      </div>
    </div>
  );
}
`);
console.log('✓ StutterTearing.tsx');

// ─── PAGE 11: VRR Simulation ──────────────────────────────────────────────────
writeFileSync(join(benchDir, 'VRRSimulation.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function VRRSimulation() {
  const [mode, setMode] = useState<'sweep'|'fixed'|'stress'>('sweep');
  const [fixedFps, setFixedFps] = useState(60);
  const [speed, setSpeed] = useState(480);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);
  const deltasRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const [currentFps, setCurrentFps] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let animId: number; let sweepT = 0;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const dt = now - lastTimeRef.current; lastTimeRef.current = now;
      sweepT += dt / 1000;
      deltasRef.current.push(dt);
      if (deltasRef.current.length > 60) deltasRef.current.shift();
      posRef.current = (posRef.current + speed * dt / 1000) % (W + 60);
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H);
      // Object
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(posRef.current - 30, H/2 - 20, 60, 40);
      // Sparkline at bottom
      const sparkH = 48, sparkY = H - sparkH - 52;
      ctx.fillStyle = '#111'; ctx.fillRect(0, sparkY, W, sparkH);
      const mean = deltasRef.current.reduce((a,b)=>a+b,0) / (deltasRef.current.length||1);
      const barW = W / 60;
      deltasRef.current.forEach((d,i) => {
        const bh = Math.min(sparkH - 2, (d / 33.3) * (sparkH - 2));
        ctx.fillStyle = '#555'; ctx.fillRect(i*barW, sparkY + sparkH - bh, barW-1, bh);
      });
      // FPS label
      const fps = mean > 0 ? Math.round(1000/mean) : 0;
      ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace';
      ctx.fillText('FPS: ' + fps, 8, 20);
      ctx.fillText('VRR Range: 48–165', 8, 34);
      if (now % 200 < 20) setCurrentFps(fps);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [mode, fixedFps, speed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Current FPS: <span style={{color:'#00ff88'}}>{currentFps}</span></span>
          <span style={{color:'#555'}}>VRR Range: <span style={{color:'#e8e8e8'}}>48–165</span></span>
          <span style={{color:'#555'}}>Mode: <span style={{color:'#e8e8e8'}}>{mode}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        {(['sweep','fixed','stress'] as const).map(m=>(
          <button key={m} onClick={()=>setMode(m)} style={{background:'transparent',border:\`1px solid \${mode===m?'#e8e8e8':'#2a2a2a'}\`,color:mode===m?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{m}</button>
        ))}
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={1920} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
`);
console.log('✓ VRRSimulation.tsx');

// ─── PAGE 12: Resolution Scaling ─────────────────────────────────────────────
writeFileSync(join(benchDir, 'ResolutionScaling.tsx'), `import React, { useState, useEffect, useRef } from 'react';

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
          <button key={p} onClick={()=>setPattern(p)} style={{background:'transparent',border:\`1px solid \${pattern===p?'#e8e8e8':'#2a2a2a'}\`,color:pattern===p?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{p}</button>
        ))}
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>DISPLAY SIZE (inches)</label>
          <input type="number" min={10} max={100} value={ppiIn} onChange={e=>setPpiIn(+e.target.value)} style={{width:80,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
      </div>
    </div>
  );
}
`);
console.log('✓ ResolutionScaling.tsx');

// ─── PAGE 13: Chroma Subsampling ──────────────────────────────────────────────
writeFileSync(join(benchDir, 'ChromaSubsampling.tsx'), `import React, { useEffect, useRef } from 'react';

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
`);
console.log('✓ ChromaSubsampling.tsx');

// ─── PAGE 14: HDR Test ────────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'HDRTest.tsx'), `import React, { useState, useEffect, useRef } from 'react';

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
          ctx.fillStyle = \`rgb(\${v},\${v},\${v})\`;
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
          <button key={p} onClick={()=>setPat(p)} style={{background:'transparent',border:\`1px solid \${pat===p?'#e8e8e8':'#2a2a2a'}\`,color:pat===p?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{p}</button>
        ))}
      </div>
    </div>
  );
}
`);
console.log('✓ HDRTest.tsx');

// ─── PAGE 16: Local Dimming ───────────────────────────────────────────────────
writeFileSync(join(benchDir, 'LocalDimming.tsx'), `import React, { useState, useEffect, useRef } from 'react';

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
      ctx.fillText(\`APL: \${apl}%  Size: \${boxSize}×\${boxSize}px\`, 8, 16);
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
        {(['static','moving'] as const).map(m=><button key={m} onClick={()=>setMode(m)} style={{background:'transparent',border:\`1px solid \${mode===m?'#e8e8e8':'#2a2a2a'}\`,color:mode===m?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{m}</button>)}
        {(['black','dimgrey'] as const).map(b=><button key={b} onClick={()=>setBg(b)} style={{background:'transparent',border:\`1px solid \${bg===b?'#e8e8e8':'#2a2a2a'}\`,color:bg===b?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{b}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ LocalDimming.tsx');

// ─── PAGE 17: MPRT Test ───────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'MPRTTest.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function MPRTTest() {
  const [speed, setSpeed] = useState(960);
  const [showRef, setShowRef] = useState(true);
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
      const W = canvas.width, H = canvas.height, halfW = W/2;
      const dt = (now-lastTime)/1000; lastTime = now;
      posRef.current = (posRef.current + speed * dt) % (halfW + 40);
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(halfW,0); ctx.lineTo(halfW,H); ctx.stroke();
      // Left: blurred edge (MPRT sim — use alpha)
      ctx.fillStyle = '#111'; ctx.fillRect(0,0,halfW,H);
      const blurPx = Math.round(speed / 60);
      for (let b = blurPx; b >= 0; b--) {
        ctx.fillStyle = \`rgba(232,232,232,\${(1 - b/blurPx) * 0.9})\`;
        ctx.fillRect((posRef.current % halfW) - b, H/2-30, 8, 60);
      }
      // Right: sharp static reference
      if (showRef) {
        ctx.fillStyle = '#e8e8e8'; ctx.fillRect(halfW + halfW/2 - 4, H/2-30, 8, 60);
      }
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText('MPRT (blurred)', 8, 16);
      if(showRef) ctx.fillText('Reference (sharp)', halfW+8, 16);
      const mprt = (1/60*1000 + blurPx/60*1000/10).toFixed(1);
      ctx.fillText(\`Blur width: ~\${blurPx}px  Est. MPRT: \${mprt}ms\`, 8, H-8);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, showRef]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Blur: <span style={{color:'#e8e8e8'}}>{Math.round(speed/60)}px</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={3840} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <button onClick={()=>setShowRef(s=>!s)} style={{background:'transparent',border:\`1px solid \${showRef?'#e8e8e8':'#2a2a2a'}\`,color:showRef?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{showRef?'Hide Reference':'Show Reference'}</button>
      </div>
    </div>
  );
}
`);
console.log('✓ MPRTTest.tsx');

// ─── PAGE 18: Color Ghosting ──────────────────────────────────────────────────
writeFileSync(join(benchDir, 'ColorGhosting.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function ColorGhosting() {
  const [speed, setSpeed] = useState(960);
  const [objSize, setObjSize] = useState(40);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef([0,80,160,240]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth || 800; canvas.height = canvas.parentElement?.offsetHeight || 400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime = performance.now(); let animId: number;
    const colors = ['#ff3333','#33ff33','#3333ff','#ffffff'];
    const labels = ['Red','Green','Blue','White'];
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const dt = (now-lastTime)/1000; lastTime=now;
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0,0,W,H);
      const rowH = H / 4;
      colors.forEach((c, i) => {
        posRef.current[i] = (posRef.current[i] + speed * dt) % (W + objSize);
        const y = i * rowH;
        ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, y, W, rowH);
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y+rowH-1); ctx.lineTo(W, y+rowH-1); ctx.stroke();
        ctx.fillStyle = c; ctx.fillRect(posRef.current[i] - objSize, y + rowH/2 - objSize/2, objSize, objSize);
        ctx.fillStyle = '#555'; ctx.font = '11px "IBM Plex Mono",monospace';
        ctx.fillText(labels[i], 8, y + 16);
      });
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, objSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Trailing color fringe = panel ghosting</span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={3840} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:120}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>OBJECT SIZE</label><span style={{color:'#e8e8e8',fontSize:11}}>{objSize}px</span></div>
          <input type="range" min={10} max={120} value={objSize} onChange={e=>setObjSize(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
`);
console.log('✓ ColorGhosting.tsx');

// ─── PAGE 19: Black Levels ────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'BlackLevels.tsx'), `import React, { useState, useEffect, useRef } from 'react';

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
        ctx.fillStyle = \`rgb(\${v},\${v},\${v})\`; ctx.fillRect(i*sw, 0, sw, H/2);
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
        <button onClick={()=>setShowRef(s=>!s)} style={{background:'transparent',border:\`1px solid \${showRef?'#e8e8e8':'#2a2a2a'}\`,color:showRef?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{showRef?'Hide PLUGE':'Show PLUGE'}</button>
      </div>
    </div>
  );
}
`);
console.log('✓ BlackLevels.tsx');

// ─── PAGE 20: White Levels ────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'WhiteLevels.tsx'), `import React, { useState, useEffect, useRef } from 'react';

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
        ctx.fillStyle = \`rgb(\${v},\${v},\${v})\`; ctx.fillRect(i*sw, 0, sw, H/2);
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
        <button onClick={()=>setShowChecker(s=>!s)} style={{background:'transparent',border:\`1px solid \${showChecker?'#e8e8e8':'#2a2a2a'}\`,color:showChecker?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{showChecker?'Hide Checker':'Show Checker'}</button>
      </div>
    </div>
  );
}
`);
console.log('✓ WhiteLevels.tsx');

// ─── PAGE 21: Moving Line ─────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'MovingLine.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function MovingLine() {
  const [speed, setSpeed] = useState(480);
  const [thickness, setThickness] = useState(1);
  const [dir, setDir] = useState<'h'|'v'>('h');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.parentElement?.offsetWidth||800; canvas.height = canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime = performance.now(); let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const dt = (now-lastTime)/1000; lastTime=now;
      const limit = dir==='h' ? W : H;
      posRef.current = (posRef.current + speed*dt) % (limit+thickness);
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      if (dir==='h') ctx.fillRect(posRef.current-thickness, 0, thickness, H);
      else ctx.fillRect(0, posRef.current-thickness, W, thickness);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, thickness, dir]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Multiple dashes = PWM flicker detected</span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={50} max={2000} step={10} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>THICKNESS</label>
          <input type="number" min={1} max={4} value={thickness} onChange={e=>setThickness(+e.target.value)} style={{width:48,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        {(['h','v'] as const).map(d=><button key={d} onClick={()=>setDir(d)} style={{background:'transparent',border:\`1px solid \${dir===d?'#e8e8e8':'#2a2a2a'}\`,color:dir===d?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{d==='h'?'Horizontal':'Vertical'}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ MovingLine.tsx');

// ─── PAGE 22: Moving Photo ────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'MovingPhoto.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function MovingPhoto() {
  const [speed, setSpeed] = useState(480);
  const [density, setDensity] = useState<'low'|'medium'|'high'>('medium');
  const [dir, setDir] = useState<'left'|'right'>('left');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLCanvasElement | null>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth||800;
      canvas.height = canvas.parentElement?.offsetHeight||400;
      generateScene();
    };
    const generateScene = () => {
      const W = canvas.width, H = canvas.height;
      const sc = document.createElement('canvas'); sc.width = W*2; sc.height = H;
      const ctx = sc.getContext('2d'); if (!ctx) return;
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,W*2,H);
      const count = density==='low'?20:density==='medium'?60:120;
      for (let i=0;i<count;i++) {
        const x=Math.random()*W*2, y=Math.random()*H;
        const type=Math.floor(Math.random()*3);
        ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=1;
        if (type===0) { ctx.strokeRect(x,y,40+Math.random()*80,20+Math.random()*60); }
        else if (type===1) { ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.random()*120,y+Math.random()*120);ctx.stroke(); }
        else { ctx.font=\`\${8+Math.random()*16}px "IBM Plex Mono",monospace\`; ctx.fillStyle='#e8e8e8'; ctx.fillText('SCREENHZ',x,y); }
      }
      sceneRef.current = sc;
    };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, [density]);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W=canvas.width, H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      if (dir==='left') posRef.current = (posRef.current+speed*dt)%(W);
      else posRef.current = (posRef.current-speed*dt+W)%W;
      ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      if (sceneRef.current) {
        ctx.drawImage(sceneRef.current, -posRef.current, 0);
        ctx.drawImage(sceneRef.current, W-posRef.current, 0);
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [speed, dir]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Density: <span style={{color:'#e8e8e8'}}>{density}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={2000} step={10} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        {(['low','medium','high'] as const).map(d=><button key={d} onClick={()=>setDensity(d)} style={{background:'transparent',border:\`1px solid \${density===d?'#e8e8e8':'#2a2a2a'}\`,color:density===d?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{d}</button>)}
        {(['left','right'] as const).map(d=><button key={d} onClick={()=>setDir(d)} style={{background:'transparent',border:\`1px solid \${dir===d?'#e8e8e8':'#2a2a2a'}\`,color:dir===d?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{d}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ MovingPhoto.tsx');

// ─── PAGE 23: Chase Squares ───────────────────────────────────────────────────
writeFileSync(join(benchDir, 'ChaseSquares.tsx'), `import React, { useState, useEffect, useRef } from 'react';

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
        {(['sequential','random','spiral'] as const).map(p=><button key={p} onClick={()=>setPattern(p)} style={{background:'transparent',border:\`1px solid \${pattern===p?'#e8e8e8':'#2a2a2a'}\`,color:pattern===p?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{p}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ ChaseSquares.tsx');

// ─── PAGE 24: Aliasing ────────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'AliasingTest.tsx'), `import React, { useState, useEffect, useRef } from 'react';

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
        [8,9,10,11,12].forEach((sz,i)=>{ ctx.font=\`\${sz}px "IBM Plex Mono",monospace\`; ctx.fillText('ScreenHz Aliasing Test 01',16,40+i*22); });
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
        {(['diagonal','curves','text','subpixel'] as const).map(p=><button key={p} onClick={()=>setPat(p)} style={{background:'transparent',border:\`1px solid \${pat===p?'#e8e8e8':'#2a2a2a'}\`,color:pat===p?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{p}</button>)}
        <button onClick={()=>setAnimated(a=>!a)} style={{background:'transparent',border:\`1px solid \${animated?'#e8e8e8':'#2a2a2a'}\`,color:animated?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{animated?'Stop':'Animate'}</button>
      </div>
    </div>
  );
}
`);
console.log('✓ AliasingTest.tsx');

// ─── PAGE 27: Strobe Crosstalk ────────────────────────────────────────────────
writeFileSync(join(benchDir, 'StrobeCrosstalk.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function StrobeCrosstalk() {
  const [phase, setPhase] = useState(50);
  const [speed, setSpeed] = useState(480);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

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
      posRef.current=(posRef.current+speed*dt)%(W+60);
      ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      const x=posRef.current-30;
      const barH=60;
      // Main bar
      ctx.fillStyle='#e8e8e8'; ctx.fillRect(x,H/2-barH/2,60,barH);
      // Ghost due to phase misalignment
      const ghostOffset=(phase-50)*2;
      if (Math.abs(ghostOffset)>5) {
        const ghostAlpha=Math.abs(ghostOffset)/100*0.7;
        ctx.fillStyle=\`rgba(232,232,232,\${ghostAlpha.toFixed(2)})\`;
        ctx.fillRect(x,H/2-barH/2-ghostOffset,60,barH);
      }
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(\`Phase: \${phase}% — \${Math.abs(phase-50)<5?'Clean':'Crosstalk visible'}\`, 8, 16);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [phase, speed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Phase: <span style={{color:'#e8e8e8'}}>{phase}%</span></span>
          <span style={{color:'#555'}}>Crosstalk: <span style={{color:Math.abs(phase-50)<5?'#00ff88':'#ff4444'}}>{Math.abs(phase-50)<5?'Clean':'Visible'}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>STROBE PHASE</label><span style={{color:'#e8e8e8',fontSize:11}}>{phase}%</span></div>
          <input type="range" min={0} max={100} value={phase} onChange={e=>setPhase(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={60} max={1920} step={60} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
`);
console.log('✓ StrobeCrosstalk.tsx');

// ─── PAGE 28: Inversion Artifacts ────────────────────────────────────────────
writeFileSync(join(benchDir, 'InversionArtifacts.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function InversionArtifacts() {
  const [freq, setFreq] = useState(2);
  const [scanSpeed, setScanSpeed] = useState(60);
  const [animated, setAnimated] = useState(true);
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
      if(animated) scanRef.current=(scanRef.current+scanSpeed*dt)%W;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      const sq=freq;
      for(let y=0;y<H;y+=sq) for(let x=0;x<W;x+=sq){
        const inv=x<scanRef.current;
        const base=(Math.floor(x/sq)+Math.floor(y/sq))%2===0;
        ctx.fillStyle=(inv?!base:base)?'#e8e8e8':'#111';
        ctx.fillRect(x,y,sq,sq);
      }
      // Scan line
      ctx.strokeStyle='#ff4444'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(scanRef.current,0); ctx.lineTo(scanRef.current,H); ctx.stroke();
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [freq, scanSpeed, animated]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Pattern: <span style={{color:'#e8e8e8'}}>{freq}px checker</span></span>
          <span style={{color:'#555'}}>Scan speed: <span style={{color:'#e8e8e8'}}>{scanSpeed}px/s</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>CHECKER SIZE</label>
          <select value={freq} onChange={e=>setFreq(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[1,2,4,8,16].map(n=><option key={n} value={n}>{n}px</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SCAN SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{scanSpeed}px/s</span></div>
          <input type="range" min={10} max={480} value={scanSpeed} onChange={e=>setScanSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <button onClick={()=>setAnimated(a=>!a)} style={{background:'transparent',border:\`1px solid \${animated?'#e8e8e8':'#2a2a2a'}\`,color:animated?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{animated?'Pause':'Animate'}</button>
      </div>
    </div>
  );
}
`);
console.log('✓ InversionArtifacts.tsx');

// ─── PAGE 29: Scan-Out ────────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'ScanOut.tsx'), `import React, { useState, useEffect, useRef } from 'react';

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
        {(['h','v'] as const).map(d=><button key={d} onClick={()=>setOrientation(d)} style={{background:'transparent',border:\`1px solid \${orientation===d?'#e8e8e8':'#2a2a2a'}\`,color:orientation===d?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{d==='h'?'Horizontal':'Vertical'}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ ScanOut.tsx');

// ─── PAGE 30: Flicker Test ────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'FlickerTest.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function FlickerTest() {
  const [frequency, setFrequency] = useState(120);
  const [dutyCycle, setDutyCycle] = useState(50);
  const [hiLevel, setHiLevel] = useState(255);
  const [loLevel, setLoLevel] = useState(0);
  const [waveform, setWaveform] = useState<'square'|'sine'>('square');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);

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
      tRef.current+=dt;
      let brightness: number;
      if (waveform==='square') {
        const period=1/frequency;
        const phase=(tRef.current%period)/period;
        brightness=phase<dutyCycle/100?hiLevel:loLevel;
      } else {
        brightness=loLevel+(hiLevel-loLevel)*(0.5+0.5*Math.sin(2*Math.PI*frequency*tRef.current));
      }
      const v=Math.round(brightness);
      ctx.fillStyle=\`rgb(\${v},\${v},\${v})\`; ctx.fillRect(0,0,W,H);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [frequency, dutyCycle, hiLevel, loLevel, waveform]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Frequency: <span style={{color:'#e8e8e8'}}>{frequency}Hz</span></span>
          <span style={{color:'#555'}}>Duty: <span style={{color:'#e8e8e8'}}>{dutyCycle}%</span></span>
          <span style={{color:'#555'}}>Waveform: <span style={{color:'#e8e8e8'}}>{waveform}</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>FREQUENCY</label><span style={{color:'#e8e8e8',fontSize:11}}>{frequency}Hz</span></div>
          <input type="range" min={1} max={500} value={frequency} onChange={e=>setFrequency(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:120}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>DUTY CYCLE</label><span style={{color:'#e8e8e8',fontSize:11}}>{dutyCycle}%</span></div>
          <input type="range" min={1} max={99} value={dutyCycle} onChange={e=>setDutyCycle(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>HI</label>
            <input type="number" min={0} max={255} value={hiLevel} onChange={e=>setHiLevel(+e.target.value)} style={{width:56,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>LO</label>
            <input type="number" min={0} max={255} value={loLevel} onChange={e=>setLoLevel(+e.target.value)} style={{width:56,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
          </div>
        </div>
        {(['square','sine'] as const).map(w=><button key={w} onClick={()=>setWaveform(w)} style={{background:'transparent',border:\`1px solid \${waveform===w?'#e8e8e8':'#2a2a2a'}\`,color:waveform===w?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{w}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ FlickerTest.tsx');

// ─── PAGE 31: Calibration Patterns ───────────────────────────────────────────
writeFileSync(join(benchDir, 'CalibrationPatterns.tsx'), `import React, { useState, useEffect, useRef } from 'react';

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
        ctx.fillText(\`\${W}×\${H}\`, W/2, H/2);
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
        {patterns.map((p,i)=><button key={p} onClick={()=>setPatternIndex(i)} style={{background:'transparent',border:\`1px solid \${patternIndex===i?'#e8e8e8':'#2a2a2a'}\`,color:patternIndex===i?'#e8e8e8':'#555',padding:'6px 12px',fontFamily:"'IBM Plex Mono',monospace",fontSize:11,borderRadius:4,cursor:'pointer'}}>{p}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ CalibrationPatterns.tsx');

// ─── PAGE 32: CRT Simulator ───────────────────────────────────────────────────
writeFileSync(join(benchDir, 'CRTCanvas.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function CRTCanvas() {
  const [persistence, setPersistence] = useState<'fast'|'medium'|'slow'>('medium');
  const [scanGap, setScanGap] = useState(2);
  const [resolution, setResolution] = useState(480);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const decayMap={fast:0.05,medium:0.02,slow:0.008};
    const decay=decayMap[persistence];
    const loop = (now: number) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      // Fade existing
      ctx.fillStyle=\`rgba(0,0,0,\${decay*60})\`; ctx.fillRect(0,0,W,H);
      const linesPerFrame=Math.ceil(resolution*60*dt);
      for(let i=0;i<linesPerFrame;i++){
        const y=Math.floor(scanRef.current)*(H/resolution);
        const brightness=128+Math.random()*127;
        ctx.fillStyle=\`rgba(\${brightness},\${brightness*0.9},\${brightness*0.7},0.9)\`;
        ctx.fillRect(0,y,W,H/resolution-scanGap);
        scanRef.current=(scanRef.current+1)%resolution;
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animId);
  }, [persistence, scanGap, resolution]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'rgba(17,17,17,0.9)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
          <span style={{color:'#555'}}>Scanlines: <span style={{color:'#e8e8e8'}}>{resolution}</span></span>
          <span style={{color:'#555'}}>Persistence: <span style={{color:'#e8e8e8'}}>{persistence}</span></span>
          <span style={{color:'#555'}}>Gap: <span style={{color:'#e8e8e8'}}>{scanGap}px</span></span>
        </div>
      </div>
      <div style={{ padding: 16, background: '#111', borderTop: '1px solid #222', display: 'flex', flexWrap:'wrap', gap: 16, alignItems: 'center' }}>
        {(['fast','medium','slow'] as const).map(p=><button key={p} onClick={()=>setPersistence(p)} style={{background:'transparent',border:\`1px solid \${persistence===p?'#e8e8e8':'#2a2a2a'}\`,color:persistence===p?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{p}</button>)}
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>RESOLUTION</label>
          <select value={resolution} onChange={e=>setResolution(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[240,480,1080].map(n=><option key={n} value={n}>{n}p</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SCAN GAP</label>
          <input type="number" min={0} max={8} value={scanGap} onChange={e=>setScanGap(+e.target.value)} style={{width:48,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
      </div>
    </div>
  );
}
`);
console.log('✓ CRTCanvas.tsx');

// ─── PAGE 33: LCD Pixel Response ─────────────────────────────────────────────
writeFileSync(join(benchDir, 'LCDPixelResponse.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function LCDPixelResponse() {
  const [showOvershoot, setShowOvershoot] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(1);
  const [mode, setMode] = useState<'underdrive'|'normal'|'overdrive'>('normal');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const configs=[{gtg:1,label:'1ms GtG'},{gtg:4,label:'4ms GtG'},{gtg:16,label:'16ms GtG'}];
    const overshootMap={underdrive:0,normal:0.1,overdrive:0.3};
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000*animSpeed; lastTime=now;
      tRef.current=(tRef.current+dt)%2;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      const panelW=W/3;
      configs.forEach(({gtg,label},i)=>{
        const x=i*panelW;
        const t=tRef.current;
        // Transition: 0->1 in first half of cycle
        const phaseFrac=t<1?t:2-t; // 0..1..0
        const transitionFrac=Math.min(1,phaseFrac/(gtg/1000));
        const eased=1-Math.pow(1-transitionFrac,2);
        const overshoot=showOvershoot?overshootMap[mode]:0;
        const brightness=Math.min(1+overshoot,eased+overshoot*Math.max(0,1-transitionFrac*3));
        // Draw waveform
        const graphH=H*0.6,graphY=H*0.2;
        ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=1;
        ctx.strokeRect(x+8,graphY,panelW-16,graphH);
        // Draw response curve
        ctx.strokeStyle='#00ff88'; ctx.lineWidth=2;
        ctx.beginPath();
        const steps=100;
        for(let s=0;s<=steps;s++){
          const st=s/steps;
          const sf=st<0.5?st*2:2-st*2;
          const sf2=Math.min(1,sf/(gtg/1000));
          const se=1-Math.pow(1-sf2,2);
          const sb=Math.min(1+overshoot,se+overshoot*Math.max(0,1-sf2*3));
          const px=x+8+(s/steps)*(panelW-16);
          const py=graphY+graphH-(Math.min(1,sb)*graphH);
          s===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
        }
        ctx.stroke();
        // Hairline at 100%
        ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(x+8,graphY); ctx.lineTo(x+panelW-8,graphY); ctx.stroke();
        ctx.setLineDash([]);
        // Label
        ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(label,x+panelW/2,graphY+graphH+20);
        // Live pixel
        const pxSize=32;
        ctx.fillStyle=\`rgb(\${Math.round(brightness*232)},\${Math.round(brightness*232)},\${Math.round(brightness*232)})\`;
        ctx.fillRect(x+panelW/2-pxSize/2,graphY+graphH+36,pxSize,pxSize);
      });
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[showOvershoot,animSpeed,mode]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>1ms GtG</span><span style={{color:'#555'}}>4ms GtG</span><span style={{color:'#555'}}>16ms GtG</span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <button onClick={()=>setShowOvershoot(s=>!s)} style={{background:'transparent',border:\`1px solid \${showOvershoot?'#e8e8e8':'#2a2a2a'}\`,color:showOvershoot?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{showOvershoot?'Hide Overshoot':'Show Overshoot'}</button>
        {(['underdrive','normal','overdrive'] as const).map(m=><button key={m} onClick={()=>setMode(m)} style={{background:'transparent',border:\`1px solid \${mode===m?'#e8e8e8':'#2a2a2a'}\`,color:mode===m?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{m}</button>)}
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:140}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>ANIM SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{animSpeed}x</span></div>
          <input type="range" min={0.1} max={3} step={0.1} value={animSpeed} onChange={e=>setAnimSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
`);
console.log('✓ LCDPixelResponse.tsx');

// ─── PAGE 34: Color Rainbow ───────────────────────────────────────────────────
writeFileSync(join(benchDir, 'ColorRainbow.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function ColorRainbow() {
  const [speed, setSpeed] = useState(1920);
  const [bg, setBg] = useState<'black'|'grey'|'white'>('black');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const bgMap={black:'#000',grey:'#555',white:'#fff'};
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      posRef.current=(posRef.current+speed*dt)%(W+W);
      ctx.fillStyle=bgMap[bg]; ctx.fillRect(0,0,W,H);
      // Sharp vertical edge: black left, white right — moving
      const ex=posRef.current-W;
      if(ex>-W&&ex<W){
        ctx.fillStyle='#000'; ctx.fillRect(0,0,Math.max(0,ex),H);
        ctx.fillStyle='#fff'; ctx.fillRect(Math.max(0,ex),0,W-Math.max(0,ex),H);
      }
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(\`Speed: \${speed}px/s — RGB fringing visible at periphery at high speed\`,8,16);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[speed,bg]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Effect visible at <span style={{color:'#e8e8e8'}}>&gt;800px/s</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={120} max={3840} step={120} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        {(['black','grey','white'] as const).map(b=><button key={b} onClick={()=>setBg(b)} style={{background:'transparent',border:\`1px solid \${bg===b?'#e8e8e8':'#2a2a2a'}\`,color:bg===b?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{b}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ ColorRainbow.tsx');

// ─── PAGE 35: Video Interlacing ───────────────────────────────────────────────
writeFileSync(join(benchDir, 'VideoInterlacing.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function VideoInterlacing() {
  const [motionSpeed, setMotionSpeed] = useState(240);
  const [deintMode, setDeintMode] = useState<'none'|'bob'|'blend'>('none');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);
  const field = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height,halfW=W/2;
      const dt=(now-lastTime)/1000; lastTime=now;
      field.current=field.current^1;
      posRef.current=(posRef.current+motionSpeed*dt)%(halfW+40);
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      // Divider
      ctx.strokeStyle='#333'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(halfW,0); ctx.lineTo(halfW,H); ctx.stroke();
      // LEFT: interlaced
      for(let y=field.current;y<H;y+=2){
        ctx.fillStyle='#111'; ctx.fillRect(0,y,halfW,1);
      }
      const lx=posRef.current-20;
      if(deintMode==='none'){
        // Draw only one field
        for(let dy=0;dy<40;dy+=2) ctx.fillStyle='#e8e8e8',ctx.fillRect(lx,H/2-20+dy+field.current,40,1);
      } else if(deintMode==='bob'){
        ctx.fillStyle='#e8e8e8'; ctx.fillRect(lx,H/2-20,40,40);
      } else {
        ctx.fillStyle='rgba(232,232,232,0.5)'; ctx.fillRect(lx,H/2-20,40,40);
        ctx.fillStyle='rgba(232,232,232,0.5)'; ctx.fillRect(lx,H/2-21,40,40);
      }
      // RIGHT: progressive
      ctx.fillStyle='#e8e8e8'; ctx.fillRect(halfW+posRef.current-20,H/2-20,40,40);
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText('Interlaced 30i',8,16); ctx.fillText('Progressive 60p',halfW+8,16);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[motionSpeed,deintMode]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Left: <span style={{color:'#e8e8e8'}}>Interlaced 30i</span></span>
          <span style={{color:'#555'}}>Right: <span style={{color:'#e8e8e8'}}>Progressive 60p</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{motionSpeed}px/s</span></div>
          <input type="range" min={30} max={960} step={30} value={motionSpeed} onChange={e=>setMotionSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        {(['none','bob','blend'] as const).map(d=><button key={d} onClick={()=>setDeintMode(d)} style={{background:'transparent',border:\`1px solid \${deintMode===d?'#e8e8e8':'#2a2a2a'}\`,color:deintMode===d?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{d}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ VideoInterlacing.tsx');

// ─── PAGE 36: GtG vs MPRT ────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'GtGvsMPRT.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function GtGvsMPRT() {
  const [gtgMs, setGtgMs] = useState(4);
  const [hz, setHz] = useState(165);
  const [speed, setSpeed] = useState(960);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height,halfW=W/2;
      const dt=(now-lastTime)/1000; lastTime=now;
      posRef.current=(posRef.current+speed*dt)%(halfW+40);
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#333'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(halfW,0); ctx.lineTo(halfW,H); ctx.stroke();
      // Left: MPRT blur (full frame persistence)
      const refreshMs=1000/hz;
      const mprt=refreshMs+gtgMs;
      const mprtBlurPx=speed*(mprt/1000);
      for(let b=Math.ceil(mprtBlurPx);b>=0;b--){
        ctx.fillStyle=\`rgba(232,232,232,\${(1-b/mprtBlurPx)*0.8})\`;
        ctx.fillRect(posRef.current-20-b,H/2-20,40,40);
      }
      // Right: GtG only (sharper)
      const gtgBlurPx=speed*(gtgMs/1000);
      for(let b=Math.ceil(gtgBlurPx);b>=0;b--){
        ctx.fillStyle=\`rgba(232,232,232,\${(1-b/gtgBlurPx)*0.8})\`;
        ctx.fillRect(halfW+posRef.current-20-b,H/2-20,40,40);
      }
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(\`MPRT: \${mprt.toFixed(1)}ms (\${Math.round(mprtBlurPx)}px blur)\`,8,16);
      ctx.fillText(\`GtG: \${gtgMs}ms (\${Math.round(gtgBlurPx)}px blur)\`,halfW+8,16);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[gtgMs,hz,speed]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>GtG: <span style={{color:'#e8e8e8'}}>{gtgMs}ms</span></span>
          <span style={{color:'#555'}}>Refresh: <span style={{color:'#e8e8e8'}}>{(1000/hz).toFixed(2)}ms ({hz}Hz)</span></span>
          <span style={{color:'#555'}}>MPRT: <span style={{color:'#e8e8e8'}}>{(1000/hz+gtgMs).toFixed(2)}ms</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:140}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>GTG (ms)</label><span style={{color:'#e8e8e8',fontSize:11}}>{gtgMs}ms</span></div>
          <input type="range" min={0} max={20} step={0.5} value={gtgMs} onChange={e=>setGtgMs(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>REFRESH RATE</label>
          <select value={hz} onChange={e=>setHz(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[60,75,90,120,144,165,240,360].map(n=><option key={n} value={n}>{n}Hz</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:140}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={120} max={3840} step={120} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
      </div>
    </div>
  );
}
`);
console.log('✓ GtGvsMPRT.tsx');

// ─── PAGE 37: Blur Busters Law ────────────────────────────────────────────────
writeFileSync(join(benchDir, 'BlurBustersLaw.tsx'), `import React, { useState, useEffect, useRef } from 'react';
import { useHz } from '../../lib/hz-detector';

export default function BlurBustersLaw() {
  const { hz: detectedHz } = useHz();
  const [velocity, setVelocity] = useState(960);
  const [hz, setHz] = useState(165);
  const [showFormula, setShowFormula] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(()=>{ if(detectedHz>0) setHz(detectedHz); },[detectedHz]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      posRef.current=(posRef.current+velocity*dt)%(W+60);
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      const blurPx=velocity/(hz);
      // Blur trail
      ctx.fillStyle='rgba(232,232,232,0.15)';
      ctx.fillRect(posRef.current-60-blurPx,H/2-20,blurPx,40);
      // Object
      ctx.fillStyle='#e8e8e8'; ctx.fillRect(posRef.current-30,H/2-20,60,40);
      if(showFormula){
        ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
        ctx.fillText(\`Blur = velocity / Hz = \${velocity} / \${hz} = \${blurPx.toFixed(1)}px\`,8,16);
        ctx.fillText(\`Refresh period: \${(1000/hz).toFixed(2)}ms\`,8,30);
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[velocity,hz,showFormula]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Blur: <span style={{color:'#e8e8e8'}}>{(velocity/hz).toFixed(1)}px</span></span>
          <span style={{color:'#555'}}>At: <span style={{color:'#e8e8e8'}}>{velocity}px/s ÷ {hz}Hz</span></span>
          <span style={{color:'#555'}}>Your display: <span style={{color:'#00ff88'}}>{detectedHz||hz}Hz</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:160}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>VELOCITY</label><span style={{color:'#e8e8e8',fontSize:11}}>{velocity}px/s</span></div>
          <input type="range" min={60} max={3840} step={60} value={velocity} onChange={e=>setVelocity(+e.target.value)} style={{width:'100%'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>Hz</label>
          <select value={hz} onChange={e=>setHz(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[60,75,90,120,144,165,240,360].map(n=><option key={n} value={n}>{n}Hz</option>)}
          </select>
        </div>
        <button onClick={()=>setShowFormula(s=>!s)} style={{background:'transparent',border:\`1px solid \${showFormula?'#e8e8e8':'#2a2a2a'}\`,color:showFormula?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{showFormula?'Hide Formula':'Show Formula'}</button>
      </div>
    </div>
  );
}
`);
console.log('✓ BlurBustersLaw.tsx');

// ─── PAGE 38: Scan-Out Skew ───────────────────────────────────────────────────
writeFileSync(join(benchDir, 'ScanOutSkew.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function ScanOutSkew() {
  const [speed, setSpeed] = useState(1920);
  const [dir, setDir] = useState<'h'|'v'>('h');
  const [objType, setObjType] = useState<'lines'|'grid'>('lines');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let lastTime=performance.now(); let animId: number;
    const skewFactor=0.3;
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=(now-lastTime)/1000; lastTime=now;
      posRef.current=(posRef.current+speed*dt)%(W+20);
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=1;
      if(objType==='lines'){
        for(let i=0;i<5;i++){
          const x=(posRef.current+i*40)%W;
          // Skew: each row offset slightly
          ctx.beginPath();
          for(let y=0;y<H;y+=4){
            const skewX=x+y*skewFactor*(dir==='h'?1:0);
            y===0?ctx.moveTo(skewX,y):ctx.lineTo(skewX,y);
          }
          ctx.stroke();
        }
      } else {
        const gridSz=40;
        for(let row=0;row<H/gridSz+1;row++){
          for(let col=0;col<W/gridSz+1;col++){
            const bx=(posRef.current+col*gridSz)%W;
            const by=row*gridSz;
            const skewX=bx+by*skewFactor;
            ctx.strokeRect(skewX,by,gridSz-1,gridSz-1);
          }
        }
      }
      const tiltDeg=(Math.atan(skewFactor)*180/Math.PI).toFixed(1);
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(\`Tilt: ~\${tiltDeg}°  Speed: \${speed}px/s  Scan: Top→Bottom\`,8,16);
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[speed,dir,objType]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Speed: <span style={{color:'#e8e8e8'}}>{speed}px/s</span></span>
          <span style={{color:'#555'}}>Scan: <span style={{color:'#e8e8e8'}}>Top→Bottom</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4,flexGrow:1,minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>SPEED</label><span style={{color:'#e8e8e8',fontSize:11}}>{speed}px/s</span></div>
          <input type="range" min={120} max={3840} step={120} value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%'}}/>
        </div>
        {(['lines','grid'] as const).map(o=><button key={o} onClick={()=>setObjType(o)} style={{background:'transparent',border:\`1px solid \${objType===o?'#e8e8e8':'#2a2a2a'}\`,color:objType===o?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer',textTransform:'capitalize'}}>{o}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ ScanOutSkew.tsx');

// ─── PAGE 39: Browser Timing ──────────────────────────────────────────────────
writeFileSync(join(benchDir, 'BrowserTimingPlot.tsx'), `import React, { useState, useEffect, useRef } from 'react';

export default function BrowserTimingPlot() {
  const [windowSize, setWindowSize] = useState(120);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deltasRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const [stats, setStats] = useState({mean:0,sigma:0,jank:0,timerRes:0});

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let animId: number; let frameIdx=0;
    const loop=(now:number)=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      const dt=now-lastTimeRef.current; lastTimeRef.current=now;
      deltasRef.current.push(dt);
      if(deltasRef.current.length>windowSize) deltasRef.current.shift();
      frameIdx++;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      const mean=deltasRef.current.reduce((a,b)=>a+b,0)/(deltasRef.current.length||1);
      const pts=deltasRef.current;
      // Scatter
      const ptW=W/(windowSize||1);
      pts.forEach((d,i)=>{
        const isJank=d>mean*1.5;
        const y=H/2-(d-mean)*(H/4/Math.max(1,mean));
        ctx.fillStyle=isJank?'#ff4444':'#e8e8e8';
        ctx.fillRect(i*ptW,Math.max(4,Math.min(H-4,y)),Math.max(1,ptW-1),2);
      });
      // Hairline at expected
      ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
      ctx.fillText(\`Expected: \${mean.toFixed(2)}ms\`,8,16);
      if(frameIdx%30===0){
        const sigma=Math.sqrt(pts.reduce((s,d)=>s+(d-mean)**2,0)/(pts.length||1));
        const jank=pts.filter(d=>d>mean*1.5).length;
        setStats({mean:+mean.toFixed(2),sigma:+sigma.toFixed(3),jank,timerRes:+performance.now().toString().split('.')[1]?.length||0});
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[windowSize]);

  const exportCSV=()=>{
    const csv=deltasRef.current.map((d,i)=>\`\${i},\${d.toFixed(3)}\`).join('\\n');
    const a=document.createElement('a'); a.href='data:text/csv,'+encodeURIComponent('frame,delta_ms\\n'+csv);
    a.download='frame-timing.csv'; a.click();
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Mean: <span style={{color:'#00ff88'}}>{stats.mean}ms</span></span>
          <span style={{color:'#555'}}>σ: <span style={{color:'#e8e8e8'}}>{stats.sigma}ms</span></span>
          <span style={{color:'#555'}}>Jank: <span style={{color:stats.jank>0?'#ff4444':'#00ff88'}}>{stats.jank}</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>WINDOW</label>
          <select value={windowSize} onChange={e=>setWindowSize(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
            {[60,120,300,600].map(n=><option key={n} value={n}>{n} frames</option>)}
          </select>
        </div>
        <button onClick={exportCSV} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>Export CSV</button>
        <button onClick={()=>{deltasRef.current=[];}} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>Reset</button>
      </div>
    </div>
  );
}
`);
console.log('✓ BrowserTimingPlot.tsx');

// ─── PAGE 40: DPI Calculator ──────────────────────────────────────────────────
writeFileSync(join(benchDir, 'DPICalculator.tsx'), `import React, { useState, useRef, useEffect } from 'react';

export default function DPICalculator() {
  const [physicalDist, setPhysicalDist] = useState(3.0);
  const [sensitivity, setSensitivity] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<{x:number;y:number}|null>(null);
  const endRef = useRef<{x:number;y:number}|null>(null);
  const [pixels, setPixels] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width=canvas.parentElement?.offsetWidth||800; canvas.height=canvas.parentElement?.offsetHeight||400; draw(); };
    const draw = () => {
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1; ctx.setLineDash([8,8]);
      ctx.strokeRect(16,16,W-32,H-32);
      ctx.setLineDash([]);
      ctx.fillStyle='#555'; ctx.font='13px "IBM Plex Mono",monospace'; ctx.textAlign='center';
      ctx.fillText('Click and drag to measure pixel distance',W/2,H/2);
      if(startRef.current&&endRef.current){
        const s=startRef.current,e=endRef.current;
        ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=2; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(e.x,e.y); ctx.stroke();
        ctx.fillStyle='#00ff88';
        ctx.arc(s.x,s.y,5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x,e.y,5,0,Math.PI*2); ctx.fill();
        const dx=e.x-s.x,dy=e.y-s.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        setPixels(Math.round(dist));
      }
    };
    const onDown=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();startRef.current={x:e.clientX-r.left,y:e.clientY-r.top};endRef.current=null;};
    const onMove=(e:PointerEvent)=>{if(!startRef.current) return;const r=canvas.getBoundingClientRect();endRef.current={x:e.clientX-r.left,y:e.clientY-r.top};draw();};
    const onUp=()=>{draw();};
    canvas.addEventListener('pointerdown',onDown);
    canvas.addEventListener('pointermove',onMove);
    canvas.addEventListener('pointerup',onUp);
    resize(); window.addEventListener('resize',resize);
    return()=>{window.removeEventListener('resize',resize);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);};
  },[physicalDist]);

  const dpi = physicalDist > 0 && pixels > 0 ? Math.round(pixels / physicalDist) : 0;
  const edpi = dpi * sensitivity;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block',cursor:'crosshair'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Pixels: <span style={{color:'#e8e8e8'}}>{pixels}px</span></span>
          <span style={{color:'#555'}}>Est. DPI: <span style={{color:'#ffffff',fontSize:18}}>{dpi||'—'}</span></span>
          <span style={{color:'#555'}}>eDPI: <span style={{color:'#e8e8e8'}}>{dpi?Math.round(edpi):'—'}</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>PHYSICAL DIST (inches)</label>
          <input type="number" min={0.1} max={24} step={0.1} value={physicalDist} onChange={e=>setPhysicalDist(+e.target.value)} style={{width:80,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>GAME SENSITIVITY</label>
          <input type="number" min={0.01} max={100} step={0.1} value={sensitivity} onChange={e=>setSensitivity(+e.target.value)} style={{width:80,background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}/>
        </div>
        <p style={{color:'#555',fontSize:11,fontFamily:"'IBM Plex Mono',monospace",margin:0}}>
          Drag a line on the canvas equal to a measured physical distance on your desk with a ruler, then enter the ruler measurement above.
        </p>
      </div>
    </div>
  );
}
`);
console.log('✓ DPICalculator.tsx');

// ─── PAGE 42: Aim Trainer ─────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'AimCanvas.tsx'), `import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function AimCanvas() {
  const [running, setRunning] = useState(false);
  const [targetSize, setTargetSize] = useState<'S'|'M'|'L'>('M');
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<{x:number;y:number;r:number}>({x:200,y:200,r:30});
  const lastClickRef = useRef(performance.now());
  const clickTimesRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const sizeMap={S:15,M:30,L:50};

  const placeTarget=useCallback(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const r=sizeMap[targetSize];
    const margin=r+16;
    targetRef.current={
      x:margin+Math.random()*(canvas.width-margin*2),
      y:margin+Math.random()*(canvas.height-margin*2),
      r
    };
  },[targetSize]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const resize=()=>{canvas.width=canvas.parentElement?.offsetWidth||800;canvas.height=canvas.parentElement?.offsetHeight||400;};
    resize(); window.addEventListener('resize',resize); return()=>window.removeEventListener('resize',resize);
  },[]);

  useEffect(()=>{
    if(!running) return;
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{if(t<=1){setRunning(false);if(timerRef.current)clearInterval(timerRef.current);return 0;}return t-1;});
    },1000);
    return()=>{if(timerRef.current)clearInterval(timerRef.current);};
  },[running]);

  const start=()=>{setRunning(true);setTimeLeft(30);setScore(0);setHits(0);setMisses(0);setAvgTime(0);clickTimesRef.current=[];placeTarget();};

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    let animId: number;
    const loop=()=>{
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      const W=canvas.width,H=canvas.height;
      ctx.fillStyle='#0c0c0c'; ctx.fillRect(0,0,W,H);
      if(!running){
        ctx.fillStyle='#555'; ctx.font='14px "IBM Plex Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(timeLeft===0?'Session complete — press Start':'Press Start to begin',W/2,H/2);
        ctx.textAlign='left';
      } else {
        const {x,y,r}=targetRef.current;
        ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-r*0.3,y); ctx.lineTo(x+r*0.3,y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y-r*0.3); ctx.lineTo(x,y+r*0.3); ctx.stroke();
        ctx.fillStyle='#555'; ctx.font='11px "IBM Plex Mono",monospace';
        ctx.fillText(\`\${String(Math.floor(timeLeft/60)).padStart(2,'0')}:\${String(timeLeft%60).padStart(2,'0')}\`,8,18);
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animId);
  },[running,timeLeft]);

  const handleClick=(e:React.MouseEvent)=>{
    if(!running) return;
    const canvas=canvasRef.current; if(!canvas) return;
    const rect=canvas.getBoundingClientRect();
    const cx=e.clientX-rect.left,cy=e.clientY-rect.top;
    const {x,y,r}=targetRef.current;
    const dist=Math.sqrt((cx-x)**2+(cy-y)**2);
    const now=performance.now();
    const elapsed=now-lastClickRef.current; lastClickRef.current=now;
    if(dist<=r){
      setScore(s=>s+1); setHits(h=>h+1);
      clickTimesRef.current.push(elapsed);
      setAvgTime(Math.round(clickTimesRef.current.reduce((a,b)=>a+b,0)/clickTimesRef.current.length));
      placeTarget();
    } else {
      setMisses(m=>m+1);
    }
  };

  const accuracy=hits+misses>0?Math.round(hits/(hits+misses)*100):100;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{flexGrow:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} onClick={handleClick} style={{width:'100%',height:'100%',display:'block',cursor:'crosshair'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'rgba(17,17,17,0.9)',borderTop:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'space-around',fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
          <span style={{color:'#555'}}>Score: <span style={{color:'#ffffff',fontSize:18}}>{score}</span></span>
          <span style={{color:'#555'}}>Accuracy: <span style={{color:'#e8e8e8'}}>{accuracy}%</span></span>
          <span style={{color:'#555'}}>Avg time: <span style={{color:'#e8e8e8'}}>{avgTime}ms</span></span>
          <span style={{color:'#555'}}>Time: <span style={{color:'#00ff88'}}>{String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}</span></span>
        </div>
      </div>
      <div style={{padding:16,background:'#111',borderTop:'1px solid #222',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <button onClick={start} style={{background:'transparent',border:'1px solid #e8e8e8',color:'#e8e8e8',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{running?'Restart':'Start (30s)'}</button>
        {(['S','M','L'] as const).map(s=><button key={s} onClick={()=>setTargetSize(s)} style={{background:'transparent',border:\`1px solid \${targetSize===s?'#e8e8e8':'#2a2a2a'}\`,color:targetSize===s?'#e8e8e8':'#555',padding:'6px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,borderRadius:4,cursor:'pointer'}}>{s}</button>)}
      </div>
    </div>
  );
}
`);
console.log('✓ AimCanvas.tsx');

// ─── PAGE 43: Setup Score ─────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'SetupScore.tsx'), `import React, { useState, useEffect } from 'react';
import { useHz } from '../../lib/hz-detector';
import { usePollRate } from '../../lib/poll-rate';

export default function SetupScore() {
  const { hz } = useHz();
  const { pollRate } = usePollRate();
  const [reaction, setReaction] = useState<number|null>(null);
  const [phase, setPhase] = useState<'idle'|'wait'|'ready'|'done'>('idle');
  const [waiting, setWaiting] = useState(false);
  const waitStart = React.useRef(0);

  const startReaction = () => {
    setPhase('wait');
    const delay = 1500 + Math.random() * 2000;
    setTimeout(() => { setPhase('ready'); waitStart.current = performance.now(); }, delay);
  };

  const handleClick = () => {
    if (phase === 'ready') {
      const t = Math.round(performance.now() - waitStart.current);
      setReaction(t);
      setPhase('done');
    } else if (phase === 'wait') {
      setPhase('idle');
    }
  };

  const hzScore = Math.min(40, Math.round((hz / 360) * 40));
  const pollScore = Math.min(30, Math.round((Math.min(pollRate, 1000) / 1000) * 30));
  const reactScore = reaction ? Math.min(30, Math.max(0, Math.round((1 - (reaction - 150) / 350) * 30))) : 0;
  const total = hzScore + pollScore + reactScore;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',alignItems:'center',justifyContent:'center',padding:40,gap:32}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:96,fontFamily:"'IBM Plex Mono',monospace",color:'#ffffff',lineHeight:1}}>{total}<span style={{fontSize:32,color:'#555'}}> / 100</span></div>
      </div>
      <div style={{display:'flex',gap:32,fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
        <div style={{textAlign:'center'}}><div style={{color:'#555'}}>Hz</div><div style={{color:'#e8e8e8'}}>{hz} <span style={{color:'#555'}}>+{hzScore}pts</span></div></div>
        <div style={{textAlign:'center'}}><div style={{color:'#555'}}>Poll Rate</div><div style={{color:'#e8e8e8'}}>{pollRate}Hz <span style={{color:'#555'}}>+{pollScore}pts</span></div></div>
        <div style={{textAlign:'center'}}><div style={{color:'#555'}}>Reaction</div><div style={{color:'#e8e8e8'}}>{reaction||'—'}ms <span style={{color:'#555'}}>+{reactScore}pts</span></div></div>
      </div>
      {phase==='idle'&&<button onClick={startReaction} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'8px 20px',fontFamily:"'IBM Plex Mono',monospace",fontSize:13,borderRadius:4,cursor:'pointer'}}>Test Reaction Time</button>}
      {phase==='wait'&&<button onClick={handleClick} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'8px 20px',fontFamily:"'IBM Plex Mono',monospace",fontSize:13,borderRadius:4,cursor:'pointer'}}>Wait for signal...</button>}
      {phase==='ready'&&<button onClick={handleClick} style={{background:'#ffffff',border:'1px solid #fff',color:'#000',padding:'8px 20px',fontFamily:"'IBM Plex Mono',monospace",fontSize:13,borderRadius:4,cursor:'pointer',fontWeight:'bold'}}>CLICK NOW!</button>}
      {phase==='done'&&<button onClick={startReaction} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'8px 20px',fontFamily:"'IBM Plex Mono',monospace",fontSize:13,borderRadius:4,cursor:'pointer'}}>Run Again</button>}
    </div>
  );
}
`);
console.log('✓ SetupScore.tsx');

// ─── PAGE 44: Leaderboard ─────────────────────────────────────────────────────
writeFileSync(join(benchDir, 'LeaderboardTable.tsx'), `import React, { useState } from 'react';

const MOCK_DATA = [
  {rank:1,name:'ProGamer2k',reaction:142,hz:360,poll:8000,score:98},
  {rank:2,name:'DisplayNerd',reaction:158,hz:240,poll:1000,score:94},
  {rank:3,name:'RefreshKing',reaction:167,hz:144,poll:1000,score:89},
  {rank:4,name:'xXMonitorXx',reaction:182,hz:165,poll:500,score:85},
  {rank:5,name:'Hz_Hunter',reaction:195,hz:144,poll:1000,score:82},
  {rank:6,name:'PixelWatcher',reaction:201,hz:120,poll:1000,score:78},
  {rank:7,name:'FrameDropper',reaction:215,hz:75,poll:125,score:65},
  {rank:8,name:'SmoothBoi',reaction:188,hz:165,poll:1000,score:86},
  {rank:9,name:'CRTLover',reaction:240,hz:60,poll:125,score:52},
  {rank:10,name:'GenericUser',reaction:300,hz:60,poll:125,score:40},
];

type SortKey = 'rank'|'reaction'|'hz'|'poll'|'score';

export default function LeaderboardTable() {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [hzFilter, setHzFilter] = useState(0);

  const handleSort=(key:SortKey)=>{if(sortKey===key) setSortAsc(a=>!a); else{setSortKey(key);setSortAsc(true);}};
  const filtered=MOCK_DATA.filter(d=>hzFilter===0||d.hz>=hzFilter);
  const sorted=[...filtered].sort((a,b)=>sortAsc?(a[sortKey] as number)-(b[sortKey] as number):(b[sortKey] as number)-(a[sortKey] as number));

  const th=(key:SortKey,label:string)=>(
    <th onClick={()=>handleSort(key)} style={{padding:'8px 12px',cursor:'pointer',color:sortKey===key?'#e8e8e8':'#555',fontWeight:400,textAlign:'left',borderBottom:'1px solid #222',whiteSpace:'nowrap'}}>
      {label}{sortKey===key?(sortAsc?' ↑':' ↓'):''}
    </th>
  );

  return (
    <div style={{padding:24,fontFamily:"'IBM Plex Mono',monospace"}}>
      <div style={{display:'flex',gap:16,marginBottom:24,alignItems:'center'}}>
        <label style={{color:'#555',fontSize:11}}>FILTER Hz ≥</label>
        <select value={hzFilter} onChange={e=>setHzFilter(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
          <option value={0}>All</option>
          {[60,120,144,165,240,360].map(n=><option key={n} value={n}>{n}Hz+</option>)}
        </select>
        <span style={{color:'#555',fontSize:11,marginLeft:'auto'}}>Your rank: <span style={{color:'#e8e8e8'}}>#47</span> · Score: <span style={{color:'#e8e8e8'}}>87</span></span>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead>
          <tr style={{background:'#111'}}>
            {th('rank','#')}
            <th style={{padding:'8px 12px',color:'#555',fontWeight:400,textAlign:'left',borderBottom:'1px solid #222'}}>Name</th>
            {th('reaction','Reaction')}
            {th('hz','Hz')}
            {th('poll','Poll Rate')}
            {th('score','Score')}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row,i)=>(
            <tr key={row.rank} style={{background:i%2===0?'#0c0c0c':'#111'}}>
              <td style={{padding:'8px 12px',color:'#555'}}>{row.rank}</td>
              <td style={{padding:'8px 12px',color:'#e8e8e8'}}>{row.name}</td>
              <td style={{padding:'8px 12px',color:'#e8e8e8'}}>{row.reaction}ms</td>
              <td style={{padding:'8px 12px',color:'#e8e8e8'}}>{row.hz}Hz</td>
              <td style={{padding:'8px 12px',color:'#e8e8e8'}}>{row.poll}Hz</td>
              <td style={{padding:'8px 12px',color:'#ffffff',fontWeight:'bold'}}>{row.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`);
console.log('✓ LeaderboardTable.tsx');

console.log('\n✅ All benchmark components generated!');
