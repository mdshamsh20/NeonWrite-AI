export interface Point {
  x: number;
  y: number;
  z?: number;
}

export class MovingAverageFilter {
  private windowSize: number;
  private history: Point[] = [];

  constructor(windowSize: number = 5) {
    this.windowSize = windowSize;
  }

  public add(point: Point): Point {
    // Only add point if history is empty, OR if distance from last point is greater than jitter threshold (ignore tiny noise)
    if (this.history.length > 0) {
      const last = this.history[this.history.length - 1];
      const dist = Math.sqrt(Math.pow(point.x - last.x, 2) + Math.pow(point.y - last.y, 2));
      if (dist < 1.0) { // If movement is less than 1 pixel, ignore it to prevent jitter
        return this.getAverage(); 
      }
    }

    this.history.push(point);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }
    return this.getAverage();
  }

  public getAverage(): Point {
    if (this.history.length === 0) return { x: 0, y: 0, z: 0 };
    
    const sum = this.history.reduce(
      (acc, curr) => ({ 
        x: acc.x + curr.x, 
        y: acc.y + curr.y, 
        z: (acc.z || 0) + (curr.z || 0) 
      }),
      { x: 0, y: 0, z: 0 }
    );
    
    return {
      x: sum.x / this.history.length,
      y: sum.y / this.history.length,
      z: (sum.z || 0) / this.history.length
    };
  }

  public reset(): void {
    this.history = [];
  }
}
