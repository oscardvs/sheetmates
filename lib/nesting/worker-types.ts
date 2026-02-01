/**
 * Web Worker Types for Nesting
 * Defines the message protocol between main thread and worker
 */

// ============================================================================
// Input Messages (Main Thread → Worker)
// ============================================================================

export interface NestRequestPayload {
  sheet: {
    width: number;
    height: number;
  };
  parts: Array<{
    id: string;
    width: number;
    height: number;
    quantity: number;
    /** Optional polygon points [x0, y0, x1, y1, ...] for true-shape nesting */
    polygon?: number[];
  }>;
  config: {
    spacing: number;
    rotationSteps: number;
    iterations: number;
    populationSize: number;
    mutationRate: number;
  };
}

export interface NestMessage {
  type: "NEST";
  payload: NestRequestPayload;
}

export interface CancelMessage {
  type: "CANCEL";
}

export type WorkerInputMessage = NestMessage | CancelMessage;

// ============================================================================
// Output Messages (Worker → Main Thread)
// ============================================================================

export interface ProgressPayload {
  iteration: number;
  totalIterations: number;
  currentUtilization: number;
}

export interface ProgressMessage {
  type: "PROGRESS";
  payload: ProgressPayload;
}

export interface NestResultPayload {
  placements: Array<{
    partId: string;
    sheetIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }>;
  sheetsUsed: number;
  utilization: number[];
  iterationsRun: number;
  algorithm: "wasm" | "shelf-pack";
}

export interface ResultMessage {
  type: "RESULT";
  payload: NestResultPayload;
}

export interface ErrorPayload {
  message: string;
  code: "WASM_LOAD_FAILED" | "NESTING_FAILED" | "CANCELLED" | "UNKNOWN";
}

export interface ErrorMessage {
  type: "ERROR";
  payload: ErrorPayload;
}

export interface ReadyMessage {
  type: "READY";
  payload: {
    wasmAvailable: boolean;
  };
}

export type WorkerOutputMessage =
  | ProgressMessage
  | ResultMessage
  | ErrorMessage
  | ReadyMessage;

// ============================================================================
// Nesting State
// ============================================================================

export interface NestingProgress {
  iteration: number;
  totalIterations: number;
  utilization: number;
}

export interface NestingState {
  isLoading: boolean;
  isNesting: boolean;
  progress: NestingProgress | null;
  error: string | null;
  wasmAvailable: boolean;
}
