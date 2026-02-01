"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  NestingProgress,
  NestingState,
  NestRequestPayload,
  NestResultPayload,
  WorkerOutputMessage,
} from "./worker-types";
import type { NestingPart, NestingSheet, NestingResult } from "./types";

/**
 * Configuration for the nesting algorithm
 */
export interface NestingConfig {
  /** Gap between parts in mm (default: 2) */
  spacing?: number;
  /** Number of rotation steps (default: 4 = 0°, 90°, 180°, 270°) */
  rotationSteps?: number;
  /** Genetic algorithm iterations (default: 100) */
  iterations?: number;
  /** GA population size (default: 50) */
  populationSize?: number;
  /** GA mutation probability (default: 0.1) */
  mutationRate?: number;
}

const DEFAULT_CONFIG: Required<NestingConfig> = {
  spacing: 2,
  rotationSteps: 4,
  iterations: 100,
  populationSize: 50,
  mutationRate: 0.1,
};

/**
 * Result from the nesting operation
 */
export interface UseNestingResult {
  /** Current nesting state */
  state: NestingState;
  /** Progress information during nesting */
  progress: NestingProgress | null;
  /** Whether WASM module is available */
  wasmAvailable: boolean;
  /** Run the nesting algorithm */
  nest: (
    parts: NestingPart[],
    sheet: NestingSheet,
    config?: NestingConfig
  ) => Promise<NestingResult | null>;
  /** Cancel the current nesting operation */
  cancel: () => void;
  /** Reset error state */
  resetError: () => void;
}

/**
 * Hook for running nesting algorithm via Web Worker
 *
 * Uses WASM libnest2d when available, falls back to JavaScript shelf-packer.
 * Runs off the main thread to keep UI responsive during computation.
 *
 * @example
 * ```tsx
 * const { nest, progress, state } = useWasmNesting();
 *
 * const handleNest = async () => {
 *   const result = await nest(parts, sheet, { iterations: 200 });
 *   if (result) {
 *     // Update canvas with placements
 *   }
 * };
 * ```
 */
export function useWasmNesting(): UseNestingResult {
  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((result: NestingResult | null) => void) | null>(
    null
  );

  const [state, setState] = useState<NestingState>({
    isLoading: true,
    isNesting: false,
    progress: null,
    error: null,
    wasmAvailable: false,
  });

  // Initialize worker
  useEffect(() => {
    // Create worker from the nest-worker.ts file
    // Next.js will bundle this correctly with the worker-loader
    const worker = new Worker(
      new URL("./nest-worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event: MessageEvent<WorkerOutputMessage>) => {
      const message = event.data;

      switch (message.type) {
        case "READY":
          setState((prev) => ({
            ...prev,
            isLoading: false,
            wasmAvailable: message.payload.wasmAvailable,
          }));
          break;

        case "PROGRESS":
          setState((prev) => ({
            ...prev,
            progress: {
              iteration: message.payload.iteration,
              totalIterations: message.payload.totalIterations,
              utilization: message.payload.currentUtilization,
            },
          }));
          break;

        case "RESULT": {
          const result = message.payload;
          setState((prev) => ({
            ...prev,
            isNesting: false,
            progress: null,
          }));

          // Resolve the promise with the result
          if (resolveRef.current) {
            resolveRef.current({
              placements: result.placements,
              sheetsUsed: result.sheetsUsed,
              utilization: result.utilization,
            });
            resolveRef.current = null;
          }
          break;
        }

        case "ERROR":
          setState((prev) => ({
            ...prev,
            isNesting: false,
            progress: null,
            error: message.payload.message,
          }));

          // Resolve with null on error
          if (resolveRef.current) {
            resolveRef.current(null);
            resolveRef.current = null;
          }
          break;
      }
    };

    worker.onerror = (error) => {
      console.error("Nesting worker error:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isNesting: false,
        error: "Worker failed to load",
      }));
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const nest = useCallback(
    async (
      parts: NestingPart[],
      sheet: NestingSheet,
      config?: NestingConfig
    ): Promise<NestingResult | null> => {
      const worker = workerRef.current;
      if (!worker) {
        setState((prev) => ({ ...prev, error: "Worker not initialized" }));
        return null;
      }

      // Merge config with defaults
      const mergedConfig = { ...DEFAULT_CONFIG, ...config };

      // Prepare request payload
      const payload: NestRequestPayload = {
        sheet: {
          width: sheet.width,
          height: sheet.height,
        },
        parts: parts.map((p) => ({
          id: p.id,
          width: p.width,
          height: p.height,
          quantity: p.quantity,
        })),
        config: mergedConfig,
      };

      // Update state
      setState((prev) => ({
        ...prev,
        isNesting: true,
        progress: { iteration: 0, totalIterations: mergedConfig.iterations, utilization: 0 },
        error: null,
      }));

      // Send message to worker
      worker.postMessage({ type: "NEST", payload });

      // Return promise that resolves when worker responds
      return new Promise((resolve) => {
        resolveRef.current = resolve;
      });
    },
    []
  );

  const cancel = useCallback(() => {
    const worker = workerRef.current;
    if (worker && state.isNesting) {
      worker.postMessage({ type: "CANCEL" });
    }
  }, [state.isNesting]);

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    progress: state.progress,
    wasmAvailable: state.wasmAvailable,
    nest,
    cancel,
    resetError,
  };
}

export default useWasmNesting;
