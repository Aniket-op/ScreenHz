export const KNOWN_HZ = [60, 75, 90, 100, 120, 144, 165, 240, 360, 480, 540];

export interface HzResult {
  raw: number;
  snapped: number;
  confidence: number;
  frameTimes: number[];
}

export class HzDetector {
  private frameTimes: number[] = [];
  private maxFrames = 120;
  private lastTime = 0;

  public update(timestamp: number): HzResult {
    if (this.lastTime > 0) {
      const delta = timestamp - this.lastTime;
      this.frameTimes.push(delta);
      if (this.frameTimes.length > this.maxFrames) {
        this.frameTimes.shift();
      }
    }
    this.lastTime = timestamp;

    const avgDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const rawFps = 1000 / avgDelta;
    
    let snapped = rawFps;
    for (const hz of KNOWN_HZ) {
      if (Math.abs(rawFps - hz) < 5) {
        snapped = hz;
        break;
      }
    }

    return {
      raw: rawFps,
      snapped,
      confidence: Math.min(this.frameTimes.length / this.maxFrames, 1),
      frameTimes: [...this.frameTimes]
    };
  }

  public getLastResult(): HzResult {
    const avgDelta = this.frameTimes.length > 0 ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length : 16.66;
    const rawFps = 1000 / avgDelta;
    let snapped = rawFps;
    for (const hz of KNOWN_HZ) {
      if (Math.abs(rawFps - hz) < 5) {
        snapped = hz;
        break;
      }
    }
    return {
      raw: rawFps,
      snapped,
      confidence: Math.min(this.frameTimes.length / this.maxFrames, 1),
      frameTimes: [...this.frameTimes]
    };
  }

  public reset() {
    this.frameTimes = [];
    this.lastTime = 0;
  }
}
