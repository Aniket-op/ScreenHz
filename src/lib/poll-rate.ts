import { useState, useEffect, useRef, useCallback } from "react";

const STANDARDS = [125, 250, 500, 1000, 2000, 4000, 8000];

export const KNOWN_POLL_RATES = STANDARDS;

export interface PollRateResult {
  snapped: number;
  raw: number;
  jitter: number;
}

/** Class-based detector for components that import it directly */
export class PollRateDetector {
  private times: number[] = [];
  private last = 0;

  addSample(now: number): PollRateResult {
    const delta = now - this.last;
    this.last = now;
    if (delta > 0.1 && delta < 50) {
      this.times.push(delta);
      if (this.times.length > 200) this.times.shift();
    }
    if (this.times.length < 5) return { snapped: 0, raw: 0, jitter: 0 };
    const avg = this.times.reduce((a, b) => a + b, 0) / this.times.length;
    const raw = 1000 / avg;
    const snapped = STANDARDS.reduce((a, b) => Math.abs(b - raw) < Math.abs(a - raw) ? b : a);
    const variance = this.times.map(t => (t - avg) ** 2).reduce((a, b) => a + b, 0) / this.times.length;
    return { snapped, raw, jitter: +Math.sqrt(variance).toFixed(3) };
  }
}

/** Hook-based detector for React components */
export function usePollRate() {
  const [pollHz, setPollHz] = useState(0);
  const [jitter, setJitter] = useState(0);
  const times = useRef<number[]>([]);
  const last = useRef(0);

  const onMouseMove = useCallback(() => {
    const now = performance.now();
    if (last.current) {
      const delta = now - last.current;
      if (delta > 0.1 && delta < 50) {
        times.current.push(delta);
        if (times.current.length > 200) times.current.shift();
        const avg = times.current.reduce((a, b) => a + b, 0) / times.current.length;
        const measured = 1000 / avg;
        setPollHz(STANDARDS.reduce((a, b) => Math.abs(b - measured) < Math.abs(a - measured) ? b : a));
        const variance = times.current.map(t => (t - avg) ** 2).reduce((a, b) => a + b, 0) / times.current.length;
        setJitter(+Math.sqrt(variance).toFixed(3));
      }
    }
    last.current = now;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [onMouseMove]);

  return { pollHz, jitter };
}
