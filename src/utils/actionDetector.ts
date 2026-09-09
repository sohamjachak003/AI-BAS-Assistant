/**
 * Optical Activity & Action Detector for Webcam Feed
 * Computes frame-by-frame pixel differentials inside the Sample Tray Region of Interest (ROI).
 */

export interface ROIBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class WebcamActionAnalyzer {
  private prevImageData: ImageData | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 320;
    this.canvas.height = 240;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Analyzes current video frame to calculate motion score in ROI
   */
  public analyzeFrame(
    video: HTMLVideoElement,
    roiFraction: { x: number; y: number; w: number; h: number } = { x: 0.2, y: 0.3, w: 0.6, h: 0.55 }
  ): { motionScore: number; activePixelCount: number } {
    if (!this.ctx || video.readyState < 2) {
      return { motionScore: 0, activePixelCount: 0 };
    }

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Draw video frame to small offscreen canvas
    this.ctx.drawImage(video, 0, 0, w, h);

    const rx = Math.floor(w * roiFraction.x);
    const ry = Math.floor(h * roiFraction.y);
    const rw = Math.floor(w * roiFraction.w);
    const rh = Math.floor(h * roiFraction.h);

    try {
      const currentData = this.ctx.getImageData(rx, ry, rw, rh);
      let activePixels = 0;
      const totalPixels = rw * rh;

      if (this.prevImageData && this.prevImageData.data.length === currentData.data.length) {
        const curr = currentData.data;
        const prev = this.prevImageData.data;
        const threshold = 35; // Pixel difference sensitivity threshold

        for (let i = 0; i < curr.length; i += 4) {
          const dr = Math.abs(curr[i] - prev[i]);
          const dg = Math.abs(curr[i + 1] - prev[i + 1]);
          const db = Math.abs(curr[i + 2] - prev[i + 2]);
          const diff = (dr + dg + db) / 3;

          if (diff > threshold) {
            activePixels++;
          }
        }
      }

      this.prevImageData = currentData;
      const motionScore = totalPixels > 0 ? (activePixels / totalPixels) * 100 : 0;
      return {
        motionScore: Math.min(100, Math.round(motionScore * 10) / 10),
        activePixelCount: activePixels,
      };
    } catch {
      return { motionScore: 0, activePixelCount: 0 };
    }
  }

  public reset() {
    this.prevImageData = null;
  }
}
