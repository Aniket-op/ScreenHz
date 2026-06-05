import React, { useEffect, useRef, useState } from 'react';
import { HzDetector } from '../lib/hz-detector';
import { PollRateDetector } from '../lib/poll-rate';

// Section components
import HeroSection from './sections/HeroSection';
import RefreshRateSection from './sections/RefreshRateSection';
import TargetTrainerSection from './sections/TargetTrainerSection';
import DpiMeterSection from './sections/DpiMeterSection';
import ReactionSection from './sections/ReactionSection';
import PollRateSection from './sections/PollRateSection';
import MotionBlurSection from './sections/MotionBlurSection';
import SetupScoreSection from './sections/SetupScoreSection';

export interface GlobalStats {
  hz: number;
  fps: number;
  dpi: number;
  pollRate: number;
  reaction: number;
}

const App: React.FC = () => {
  const [stats, setStats] = useState<GlobalStats>({
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

  return (
    <div className="flex flex-col w-full">
      <HeroSection stats={stats} />
      <RefreshRateSection hzDetectorRef={hzDetector} stats={stats} />
      <TargetTrainerSection />
      <DpiMeterSection onDpiChange={(dpi) => setStats(prev => ({ ...prev, dpi }))} />
      <ReactionSection onBestReaction={(reaction) => setStats(prev => ({ ...prev, reaction }))} />
      <PollRateSection pollRateDetectorRef={pollRateDetector} detectedPollRate={stats.pollRate} />
      <MotionBlurSection detectedHz={stats.hz} />
      <SetupScoreSection stats={stats} />
    </div>
  );
};

export default App;
