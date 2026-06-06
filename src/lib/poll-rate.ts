import { useState, useEffect, useRef, useCallback } from "react";

export function usePollRate() {
  const [pollHz, setPollHz] = useState(0);
  const [jitter, setJitter] = useState(0);
  const times = useRef<number[]>([]);
  const last = useRef(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const now = performance.now();
    if (last.current) {
      const delta = now - last.current;
      if (delta > 0.1 && delta < 50) {
        times.current.push(delta);
        if (times.current.length > 200) times.current.shift();
        const avg = times.current.reduce((a,b) => a+b) / times.current.length;
        const measured = 1000 / avg;
        const standards = [125, 250, 500, 1000, 2000, 4000, 8000];
        setPollHz(standards.reduce((a,b) => Math.abs(b-measured) < Math.abs(a-measured) ? b : a));
        const variance = times.current.map(t => (t-avg)**2).reduce((a,b)=>a+b) / times.current.length;
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
