import { useState, useEffect, useRef } from "react";

export function useHz() {
  const [hz, setHz] = useState(0);
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const samples = useRef<number[]>([]);
  const last = useRef(performance.now());

  useEffect(() => {
    let raf: number;
    const loop = (now: number) => {
      const delta = now - last.current;
      last.current = now;
      if (delta > 1 && delta < 200) {
        samples.current.push(delta);
        if (samples.current.length > 120) samples.current.shift();
        const avg = samples.current.reduce((a,b) => a+b) / samples.current.length;
        const measuredFps = 1000 / avg;
        setFps(measuredFps);
        setFrameTime(avg);
        // Snap to nearest standard Hz
        const standards = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 75, 90, 100, 119.88, 120, 144, 165, 180, 240, 300, 360, 480, 500, 540];
        setHz(standards.reduce((a,b) => Math.abs(b-measuredFps) < Math.abs(a-measuredFps) ? b : a));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { hz, fps, frameTime };
}
