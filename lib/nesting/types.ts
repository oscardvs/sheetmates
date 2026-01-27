export interface NestingPart {
  id: string;
  width: number;
  height: number;
  quantity: number;
  svgPath: string;
}

export interface NestingSheet {
  width: number;
  height: number;
}

export interface NestingPlacement {
  partId: string;
  sheetIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0 or 90
}

export interface NestingResult {
  placements: NestingPlacement[];
  sheetsUsed: number;
  utilization: number[];
}
