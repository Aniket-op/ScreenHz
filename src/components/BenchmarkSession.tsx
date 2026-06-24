import React, { useEffect, useRef, useState } from 'react';

interface BenchmarkStep {
  id: string;
  name: string;
  description: string;
  duration: number; // ms
  icon: string;
}

interface StepResult {
  id: string;
  score: number;    // 0–100
  raw: string;
  label: string;
}

interface BenchmarkResult {
  steps: StepResult[];
  total: number;
  grade: string;
  comparison: { hz: number; match: boolean }[];
  recommendations: string[];
}

const STEPS: BenchmarkStep[] = [
  { id: 'refresh',   name: 'Refresh Rate Accuracy',      description: 'Measuring your display\'s exact refresh rate via RAF timing.',          duration: 3000, icon: '⚡' },
  { id: 'frames',    name: 'Frame Consistency',           description: 'Testing frame delivery regularity over 3 seconds.',                     duration: 3000, icon: '📊' },
  { id: 'motion',    name: 'Motion Smoothness',           description: 'Evaluating animation frame timing precision.',                           duration: 2500, icon: '🎯' },
  { id: 'latency',   name: 'Browser Render Latency',      description: 'Measuring the time between script execution and display.',               duration: 2500, icon: '⏱️' },
  { id: 'render',    name: 'Rendering Performance',       description: 'Stress-testing the browser\'s compositing engine.',                      duration: 2000, icon: '🔬' },
  { id: 'animation', name: 'Animation Frame Rate',        description: 'Counting dropped frames during a rapid animation sequence.',             duration: 2000, icon: '🎬' },
  { id: 'response',  name: 'Display Responsiveness',      description: 'Estimating visual feedback delay based on frame budget.',                duration: 1500, icon: '🖥️' },
];

const GRADES = [
  { min: 95, grade: 'A+', color: '#00ff87' },
  { min: 85, grade: 'A',  color: '#00e5ff' },
  { min: 75, grade: 'B+', color: '#7928ca' },
  { min: 65, grade: 'B',  color: '#7928ca' },
  { min: 55, grade: 'C',  color: '#f5a623' },
  { min: 0,  grade: 'D',  color: '#ff4444' },
];

function getGrade(score: number) {
  return GRADES.find(g => score >= g.min) || GRADES[GRADES.length - 1];
}

function getHzComparison(hz: number) {
  return [60, 75, 120, 144, 165, 240, 360].map(std => ({
    hz: std,
    match: Math.abs(hz - std) < std * 0.05,
  }));
}

function generateRecommendations(results: StepResult[], hz: number): string[] {
  const recs: string[] = [];
  const refresh = results.find(r => r.id === 'refresh');
  const frames  = results.find(r => r.id === 'frames');
  const latency = results.find(r => r.id === 'latency');

  if (hz <= 60) recs.push('Upgrade to a 144Hz or higher monitor for a dramatically smoother gaming experience.');
  if (hz <= 75) recs.push('A 120Hz+ display would cut your frame time in half, reducing motion blur significantly.');
  if (frames && frames.score < 70) recs.push('Frame consistency is low. Try closing background apps and disabling browser extensions.');
  if (latency && latency.score < 70) recs.push('Enable hardware acceleration in your browser for lower render latency.');
  if (hz >= 144) recs.push('Great refresh rate! Enable G-Sync or FreeSync to eliminate screen tearing at high FPS.');
  if (hz >= 240) recs.push('Elite-tier display. Make sure your GPU can sustain 240+ FPS in your games to fully utilize it.');
  if (recs.length === 0) recs.push('Your display is performing well. Keep background tasks minimal for best results.');
  return recs;
}

export default function BenchmarkSession() {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepProgress, setStepProgress] = useState(0);
  const [completedResults, setCompletedResults] = useState<StepResult[]>([]);
  const [finalResult, setFinalResult] = useState<BenchmarkResult | null>(null);
  const abortRef = useRef(false);

  const runBenchmark = async () => {
    abortRef.current = false;
    setPhase('running');
    setCurrentStep(0);
    setStepProgress(0);
    setCompletedResults([]);
    setFinalResult(null);

    const results: StepResult[] = [];
    let detectedHz = 60;

    for (let i = 0; i < STEPS.length; i++) {
      if (abortRef.current) break;
      const step = STEPS[i];
      setCurrentStep(i);
      setStepProgress(0);

      const result = await runStep(step, (progress) => {
        if (!abortRef.current) setStepProgress(progress);
      }, detectedHz);

      if (step.id === 'refresh') detectedHz = parseFloat(result.raw) || 60;
      results.push(result);
      setCompletedResults([...results]);
      setStepProgress(100);
      await sleep(200);
    }

    if (!abortRef.current) {
      const total = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length);
      setFinalResult({
        steps: results,
        total,
        grade: getGrade(total).grade,
        comparison: getHzComparison(detectedHz),
        recommendations: generateRecommendations(results, detectedHz),
      });
      setPhase('done');
    }
  };

  const reset = () => {
    abortRef.current = true;
    setPhase('idle');
    setCurrentStep(-1);
    setStepProgress(0);
    setCompletedResults([]);
    setFinalResult(null);
  };

  const overallGrade = finalResult ? getGrade(finalResult.total) : null;

  return (
    <div style={{ width: '100%', maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
          fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--primary)', marginBottom: '0.75rem',
        }}>
          ScreenHz Benchmark Suite
        </div>
        <h1 style={{ font: 'var(--font-display-lg)', letterSpacing: 'var(--tracking-tighter)', color: 'var(--ink)', marginBottom: '0.75rem' }}>
          Display Performance Score
        </h1>
        <p style={{ font: 'var(--font-body-lg)', color: 'var(--body)', maxWidth: '520px', margin: '0 auto' }}>
          7 sequential tests evaluate your monitor's refresh rate, frame consistency, motion smoothness, and rendering performance.
        </p>
      </div>

      {/* Idle state */}
      {phase === 'idle' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem', marginBottom: '2.5rem', textAlign: 'left',
          }}>
            {STEPS.map((step, i) => (
              <div key={step.id} style={{
                padding: '1rem 1.25rem',
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 'var(--rounded-lg)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{step.icon}</span>
                <div>
                  <div style={{ font: 'var(--font-body-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.2rem' }}>{step.name}</div>
                  <div style={{ font: 'var(--font-body-sm)', color: 'var(--mute)', fontSize: '0.75rem', lineHeight: 1.5 }}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            id="start-benchmark-btn"
            onClick={runBenchmark}
            className="btn-primary"
            style={{ fontSize: '1rem', padding: '0.9rem 2.5rem', borderRadius: 'var(--rounded-pill)' }}
          >
            ⚡ Start Full Benchmark
          </button>
          <p style={{ font: 'var(--font-body-sm)', color: 'var(--mute)', marginTop: '0.75rem' }}>
            Takes about 20 seconds · Keep this tab active
          </p>
        </div>
      )}

      {/* Running state */}
      {phase === 'running' && (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            {STEPS.map((step, i) => {
              const isDone = i < currentStep;
              const isActive = i === currentStep;
              const isPending = i > currentStep;
              const result = completedResults[i];

              return (
                <div key={step.id} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem', marginBottom: '0.5rem',
                  background: isActive ? 'rgba(0,229,255,0.05)' : 'var(--card-bg)',
                  border: `1px solid ${isActive ? 'var(--hairline-accent)' : 'var(--card-border)'}`,
                  borderRadius: 'var(--rounded-lg)',
                  transition: 'all 0.3s',
                  opacity: isPending ? 0.4 : 1,
                }}>
                  {/* Status icon */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? 'rgba(0,255,135,0.1)' : isActive ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                    border: `1px solid ${isDone ? 'rgba(0,255,135,0.3)' : isActive ? 'var(--hairline-accent)' : 'var(--hairline)'}`,
                    fontSize: '0.9rem', flexShrink: 0,
                    position: 'relative',
                  }}>
                    {isDone ? '✓' : isActive ? (
                      <span style={{ animation: 'spin-slow 1.5s linear infinite', display: 'block' }}>⚙</span>
                    ) : step.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ font: 'var(--font-body-sm)', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {step.name}
                      </span>
                      {isDone && result && (
                        <span style={{
                          font: 'var(--font-caption-mono)', fontWeight: 700,
                          color: result.score >= 80 ? '#00ff87' : result.score >= 60 ? '#00e5ff' : '#f5a623',
                          flexShrink: 0,
                        }}>
                          {result.score}/100
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <div style={{
                          height: '4px', background: 'var(--surface2)',
                          borderRadius: 'var(--rounded-full)', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 'var(--rounded-full)',
                            background: 'linear-gradient(90deg, var(--violet), var(--primary))',
                            width: `${stepProgress}%`,
                            transition: 'width 0.1s linear',
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={reset} style={{
              background: 'transparent', border: '1px solid var(--hairline)',
              color: 'var(--mute)', padding: '0.5rem 1.25rem',
              borderRadius: 'var(--rounded-pill)', cursor: 'pointer',
              font: 'var(--font-body-sm)',
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {phase === 'done' && finalResult && overallGrade && (
        <div>
          {/* Score hero */}
          <div style={{
            textAlign: 'center', padding: '2.5rem',
            background: 'var(--card-bg)', border: '1px solid var(--hairline-accent)',
            borderRadius: 'var(--rounded-2xl)', marginBottom: '2rem',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
              width: '300px', height: '200px', borderRadius: '50%',
              background: `radial-gradient(circle, ${overallGrade.color}14 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <div style={{
              fontFamily: "'Outfit', sans-serif", fontSize: '5rem', fontWeight: 900,
              letterSpacing: '-0.05em', lineHeight: 1,
              color: overallGrade.color,
              textShadow: `0 0 32px ${overallGrade.color}60`,
            }}>
              {finalResult.total}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--mute)', margin: '0.25rem 0 0.75rem',
            }}>
              out of 100
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '56px', height: '56px', borderRadius: '50%',
              border: `2px solid ${overallGrade.color}`,
              fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 900,
              color: overallGrade.color, background: `${overallGrade.color}12`,
              boxShadow: `0 0 24px ${overallGrade.color}40`,
            }}>
              {overallGrade.grade}
            </div>
          </div>

          {/* Category scores */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.75rem', marginBottom: '1.5rem',
          }}>
            {finalResult.steps.map(step => {
              const stepDef = STEPS.find(s => s.id === step.id)!;
              const g = getGrade(step.score);
              return (
                <div key={step.id} style={{
                  padding: '1rem 1.25rem',
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                  borderRadius: 'var(--rounded-lg)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ font: 'var(--font-caption-mono)', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {stepDef.icon} {step.label}
                    </span>
                    <span style={{ font: 'var(--font-caption-mono)', fontWeight: 700, color: g.color }}>
                      {step.score}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--surface2)', borderRadius: 'var(--rounded-full)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${step.score}%`,
                      background: `linear-gradient(90deg, ${g.color}80, ${g.color})`,
                      borderRadius: 'var(--rounded-full)',
                      transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                  <div style={{ font: 'var(--font-caption-mono)', color: 'var(--mute)', marginTop: '0.35rem', fontSize: '0.7rem' }}>
                    {step.raw}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hz comparison */}
          <div style={{
            padding: '1.5rem',
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 'var(--rounded-xl)', marginBottom: '1.5rem',
          }}>
            <div style={{ font: 'var(--font-caption-mono)', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              Refresh Rate Comparison
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {finalResult.comparison.map(c => (
                <div key={c.hz} style={{
                  padding: '0.4rem 0.9rem', borderRadius: 'var(--rounded-pill)',
                  border: `1px solid ${c.match ? 'rgba(0,255,135,0.4)' : 'var(--hairline)'}`,
                  background: c.match ? 'rgba(0,255,135,0.08)' : 'transparent',
                  font: 'var(--font-caption-mono)', fontWeight: c.match ? 700 : 400,
                  color: c.match ? '#00ff87' : 'var(--mute)',
                }}>
                  {c.hz}Hz {c.match ? '✓' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div style={{
            padding: '1.5rem',
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 'var(--rounded-xl)', marginBottom: '2rem',
          }}>
            <div style={{ font: 'var(--font-caption-mono)', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              💡 Recommendations
            </div>
            {finalResult.recommendations.map((rec, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                paddingBottom: i < finalResult.recommendations.length - 1 ? '0.75rem' : '0',
                marginBottom: i < finalResult.recommendations.length - 1 ? '0.75rem' : '0',
                borderBottom: i < finalResult.recommendations.length - 1 ? '1px solid var(--hairline)' : 'none',
              }}>
                <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>→</span>
                <span style={{ font: 'var(--font-body-sm)', color: 'var(--body)', lineHeight: 1.65 }}>{rec}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="share-benchmark-btn"
              onClick={() => {
                const url = `${window.location.href}?score=${finalResult.total}&grade=${finalResult.grade}`;
                navigator.clipboard?.writeText(url).then(() => alert('Link copied to clipboard!'));
              }}
              className="btn-secondary"
            >
              🔗 Share Results
            </button>
            <button
              id="rerun-benchmark-btn"
              onClick={reset}
              className="btn-primary"
            >
              🔄 Run Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step Measurement Logic ───────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

async function runStep(
  step: BenchmarkStep,
  onProgress: (p: number) => void,
  detectedHz: number
): Promise<StepResult> {
  const start = performance.now();
  const duration = step.duration;

  switch (step.id) {
    case 'refresh': {
      const times: number[] = [];
      let last = performance.now();
      return new Promise(resolve => {
        const STANDARDS = [60, 75, 90, 100, 120, 144, 165, 180, 240, 300, 360];
        const loop = (now: number) => {
          const elapsed = now - start;
          onProgress(Math.min(99, (elapsed / duration) * 100));
          const delta = now - last;
          last = now;
          if (delta > 1 && delta < 200) times.push(delta);

          if (elapsed >= duration) {
            const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 16.67;
            const measured = 1000 / avg;
            const snapped = STANDARDS.reduce((a, b) => Math.abs(b - measured) < Math.abs(a - measured) ? b : a);
            const deviation = Math.abs(measured - snapped) / snapped;
            const score = Math.round(Math.max(0, 100 - deviation * 500));
            resolve({ id: 'refresh', score: Math.min(100, score), raw: `${snapped}Hz`, label: 'Refresh Rate' });
            return;
          }
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      });
    }

    case 'frames': {
      const intervals: number[] = [];
      let last = performance.now();
      return new Promise(resolve => {
        const loop = (now: number) => {
          const elapsed = now - start;
          onProgress(Math.min(99, (elapsed / duration) * 100));
          const delta = now - last;
          last = now;
          if (delta > 1 && delta < 200) intervals.push(delta);

          if (elapsed >= duration) {
            if (intervals.length < 5) {
              resolve({ id: 'frames', score: 50, raw: 'Insufficient data', label: 'Frame Consistency' });
              return;
            }
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length;
            const stdDev = Math.sqrt(variance);
            const jitterScore = Math.max(0, 100 - (stdDev / avg) * 300);
            resolve({ id: 'frames', score: Math.round(Math.min(100, jitterScore)), raw: `±${stdDev.toFixed(2)}ms jitter`, label: 'Frame Consistency' });
            return;
          }
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      });
    }

    case 'motion': {
      const drops: number[] = [];
      let prevTime = performance.now();
      const expectedInterval = 1000 / Math.max(60, detectedHz);
      return new Promise(resolve => {
        const loop = (now: number) => {
          const elapsed = now - start;
          onProgress(Math.min(99, (elapsed / duration) * 100));
          const delta = now - prevTime;
          prevTime = now;
          if (delta > expectedInterval * 1.5) drops.push(delta);

          if (elapsed >= duration) {
            const totalFrames = Math.round(elapsed / expectedInterval);
            const dropRate = drops.length / Math.max(1, totalFrames);
            const score = Math.max(0, Math.round(100 - dropRate * 500));
            resolve({ id: 'motion', score: Math.min(100, score), raw: `${drops.length} dropped frames`, label: 'Motion Smoothness' });
            return;
          }
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      });
    }

    case 'latency': {
      const measurements: number[] = [];
      return new Promise(async resolve => {
        for (let i = 0; i < 20; i++) {
          if (performance.now() - start >= duration) break;
          onProgress(Math.min(99, (i / 20) * 100));
          const t0 = performance.now();
          await new Promise(r => requestAnimationFrame(r));
          measurements.push(performance.now() - t0);
          await sleep(50);
        }
        const avg = measurements.length ? measurements.reduce((a, b) => a + b, 0) / measurements.length : 16;
        const expectedLatency = 1000 / Math.max(60, detectedHz);
        const ratio = avg / expectedLatency;
        const score = Math.round(Math.max(0, Math.min(100, 100 - (ratio - 1) * 100)));
        resolve({ id: 'latency', score, raw: `${avg.toFixed(2)}ms avg`, label: 'Render Latency' });
      });
    }

    case 'render': {
      // Stress test: count frames rendered in duration
      let frames = 0;
      return new Promise(resolve => {
        const loop = (now: number) => {
          const elapsed = now - start;
          onProgress(Math.min(99, (elapsed / duration) * 100));
          frames++;
          if (elapsed >= duration) {
            const expectedFrames = (duration / 1000) * Math.max(60, detectedHz);
            const ratio = frames / expectedFrames;
            const score = Math.round(Math.min(100, ratio * 90));
            resolve({ id: 'render', score, raw: `${frames} frames rendered`, label: 'Render Perf' });
            return;
          }
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      });
    }

    case 'animation': {
      let frameCount = 0;
      let dropped = 0;
      let prevT = performance.now();
      const target = 1000 / Math.max(60, detectedHz);
      return new Promise(resolve => {
        const loop = (now: number) => {
          const elapsed = now - start;
          onProgress(Math.min(99, (elapsed / duration) * 100));
          const delta = now - prevT;
          prevT = now;
          frameCount++;
          if (delta > target * 1.8) dropped++;
          if (elapsed >= duration) {
            const dropPct = dropped / Math.max(1, frameCount);
            const score = Math.round(Math.max(0, (1 - dropPct * 5) * 100));
            resolve({ id: 'animation', score: Math.min(100, score), raw: `${dropped}/${frameCount} dropped`, label: 'Animation FPS' });
            return;
          }
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      });
    }

    case 'response': {
      // Score based on Hz tier
      await sleep(duration);
      onProgress(100);
      const score = detectedHz >= 360 ? 100 : detectedHz >= 240 ? 95 : detectedHz >= 144 ? 85 :
                    detectedHz >= 120 ? 75 : detectedHz >= 90 ? 65 : detectedHz >= 75 ? 55 : 40;
      return { id: 'response', score, raw: `${detectedHz}Hz display tier`, label: 'Screen Response' };
    }

    default:
      await sleep(duration);
      return { id: step.id, score: 75, raw: '—', label: step.name };
  }
}
