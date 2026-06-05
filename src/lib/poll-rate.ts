export const KNOWN_POLL_RATES = [125, 250, 500, 1000, 2000, 4000, 8000];

export interface PollRateResult {
  raw: number;
  snapped: number;
  confidence: number;
}

export class PollRateDetector {
  private timestamps: number[] = [];
  private maxSamples = 60;

  public addSample(timestamp: number): PollRateResult {
    this.timestamps.push(timestamp);
    if (this.timestamps.length > this.maxSamples) {
      this.timestamps.shift();
    }

    if (this.timestamps.length < 10) {
      return { raw: 0, snapped: 0, confidence: 0 };
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.timestamps.length; i++) {
      intervals.push(this.timestamps[i] - this.timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const rawRate = 1000 / avgInterval;

    let snapped = rawRate;
    for (const rate of KNOWN_POLL_RATES) {
      if (Math.abs(rawRate - rate) < rate * 0.15) {
        snapped = rate;
        break;
      }
    }

    return {
      raw: rawRate,
      snapped,
      confidence: Math.min(this.timestamps.length / this.maxSamples, 1)
    };
  }

  public getIntervals(): number[] {
    const intervals: number[] = [];
    for (let i = 1; i < this.timestamps.length; i++) {
      intervals.push(this.timestamps[i] - this.timestamps[i - 1]);
    }
    return intervals;
  }

  public reset() {
    this.timestamps = [];
  }
}
