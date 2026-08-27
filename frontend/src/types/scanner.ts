export interface Point {
  x: number;
  y: number;
}

export type Quad = [Point, Point, Point, Point]; // [Top-Left, Top-Right, Bottom-Right, Bottom-Left]

export type FilterType = 'magic_color' | 'clean_bw' | 'no_shadow' | 'lighten' | 'original';

export interface ScannedPage {
  id: string;
  originalCanvas: HTMLCanvasElement;
  corners: Quad;
  warpedCanvas: HTMLCanvasElement;
  enhancedCanvas: HTMLCanvasElement;
  filter: FilterType;
  rotation: number; // 0, 90, 180, 270
}

export type ScannerStage = 'camera' | 'crop' | 'filter' | 'batch';
