import React, { useEffect, useRef, useState } from 'react';

interface Props {
  detectedHz: number;
}

const MotionBlurSection: React.FC<Props> = ({ detectedHz }) => {
  const [speed, setSpeed] = useState(1);
  const canvas60Ref = useRef<HTMLCanvasElement>(null);
  const canvasNativeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let handle60: number;
    let handleNative: number;
    const hz60 = 60;
    const hzNative = detectedHz || 60;

    const draw = (ctx: CanvasRenderingContext2D, time: number, hz: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const stripeWidth = 40;
      
      // We want a consistent speed across different Hz
      // pixels per ms = (base_speed * multiplier)
      const baseSpeed = 0.5; // pixels per ms
      const currentSpeed = baseSpeed * speed;
      const x = (time * currentSpeed) % (width + stripeWidth) - stripeWidth;
      
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(x, 0, stripeWidth, height);
    };

    let last60 = 0;
    const loop60 = (time: number) => {
      const interval = 1000 / hz60;
      if (time - last60 >= interval) {
        const ctx = canvas60Ref.current?.getContext('2d');
        if (ctx) draw(ctx, time, hz60);
        last60 = time;
      }
      handle60 = requestAnimationFrame(loop60);
    };

    const loopNative = (time: number) => {
      const ctx = canvasNativeRef.current?.getContext('2d');
      if (ctx) draw(ctx, time, hzNative);
      handleNative = requestAnimationFrame(loopNative);
    };

    handle60 = requestAnimationFrame(loop60);
    handleNative = requestAnimationFrame(loopNative);

    return () => {
      cancelAnimationFrame(handle60);
      cancelAnimationFrame(handleNative);
    };
  }, [speed, detectedHz]);

  const frameTimeNative = detectedHz > 0 ? (1000 / detectedHz).toFixed(1) : '16.7';
  const ratio = (16.66 / Number(frameTimeNative)).toFixed(1);

  return (
    <section id="motion-blur" className="w-full py-[80px] border-b border-border">
      <div className="max-w-[760px] mx-auto px-6 flex flex-col items-center">
        
        <div className="w-full mb-12">
          <div className="text-[11px] font-mono font-bold text-muted tracking-[0.14em] uppercase mb-4">
            06 — MOTION
          </div>
          <h2 className="text-display-lg text-brand mb-2">Motion Blur Test</h2>
          <p className="text-body-md text-muted">See how your Hz affects perceived blur.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
          <div className="flex flex-col gap-4">
            <div className="text-caption-mono text-muted uppercase tracking-widest text-center">YOUR DISPLAY ({detectedHz || '--'}Hz)</div>
            <div className="h-32 bg-[#050505] rounded-[10px] overflow-hidden border border-white/5">
              <canvas ref={canvasNativeRef} width={380} height={128} className="w-full h-full" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-caption-mono text-muted uppercase tracking-widest text-center">60 Hz (simulated)</div>
            <div className="h-32 bg-[#050505] rounded-[10px] overflow-hidden border border-white/5">
              <canvas ref={canvas60Ref} width={380} height={128} className="w-full h-full" />
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4 mb-12">
          <div className="flex justify-between items-center text-caption-mono text-muted uppercase tracking-widest">
            <span>Speed</span>
            <span className="text-brand">{speed.toFixed(1)}&times;</span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="2.0" 
            step="0.1" 
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-neon"
          />
        </div>

        <p className="text-body-md text-brand italic border-l-2 border-neon pl-4 py-1 self-start">
          "At {detectedHz || 60}Hz, each frame lasts {frameTimeNative}ms. At 60Hz, each frame lasts 16.6ms — {ratio}&times; more blur per frame."
        </p>

      </div>
    </section>
  );
};

export default MotionBlurSection;
