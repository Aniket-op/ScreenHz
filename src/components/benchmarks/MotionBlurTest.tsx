import React, { useEffect, useRef, useState } from 'react';

const MotionBlurTest: React.FC = () => {
  const [speed, setSpeed] = useState(1); // multiplier
  const canvas60Ref = useRef<HTMLCanvasElement>(null);
  const canvasNativeRef = useRef<HTMLCanvasElement>(null);
  
  const [nativeHz, setNativeHz] = useState(60);

  useEffect(() => {
    // Detect native HZ for comparison
    let frames = 0;
    let start = performance.now();
    const detect = () => {
      frames++;
      if (performance.now() - start > 1000) {
        setNativeHz(Math.round(frames));
        return;
      }
      requestAnimationFrame(detect);
    };
    requestAnimationFrame(detect);
  }, []);

  useEffect(() => {
    let handle60: number;
    let handleNative: number;
    
    const draw = (ctx: CanvasRenderingContext2D, time: number, hz: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const stripeWidth = 40;
      
      // Speed: Hz / 4 pixels per frame
      const speedPx = (hz / 4) * speed;
      const totalFrames = (time / 1000) * hz;
      const x = (totalFrames * speedPx) % (width + stripeWidth) - stripeWidth;
      
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, 20, stripeWidth, height - 40);
    };

    const loop60 = (time: number) => {
      const ctx = canvas60Ref.current?.getContext('2d');
      if (ctx) draw(ctx, time, 60);
      // Simulate 60Hz by only updating every ~16.6ms
      setTimeout(() => {
        handle60 = requestAnimationFrame(loop60);
      }, 1000 / 60);
    };

    const loopNative = (time: number) => {
      const ctx = canvasNativeRef.current?.getContext('2d');
      if (ctx) draw(ctx, time, nativeHz);
      handleNative = requestAnimationFrame(loopNative);
    };

    handle60 = requestAnimationFrame(loop60);
    handleNative = requestAnimationFrame(loopNative);

    return () => {
      cancelAnimationFrame(handle60);
      cancelAnimationFrame(handleNative);
    };
  }, [speed, nativeHz]);

  return (
    <div className="flex flex-col gap-8 p-6 bg-surface rounded-xl border border-border shadow-xl">
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold text-brand">Motion Blur Visualizer</h3>
        <p className="text-sm text-muted leading-relaxed">
          See the difference between 60Hz and your monitor's native refresh rate. Higher refresh rates reduce "ghosting" and motion blur.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Speed Multiplier</label>
          <span className="text-xs font-mono text-cyber">{speed}x</span>
        </div>
        <input 
          type="range" 
          min="0.5" 
          max="3" 
          step="0.1" 
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full accent-brand"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-muted uppercase tracking-widest text-center">Simulated 60Hz</span>
          <div className="h-32 bg-bg rounded-lg border border-border overflow-hidden">
            <canvas ref={canvas60Ref} width={400} height={128} className="w-full h-full" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-cyber uppercase tracking-widest text-center">Your Monitor ({nativeHz}Hz)</span>
          <div className="h-32 bg-bg rounded-lg border border-cyber shadow-[0_0_20px_rgba(87,193,255,0.1)] overflow-hidden">
            <canvas ref={canvasNativeRef} width={400} height={128} className="w-full h-full" />
          </div>
        </div>
      </div>

      <div className="p-4 bg-surface-elevated rounded-lg border border-border">
        <p className="text-sm text-muted leading-relaxed">
          At <span className="text-brand font-bold">{nativeHz}Hz</span>, each frame is shown for <span className="text-brand font-bold">{Math.round(1000 / nativeHz * 10) / 10}ms</span>. 
          The 60Hz simulation has a frame time of <span className="text-muted font-bold">16.7ms</span>. 
          The faster the frame transitions, the sharper moving objects appear to your eyes.
        </p>
      </div>
    </div>
  );
};

export default MotionBlurTest;
