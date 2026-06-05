import React, { useEffect, useRef, useState } from 'react';
import ScoreBar from '../ui/ScoreBar';

type GameState = 'idle' | 'waiting' | 'go' | 'result' | 'early';

interface ReactionTimerProps {
  onResult?: (bestMs: number) => void;
}

const ReactionTimer: React.FC<ReactionTimerProps> = ({ onResult }) => {
  const [state, setState] = useState<GameState>('idle');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<GameState>('idle');

  // Keep stateRef in sync for safe access in timeouts/event handlers
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const startTest = () => {
    setState('waiting');
    const delay = 1500 + Math.random() * 3000;
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
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
      setState('early');
    } else if (currentState === 'go') {
      const endTime = performance.now();
      const time = endTime - startTime;
      setReactionTime(time);
      
      const newHistory = [time, ...history].slice(0, 8);
      setHistory(newHistory);
      setState('result');
      
      if (onResult) {
        const best = Math.min(...newHistory);
        onResult(Math.round(best));
      }
    } else if (currentState === 'idle' || currentState === 'result' || currentState === 'early') {
      startTest();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const best = history.length > 0 ? Math.min(...history) : 0;
  const avg = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : 0;

  const getColorClass = (time: number) => {
    if (time < 150) return 'text-neon'; 
    if (time < 200) return 'text-neon2'; 
    if (time < 250) return 'text-cyber';
    return 'text-muted';
  };

  const getEvaluation = (time: number) => {
    if (time < 150) return 'Incredible!';
    if (time < 200) return 'Pro level';
    if (time < 250) return 'Above average';
    if (time < 300) return 'Average';
    return 'Keep practicing';
  };

  return (
    <div className="flex flex-col gap-8 p-6 bg-surface rounded-xl border border-border shadow-xl min-h-[400px]">
      <div 
        onMouseDown={handleInteraction}
        onTouchStart={handleInteraction}
        className={`
          flex-grow rounded-lg border border-border transition-all duration-75 cursor-pointer flex flex-col items-center justify-center gap-4 select-none
          ${state === 'waiting' ? 'bg-surface-elevated' : ''}
          ${state === 'go' ? 'bg-neon/10 border-neon scale-[1.01]' : ''}
          ${state === 'early' ? 'bg-heat/10 border-heat animate-shake' : ''}
          ${state === 'result' ? 'bg-surface-elevated' : ''}
        `}
      >
        {state === 'idle' && (
          <>
            <h3 className="text-xl font-mono font-bold text-brand uppercase tracking-widest">Click to Start</h3>
            <p className="text-muted text-[10px] font-mono uppercase tracking-[0.2em]">Tests your response to visual stimulus</p>
          </>
        )}

        {state === 'waiting' && (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="text-3xl font-mono font-bold text-muted animate-pulse tracking-widest uppercase">Wait...</div>
            <p className="text-muted text-[10px] font-mono uppercase tracking-widest">Click when it turns green</p>
          </div>
        )}

        {state === 'go' && (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="text-6xl font-mono font-black text-neon tracking-tighter uppercase">CLICK!</div>
          </div>
        )}

        {state === 'result' && (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className={`text-6xl font-mono font-bold ${getColorClass(reactionTime)}`}>
              {Math.round(reactionTime)}
              <span className="text-xl ml-1">ms</span>
            </div>
            <p className="text-muted text-xs font-mono uppercase tracking-widest">{getEvaluation(reactionTime)}</p>
          </div>
        )}

        {state === 'early' && (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="text-3xl font-mono font-bold text-heat uppercase tracking-widest">TOO EARLY</div>
            <p className="text-muted text-[10px] font-mono uppercase tracking-widest">Click to try again</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">History</span>
            <span className="text-[10px] font-mono text-neon font-bold">{history.length}/8 attempts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.length > 0 ? history.map((time, i) => (
              <span key={i} className={`px-2 py-1 bg-surface-elevated rounded border border-border text-[10px] font-mono font-bold ${getColorClass(time)} ${time === best ? 'border-neon' : ''}`}>
                {time === best ? '★ ' : ''}{Math.round(time)}ms
              </span>
            )) : (
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">No attempts yet</span>
            )}
          </div>
        </div>

        <div className="score-section border-t border-border pt-6 flex flex-col gap-4">
          <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Reaction Stats</div>
          <ScoreBar 
            label="Best" 
            value={best ? Math.max(0, Math.min(100, 100 - (best - 100) / 3)) : 0} 
            displayValue={`${best ? Math.round(best) : '--'} ms`} 
            color="var(--color-neon)" 
          />
          <ScoreBar 
            label="Average" 
            value={avg ? Math.max(0, Math.min(100, 100 - (avg - 100) / 3)) : 0} 
            displayValue={`${avg ? Math.round(avg) : '--'} ms`} 
            color="var(--color-neon2)" 
          />
        </div>
      </div>
    </div>
  );
};

export default ReactionTimer;
