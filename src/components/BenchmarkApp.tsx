import React, { useEffect, useRef, useState } from 'react';
import TabBar from './ui/TabBar';
import StatCard from './ui/StatCard';
import RefreshRateDetector from './benchmarks/RefreshRateDetector';
import TargetTrainer from './benchmarks/TargetTrainer';
import DpiMeter from './benchmarks/DpiMeter';
import ReactionTimer from './benchmarks/ReactionTimer';
import MotionBlurTest from './benchmarks/MotionBlurTest';
import { HzDetector } from '../lib/hz-detector';
import { PollRateDetector } from '../lib/poll-rate';

const tabs = [
  { id: 'refresh', label: 'Refresh Rate' },
  { id: 'trainer', label: 'Target Trainer' },
  { id: 'dpi', label: 'DPI Meter' },
  { id: 'reaction', label: 'Reaction' },
  { id: 'motion', label: 'Motion Blur' }
];

const BenchmarkApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('refresh');
  const [stats, setStats] = useState({
    hz: 0,
    fps: 0,
    dpi: 0,
    pollRate: 0,
    reaction: 0
  });

  const hzDetector = useRef(new HzDetector());
  const pollRateDetector = useRef(new PollRateDetector());

  useEffect(() => {
    let handle: number;
    const loop = (time: number) => {
      const result = hzDetector.current.update(time);
      setStats(prev => ({ 
        ...prev, 
        hz: Math.round(result.snapped),
        fps: Math.round(result.raw)
      }));
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);

    const handleMouseMove = (e: MouseEvent) => {
      const result = pollRateDetector.current.addSample(performance.now());
      if (result.snapped > 0) {
        setStats(prev => ({ ...prev, pollRate: Math.round(result.snapped) }));
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(handle);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const renderActiveBenchmark = () => {
    switch (activeTab) {
      case 'refresh': return <RefreshRateDetector />;
      case 'trainer': return <TargetTrainer />;
      case 'dpi': return <DpiMeter onResult={(dpi) => setStats(s => ({ ...s, dpi }))} />;
      case 'reaction': return <ReactionTimer onResult={(best) => setStats(s => ({ ...s, reaction: best }))} />;
      case 'motion': return <MotionBlurTest />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto px-4 py-12" id="benchmarks">
      <div className="flex justify-between items-center mb-4">
        <div className="text-[11px] font-mono font-bold text-neon tracking-[0.2em] uppercase">
          SCREEN<span className="text-muted">/</span>HZ
        </div>
        <div className="px-3 py-1 bg-neon/10 border border-neon/20 rounded-full">
          <span className="text-[9px] font-mono font-bold text-neon tracking-widest uppercase">● Live Measuring</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Refresh Hz" value={stats.hz || '--'} accent="green" />
        <StatCard label="Browser FPS" value={stats.fps || '--'} accent="blue" />
        <StatCard label="DPI Estimate" value={stats.dpi || '--'} accent="orange" />
        <StatCard label="Mouse Poll Hz" value={stats.pollRate || '--'} accent="purple" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-center">
          <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        
        <div className="animate-in fade-in zoom-in-95 duration-300">
          {renderActiveBenchmark()}
        </div>
      </div>
    </div>
  );
};

export default BenchmarkApp;
