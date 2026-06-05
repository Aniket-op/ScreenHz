import React from 'react';
import TargetTrainer from '../benchmarks/TargetTrainer';

const TargetTrainerSection: React.FC = () => {
  return (
    <section id="target-trainer" className="w-full py-[80px] border-b border-border bg-bg">
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
        <TargetTrainer />
      </div>
    </section>
  );
};

export default TargetTrainerSection;
