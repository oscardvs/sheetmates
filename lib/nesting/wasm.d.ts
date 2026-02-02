/**
 * Type declarations for WASM nesting module
 */

// Declare the WASM module that will be loaded at runtime
declare module "/wasm/libnest2d.js" {
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

  function LibNest2D(): Promise<LibNest2DModule>;
  export default LibNest2D;
}

// Allow .wasm imports
declare module "*.wasm" {
  const content: WebAssembly.Module;
  export default content;
}
