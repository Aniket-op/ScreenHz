import { useState, useEffect, useRef } from "react";

const STANDARD_HZ = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 75, 90, 100, 119.88, 120, 144, 165, 180, 240, 300, 360, 480, 500, 540];

export interface HzResult {
  raw: number;
  snapped: number;
  confidence: number;
  frameTimes: number[];
}

/** Class-based detector for components that import it directly */
export class HzDetector {
  private times: number[] = [];
  private last = 0;

  update(now: number): HzResult {
    const delta = now - this.last;
    this.last = now;
    if (delta > 1 && delta < 200) {
      this.times.push(delta);
      if (this.times.length > 120) this.times.shift();
    }
    if (this.times.length < 5) return { raw: 0, snapped: 0, confidence: 0, frameTimes: [] };
    const avg = this.times.reduce((a, b) => a + b, 0) / this.times.length;
    const raw = 1000 / avg;
    const snapped = STANDARD_HZ.reduce((a, b) => Math.abs(b - raw) < Math.abs(a - raw) ? b : a);
    const confidence = this.times.length >= 60 ? 1 : this.times.length / 60;
    return { raw, snapped, confidence, frameTimes: [...this.times] };
  }
}

/** Hook-based detector for React components */
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
        const avg = samples.current.reduce((a, b) => a + b, 0) / samples.current.length;
        const measuredFps = 1000 / avg;
        setFps(measuredFps);
        setFrameTime(avg);
        setHz(STANDARD_HZ.reduce((a, b) => Math.abs(b - measuredFps) < Math.abs(a - measuredFps) ? b : a));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { hz, fps, frameTime };
}
