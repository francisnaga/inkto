import { Point, Quad, FilterType } from '@/types/scanner';

class OpenCVBridge {
  private worker: Worker | null = null;
  private isReady = false;
  private pendingRequests = new Map<
    string,
    { resolve: (val: any) => void; reject: (err: Error) => void; timer: any }
  >();
  private seq = 0;

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
          clearTimeout(req.timer);
          this.pendingRequests.delete(id);
          if (type === 'SUCCESS') {
            req.resolve(result);
          } else {
            req.reject(new Error(error || 'Worker operation failed'));
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('OpenCV Web Worker error:', err);
      };
    } catch (e) {
      console.warn('Failed to start scanner worker:', e);
    }
  }

  private dispatch<T>(type: string, payload: any, timeoutMs = 2500, transfer: Transferable[] = []): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        this.initWorker();
      }
      if (!this.worker) {
        return reject(new Error('Web Worker not supported in this browser'));
      }

      const id = `req_${++this.seq}_${Date.now()}`;

      const timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          if (type === 'DETECT_EDGES' && payload?.imageData) {
            const w = payload.imageData.width;
            const h = payload.imageData.height;
            const p = 0.08;
            resolve([
              { x: Math.round(w * p), y: Math.round(h * p) },
              { x: Math.round(w * (1 - p)), y: Math.round(h * p) },
              { x: Math.round(w * (1 - p)), y: Math.round(h * (1 - p)) },
              { x: Math.round(w * p), y: Math.round(h * (1 - p)) }
            ] as unknown as T);
          } else if (type === 'APPLY_FILTER' && payload?.imageData) {
            resolve(payload.imageData as T);
          } else {
            reject(new Error(`Operation ${type} timed out`));
          }
        }
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      try {
        this.worker.postMessage({ id, type, payload }, transfer);
      } catch (e: any) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(e);
      }
    });
  }

  public async detectEdges(canvasOrImageData: HTMLCanvasElement | ImageData): Promise<Quad> {
    let imgData: ImageData;
    if (canvasOrImageData instanceof HTMLCanvasElement) {
      const ctx = canvasOrImageData.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      imgData = ctx.getImageData(0, 0, canvasOrImageData.width, canvasOrImageData.height);
    } else {
      imgData = canvasOrImageData;
    }

    return this.dispatch<Quad>('DETECT_EDGES', { imageData: imgData }, 1500);
  }

  public async warpPerspective(srcCanvas: HTMLCanvasElement, corners: Quad): Promise<HTMLCanvasElement> {
    const ctx = srcCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    const imgData = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

    const warpedImgData = await this.dispatch<ImageData>('WARP_PERSPECTIVE', {
      imageData: imgData,
      corners,
    }, 4000);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = warpedImgData.width;
    outCanvas.height = warpedImgData.height;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) throw new Error('Could not get output context');
    outCtx.putImageData(warpedImgData, 0, 0);

    return outCanvas;
  }

  public async applyFilter(srcCanvas: HTMLCanvasElement, filter: FilterType): Promise<HTMLCanvasElement> {
    if (filter === 'original') return srcCanvas;

    const ctx = srcCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    const imgData = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

    const filteredImgData = await this.dispatch<ImageData>('APPLY_FILTER', {
      imageData: imgData,
      filter,
    }, 4000);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = filteredImgData.width;
    outCanvas.height = filteredImgData.height;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) throw new Error('Could not get output context');
    outCtx.putImageData(filteredImgData, 0, 0);

    return outCanvas;
  }

  public destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.forEach(req => clearTimeout(req.timer));
    this.pendingRequests.clear();
  }
}

export const opencvBridge = new OpenCVBridge();
