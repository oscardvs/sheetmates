/**
 * Nesting Web Worker
 *
 * Runs nesting algorithm off the main thread using:
 * 1. WASM libnest2d (if available) - true-shape NFP nesting with genetic optimization
 * 2. JavaScript shelf-packer (fallback) - FFDH algorithm
 *
 * Message Protocol:
 * - Input: NEST (start nesting), CANCEL (abort)
 * - Output: READY, PROGRESS, RESULT, ERROR
 */

// Type declarations for WASM module are defined inline below

import type {
  WorkerInputMessage,
  WorkerOutputMessage,
  NestRequestPayload,
  NestResultPayload,
} from "./worker-types";
import type { NestingPart, NestingSheet, NestingResult } from "./types";

// Worker state
let wasmModule: LibNest2DModule | null = null;
let wasmAvailable = false;
let isCancelled = false;

// WASM module types (matches bindings.cpp exports)
interface LibNest2DModule {
  SimpleNester: new (config: WasmNestConfig) => WasmNester;
}

interface WasmNestConfig {
  sheetWidth: number;
  sheetHeight: number;
  spacing: number;
  rotationSteps: number;
  iterations: number;
  populationSize: number;
  mutationRate: number;
}

interface WasmNester {
  nest: (
    parts: WasmNestPart[],
    progressCallback: (
      iteration: number,
      total: number,
      utilization: number
    ) => void
  ) => WasmNestResult;
}

interface WasmNestPart {
  id: string;
  polygon: { points: number[] };
  quantity: number;
}

interface WasmNestResult {
  placements: Array<{
    partId: string;
    sheetIndex: number;
    x: number;
    y: number;
    rotation: number;
  }>;
  sheetsUsed: number;
  utilization: number[];
  iterationsRun: number;
}

// ============================================================================
// Message Handlers
// ============================================================================

function postMessage(message: WorkerOutputMessage): void {
  self.postMessage(message);
}

function reportProgress(
  iteration: number,
  totalIterations: number,
  currentUtilization: number
): void {
  postMessage({
    type: "PROGRESS",
    payload: { iteration, totalIterations, currentUtilization },
  });
}

function reportError(
  message: string,
  code: "WASM_LOAD_FAILED" | "NESTING_FAILED" | "CANCELLED" | "UNKNOWN"
): void {
  postMessage({
    type: "ERROR",
    payload: { message, code },
  });
}

function reportResult(payload: NestResultPayload): void {
  postMessage({
    type: "RESULT",
    payload,
  });
}

// ============================================================================
// WASM Loading
// ============================================================================

async function loadWasmModule(): Promise<boolean> {
  try {
    // Dynamic import of WASM module
    // The module is expected at /wasm/libnest2d.js
    // @ts-expect-error - Module loaded dynamically at runtime from public folder
    const LibNest2D = await import(/* webpackIgnore: true */ "/wasm/libnest2d.js");
    wasmModule = await LibNest2D.default();
    return true;
  } catch (error) {
    console.warn("WASM nesting module not available, using fallback:", error);
    return false;
  }
}

// ============================================================================
// Shelf-Packer Fallback (JavaScript)
// ============================================================================

interface Shelf {
  y: number;
  height: number;
  xCursor: number;
}

interface SheetState {
  shelves: Shelf[];
  sheetIndex: number;
}

function shelfPackFallback(
  parts: NestingPart[],
  sheet: NestingSheet,
  kerfMm: number,
  iterations: number
): NestingResult {
  const kerf = kerfMm;

  // Expand parts by quantity and sort by height descending
  const expanded: { id: string; width: number; height: number }[] = [];
  for (const part of parts) {
    for (let i = 0; i < part.quantity; i++) {
      expanded.push({ id: part.id, width: part.width, height: part.height });
    }
  }
  expanded.sort((a, b) => b.height - a.height);

  const placements: NestingResult["placements"] = [];
  const sheets: SheetState[] = [];

  function getOrCreateSheet(index: number): SheetState {
    while (sheets.length <= index) {
      sheets.push({ shelves: [], sheetIndex: sheets.length });
    }
    return sheets[index];
  }

  function tryPlace(
    sheetState: SheetState,
    w: number,
    h: number
  ): { x: number; y: number } | null {
    // Try existing shelves
    for (const shelf of sheetState.shelves) {
      if (h <= shelf.height && shelf.xCursor + w + kerf <= sheet.width) {
        const x = shelf.xCursor;
        shelf.xCursor += w + kerf;
        return { x, y: shelf.y };
      }
    }

    // Try new shelf
    const currentHeight = sheetState.shelves.reduce(
      (sum, s) => Math.max(sum, s.y + s.height),
      0
    );
    if (currentHeight + h + kerf <= sheet.height && w + kerf <= sheet.width) {
      const newShelf: Shelf = {
        y: currentHeight + (currentHeight > 0 ? kerf : 0),
        height: h,
        xCursor: w + kerf,
      };
      sheetState.shelves.push(newShelf);
      return { x: 0, y: newShelf.y };
    }

    return null;
  }

  let placedCount = 0;
  const totalParts = expanded.length;

  for (const item of expanded) {
    if (isCancelled) {
      break;
    }

    let placed = false;

    for (let si = 0; si < sheets.length && !placed; si++) {
      const sheetState = sheets[si];

      // Try original orientation
      const pos = tryPlace(sheetState, item.width, item.height);
      if (pos) {
        placements.push({
          partId: item.id,
          sheetIndex: si,
          x: pos.x,
          y: pos.y,
          width: item.width,
          height: item.height,
          rotation: 0,
        });
        placed = true;
        break;
      }

      // Try 90-degree rotation
      const posR = tryPlace(sheetState, item.height, item.width);
      if (posR) {
        placements.push({
          partId: item.id,
          sheetIndex: si,
          x: posR.x,
          y: posR.y,
          width: item.height,
          height: item.width,
          rotation: 90,
        });
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Create new sheet
      const newSheet = getOrCreateSheet(sheets.length);

      const pos = tryPlace(newSheet, item.width, item.height);
      if (pos) {
        placements.push({
          partId: item.id,
          sheetIndex: newSheet.sheetIndex,
          x: pos.x,
          y: pos.y,
          width: item.width,
          height: item.height,
          rotation: 0,
        });
      } else {
        const posR = tryPlace(newSheet, item.height, item.width);
        if (posR) {
          placements.push({
            partId: item.id,
            sheetIndex: newSheet.sheetIndex,
            x: posR.x,
            y: posR.y,
            width: item.height,
            height: item.width,
            rotation: 90,
          });
        }
      }
    }

    placedCount++;

    // Report progress periodically
    if (placedCount % 10 === 0 || placedCount === totalParts) {
      const progress = Math.round((placedCount / totalParts) * iterations);
      reportProgress(progress, iterations, calculateUtilization(placements, sheet));
    }
  }

  // Calculate utilization per sheet
  const utilization: number[] = [];
  for (let s = 0; s < sheets.length; s++) {
    const sheetPlacements = placements.filter((p) => p.sheetIndex === s);
    const usedArea = sheetPlacements.reduce(
      (sum, p) => sum + p.width * p.height,
      0
    );
    utilization.push(usedArea / (sheet.width * sheet.height));
  }

  return {
    placements,
    sheetsUsed: sheets.length,
    utilization,
  };
}

function calculateUtilization(
  placements: NestingResult["placements"],
  sheet: NestingSheet
): number {
  if (placements.length === 0) return 0;
  const maxSheet = Math.max(...placements.map((p) => p.sheetIndex)) + 1;
  const totalArea = placements.reduce((sum, p) => sum + p.width * p.height, 0);
  return totalArea / (sheet.width * sheet.height * maxSheet);
}

// ============================================================================
// WASM Nesting
// ============================================================================

function nestWithWasm(request: NestRequestPayload): NestResultPayload {
  if (!wasmModule) {
    throw new Error("WASM module not loaded");
  }

  const config: WasmNestConfig = {
    sheetWidth: request.sheet.width,
    sheetHeight: request.sheet.height,
    spacing: request.config.spacing,
    rotationSteps: request.config.rotationSteps,
    iterations: request.config.iterations,
    populationSize: request.config.populationSize,
    mutationRate: request.config.mutationRate,
  };

  const nester = new wasmModule.SimpleNester(config);

  // Convert parts to WASM format
  const wasmParts: WasmNestPart[] = request.parts.map((p) => ({
    id: p.id,
    polygon: {
      // If polygon provided, use it; otherwise create rectangle
      points: p.polygon ?? [0, 0, p.width, 0, p.width, p.height, 0, p.height],
    },
    quantity: p.quantity,
  }));

  // Run nesting with progress callback
  const result = nester.nest(wasmParts, (iteration, total, utilization) => {
    if (isCancelled) return;
    reportProgress(iteration, total, utilization);
  });

  // Convert result to our format
  return {
    placements: result.placements.map((p) => {
      const part = request.parts.find((rp) => rp.id === p.partId);
      const rotation = (p.rotation * 180) / Math.PI; // Convert radians to degrees
      const isRotated = Math.abs(rotation - 90) < 1 || Math.abs(rotation - 270) < 1;
      return {
        partId: p.partId,
        sheetIndex: p.sheetIndex,
        x: p.x,
        y: p.y,
        width: isRotated ? (part?.height ?? 0) : (part?.width ?? 0),
        height: isRotated ? (part?.width ?? 0) : (part?.height ?? 0),
        rotation: Math.round(rotation) % 360,
      };
    }),
    sheetsUsed: result.sheetsUsed,
    utilization: Array.from(result.utilization),
    iterationsRun: result.iterationsRun,
    algorithm: "wasm",
  };
}

// ============================================================================
// Main Message Handler
// ============================================================================

async function handleMessage(message: WorkerInputMessage): Promise<void> {
  switch (message.type) {
    case "NEST": {
      isCancelled = false;
      const request = message.payload;

      try {
        let result: NestResultPayload;

        if (wasmAvailable && wasmModule) {
          // Use WASM nesting
          result = nestWithWasm(request);
        } else {
          // Fallback to shelf-packer
          const parts: NestingPart[] = request.parts.map((p) => ({
            id: p.id,
            width: p.width,
            height: p.height,
            quantity: p.quantity,
          }));
          const sheet: NestingSheet = request.sheet;
          const jsResult = shelfPackFallback(
            parts,
            sheet,
            request.config.spacing,
            request.config.iterations
          );

          result = {
            ...jsResult,
            iterationsRun: request.config.iterations,
            algorithm: "shelf-pack",
          };
        }

        if (isCancelled) {
          reportError("Nesting cancelled", "CANCELLED");
        } else {
          reportResult(result);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        reportError(errorMessage, "NESTING_FAILED");
      }
      break;
    }

    case "CANCEL": {
      isCancelled = true;
      break;
    }
  }
}

// ============================================================================
// Worker Initialization
// ============================================================================

self.onmessage = (event: MessageEvent<WorkerInputMessage>) => {
  handleMessage(event.data);
};

// Initialize WASM on worker load
(async () => {
  wasmAvailable = await loadWasmModule();
  postMessage({
    type: "READY",
    payload: { wasmAvailable },
  });
})();
