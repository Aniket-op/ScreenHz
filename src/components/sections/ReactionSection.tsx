import React, { useEffect, useRef, useState } from 'react';

type GameState = 'idle' | 'waiting' | 'too-early' | 'go' | 'result';

interface Props {
  onBestReaction: (best: number) => void;
}

const ReactionSection: React.FC<Props> = ({ onBestReaction }) => {
  const [state, setState] = useState<GameState>('idle');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef<GameState>('idle');

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const startTest = () => {
    setState('waiting');
    const delay = 1500 + Math.random() * 3000;
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (stateRef.current === 'waiting') {
        setState('go');
        setStartTime(performance.now());
      }
    }, delay);
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentState = stateRef.current;

    if (currentState === 'waiting') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState('too-early');
      setTimeout(() => setState('idle'), 1000);
    } else if (currentState === 'go') {
      const endTime = performance.now();
      const time = endTime - startTime;
      setReactionTime(time);
      
      const newHistory = [time, ...history].slice(0, 10);
      setHistory(newHistory);
      setState('result');
      
      const best = Math.min(...newHistory);
      onBestReaction(Math.round(best));
    } else if (currentState === 'idle' || currentState === 'result') {
      startTest();
    }
  };

  const best = history.length > 0 ? Math.min(...history) : 0;
  const avg = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : 0;

  const getTimeColor = (time: number) => {
    if (time < 150) return '#FFD700'; // Gold
    if (time < 200) return 'var(--color-neon)'; // Green
    if (time < 250) return 'var(--color-heat)'; // Yellow/Orange
    return 'var(--color-muted)';
  };

  return (
    <section id="reaction" className="w-full py-[80px] border-b border-border">
      <div className="max-w-[760px] mx-auto px-6 flex flex-col items-center">
        
        <div className="w-full mb-12">
          <div className="text-[11px] font-mono font-bold text-muted tracking-[0.14em] uppercase mb-4">
            04 — LATENCY
          </div>
          <h2 className="text-display-lg text-brand mb-2">Reaction Timer</h2>
          <p className="text-body-md text-muted">Test your response to visual stimulus.</p>
        </div>

        <div 
          onMouseDown={handleInteraction}
          className={`
            relative w-full min-h-[200px] rounded-[10px] overflow-hidden cursor-pointer flex flex-col items-center justify-center transition-all duration-75 select-none mb-12
            ${state === 'idle' ? 'bg-surface' : ''}
            ${state === 'waiting' ? 'bg-[#0d0d0d]' : ''}
            ${state === 'too-early' ? 'bg-red-500/10 border border-red-500/20' : ''}
            ${state === 'go' ? 'bg-neon/15' : ''}
            ${state === 'result' ? 'bg-surface' : ''}
          `}
        >
          {state === 'idle' && (
            <div className="text-body-md font-bold text-muted uppercase tracking-widest animate-pulse">
              CLICK TO START
            </div>
          )}

          {state === 'waiting' && (
            <div className="text-body-md font-bold text-muted uppercase tracking-widest">
              WAIT...
            </div>
          )}

          {state === 'too-early' && (
            <div className="text-body-md font-bold text-red-500 uppercase tracking-widest">
              TOO EARLY
            </div>
          )}

          {state === 'go' && (
            <div className="text-[48px] font-bold text-neon uppercase tracking-tighter">
              CLICK!
            </div>
          )}

          {state === 'result' && (
            <div className="flex flex-col items-center">
              <div className="text-[64px] font-mono font-bold" style={{ color: getTimeColor(reactionTime) }}>
                {Math.round(reactionTime)}ms
              </div>
              <div className="text-caption text-muted uppercase tracking-widest">Click to try again</div>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-8 mb-12">
          <div className="flex flex-col gap-3">
            <div className="text-caption-mono text-muted uppercase tracking-widest">Recent attempts</div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {history.map((time, i) => (
                <div 
                  key={i} 
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full bg-surface-2 border text-[10px] font-mono font-bold transition-all
                    ${time === best ? 'border-neon ring-1 ring-neon/20' : 'border-white/5'}`}
                  style={{ color: getTimeColor(time) }}
                >
                  {time === best ? '★ ' : ''}{Math.round(time)}ms
                </div>
              ))}
              {history.length === 0 && <div className="text-caption text-muted italic">No attempts recorded</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col p-6 bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <div className="text-[36px] font-mono text-brand leading-none mb-2">
                {best > 0 ? Math.round(best) : '--'}
                <span className="text-sm ml-1">ms</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted">Best</div>
            </div>
            <div className="flex flex-col p-6 bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <div className="text-[36px] font-mono text-brand leading-none mb-2">
                {avg > 0 ? Math.round(avg) : '--'}
                <span className="text-sm ml-1">ms</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted">Average</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ReactionSection;
