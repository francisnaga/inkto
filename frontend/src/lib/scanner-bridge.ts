// Client bridge for OpenCV Web Worker
export interface Pt {
  x: number;
  y: number;
}

export type Quad = [Pt, Pt, Pt, Pt];
export type CamFilter = 'magic_color' | 'bw' | 'no_shadow' | 'lighten' | 'original';

class ScannerBridge {
  private worker: Worker | null = null;
  private isReady = false;
  private pendingRequests = new Map<
    string,
    { resolve: (val: any) => void; reject: (err: Error) => void }
  >();
  private reqSeq = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWorker();
    }
  }

  private initWorker() {
    try {
      this.worker = new Worker('/workers/scanner.worker.js');
      this.worker.onmessage = (e: MessageEvent) => {
        const { id, type, result, error } = e.data;
        if (type === 'CV_READY') {
          this.isReady = true;
          return;
        }

        if (id && this.pendingRequests.has(id)) {
          const req = this.pendingRequests.get(id)!;
          this.pendingRequests.delete(id);
          if (type === 'SUCCESS') {
            req.resolve(result);
          } else {
            req.reject(new Error(error || 'Worker operation failed'));
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('Scanner Web Worker error:', err);
      };
    } catch (e) {
      console.warn('Failed to start scanner worker:', e);
    }
  }

  private dispatch<T>(type: string, payload: any, transfer: Transferable[] = []): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        this.initWorker();
      }
      if (!this.worker) {
        return reject(new Error('Web Worker not supported'));
      }

      const id = `req_${++this.reqSeq}_${Date.now()}`;
      this.pendingRequests.set(id, { resolve, reject });

      try {
        this.worker.postMessage({ id, type, payload }, transfer);
      } catch (e: any) {
        this.pendingRequests.delete(id);
        reject(e);
      }
    });
  }

  // Detect 4 corner points on an image
  public async detectCorners(canvasOrImageData: HTMLCanvasElement | ImageData): Promise<Quad> {
    let imgData: ImageData;
    if (canvasOrImageData instanceof HTMLCanvasElement) {
      const ctx = canvasOrImageData.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas 2d context');
      imgData = ctx.getImageData(0, 0, canvasOrImageData.width, canvasOrImageData.height);
    } else {
      imgData = canvasOrImageData;
    }

    return this.dispatch<Quad>('DETECT_CORNERS', { imageData: imgData });
  }

  // 4-Point Homography Perspective Warp
  public async warp(
    srcCanvas: HTMLCanvasElement,
    corners: Quad
  ): Promise<HTMLCanvasElement> {
    const ctx = srcCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas 2d context');
    const imgData = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

    const warpedImgData = await this.dispatch<ImageData>('WARP', {
      imageData: imgData,
      corners,
    });

    const outCanvas = document.createElement('canvas');
    outCanvas.width = warpedImgData.width;
    outCanvas.height = warpedImgData.height;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) throw new Error('Could not get output canvas context');
    outCtx.putImageData(warpedImgData, 0, 0);

    return outCanvas;
  }

  // Apply CamScanner filter
  public async applyFilter(
    srcCanvas: HTMLCanvasElement,
    filter: CamFilter
  ): Promise<HTMLCanvasElement> {
    if (filter === 'original') return srcCanvas;

    const ctx = srcCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    const imgData = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

    const filteredImgData = await this.dispatch<ImageData>('FILTER', {
      imageData: imgData,
      filter,
    });

    const outCanvas = document.createElement('canvas');
    outCanvas.width = filteredImgData.width;
    outCanvas.height = filteredImgData.height;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) throw new Error('Could not get output canvas context');
    outCtx.putImageData(filteredImgData, 0, 0);

    return outCanvas;
  }

  public destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

export const scannerBridge = new ScannerBridge();
