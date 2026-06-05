import React, { useEffect, useState } from 'react';

interface Entry {
  name: string;
  hz: number;
  fps: number;
  score: number;
  date: string;
}

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('screenhz_leaderboard');
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      const mock = [
        { name: 'Tenz', hz: 360, fps: 540, score: 98, date: new Date().toISOString() },
        { name: 'S1mple', hz: 240, fps: 480, score: 95, date: new Date().toISOString() },
        { name: 'Shroud', hz: 240, fps: 400, score: 92, date: new Date().toISOString() },
      ];
      setEntries(mock);
      localStorage.setItem('screenhz_leaderboard', JSON.stringify(mock));
    }
  }, []);

  const submitScore = () => {
    if (!name) return;
    const newEntry: Entry = {
      name,
      hz: 144, 
      fps: 165,
      score: 85,
      date: new Date().toISOString()
    };
    const updated = [...entries, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    setEntries(updated);
    localStorage.setItem('screenhz_leaderboard', JSON.stringify(updated));
    setName('');
  };

  return (
    <div className="flex flex-col gap-6 p-10 bg-bg vercel-card-border vercel-shadow rounded-2xl">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold tracking-tight uppercase">Leaderboard</h3>
        <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest px-2 py-0.5 bg-surface rounded">Top Performers</span>
      </div>

      <div className="flex flex-col gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden">
        {entries.map((entry, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between p-4 bg-bg hover:bg-surface transition-colors group"
          >
            <div className="flex items-center gap-4">
              <span className={`
                w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold
                ${i === 0 ? 'bg-brand text-bg' : 'text-muted'}
              `}>
                {i + 1}
              </span>
              <span className="font-bold text-sm tracking-tight">{entry.name}</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[8px] font-mono font-bold text-muted uppercase">Setup</span>
                <span className="text-[11px] font-mono font-medium text-muted">{entry.hz}Hz / {entry.fps}FPS</span>
              </div>
              <div className="flex flex-col items-end min-w-[40px]">
                <span className="text-[8px] font-mono font-bold text-muted uppercase">Score</span>
                <span className="text-sm font-bold text-brand">{entry.score}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border flex flex-col md:flex-row gap-2">
        <input 
          type="text" 
          placeholder="Nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-grow bg-surface border border-border rounded-full px-5 py-2 text-brand focus:outline-none focus:border-muted transition-colors text-xs"
        />
        <button 
          onClick={submitScore}
          className="px-6 py-2 bg-brand text-bg font-bold rounded-full hover:opacity-90 transition-opacity text-xs whitespace-nowrap"
        >
          Post Result
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
