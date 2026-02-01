import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface CanvasPart {
  id: string;
  partId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  svgPath?: string;
  isSelected: boolean;
  isDragging: boolean;
}

export interface CanvasViewport {
  x: number;
  y: number;
  scale: number;
}

interface CanvasState {
  // Sheet dimensions
  sheetWidth: number;
  sheetHeight: number;

  // Parts on canvas
  parts: CanvasPart[];

  // Viewport (pan/zoom)
  viewport: CanvasViewport;

  // Selection
  selectedPartIds: Set<string>;

  // Interaction state
  isDragging: boolean;
  isPanning: boolean;

  // Grid settings
  gridSize: number;
  snapToGrid: boolean;

  // Actions
  setSheetDimensions: (width: number, height: number) => void;
  addPart: (part: Omit<CanvasPart, "id" | "isSelected" | "isDragging">) => string;
  updatePart: (id: string, updates: Partial<CanvasPart>) => void;
  removePart: (id: string) => void;
  clearParts: () => void;

  selectPart: (id: string, additive?: boolean) => void;
  deselectAll: () => void;

  setViewport: (viewport: Partial<CanvasViewport>) => void;
  resetViewport: () => void;

  setDragging: (isDragging: boolean) => void;
  setPanning: (isPanning: boolean) => void;

  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
}

export const useCanvasStore = create<CanvasState>()(
  subscribeWithSelector((set) => ({
    // Default sheet: 3000x1500mm
    sheetWidth: 3000,
    sheetHeight: 1500,

    // Parts on canvas
    parts: [],

    // Initial viewport: { x: 0, y: 0, scale: 1 }
    viewport: {
      x: 0,
      y: 0,
      scale: 1,
    },

    // Selection
    selectedPartIds: new Set<string>(),

    // Interaction state
    isDragging: false,
    isPanning: false,

    // Default grid: 10mm, snap enabled
    gridSize: 10,
    snapToGrid: true,

    // Actions
    setSheetDimensions: (width: number, height: number) => {
      set({ sheetWidth: width, sheetHeight: height });
    },

    addPart: (part: Omit<CanvasPart, "id" | "isSelected" | "isDragging">) => {
      const id = crypto.randomUUID();
      const newPart: CanvasPart = {
        ...part,
        id,
        isSelected: false,
        isDragging: false,
      };
      set((state) => ({
        parts: [...state.parts, newPart],
      }));
      return id;
    },

    updatePart: (id: string, updates: Partial<CanvasPart>) => {
      set((state) => ({
        parts: state.parts.map((part) =>
          part.id === id ? { ...part, ...updates } : part
        ),
      }));
    },

    removePart: (id: string) => {
      set((state) => {
        const newSelectedPartIds = new Set(state.selectedPartIds);
        newSelectedPartIds.delete(id);
        return {
          parts: state.parts.filter((part) => part.id !== id),
          selectedPartIds: newSelectedPartIds,
        };
      });
    },

    clearParts: () => {
      set({
        parts: [],
        selectedPartIds: new Set<string>(),
      });
    },

    selectPart: (id: string, additive?: boolean) => {
      set((state) => {
        const newSelectedPartIds = additive
          ? new Set(state.selectedPartIds)
          : new Set<string>();

        // Toggle selection if already selected in additive mode
        if (additive && state.selectedPartIds.has(id)) {
          newSelectedPartIds.delete(id);
        } else {
          newSelectedPartIds.add(id);
        }

        return {
          selectedPartIds: newSelectedPartIds,
          parts: state.parts.map((part) => ({
            ...part,
            isSelected: newSelectedPartIds.has(part.id),
          })),
        };
      });
    },

    deselectAll: () => {
      set((state) => ({
        selectedPartIds: new Set<string>(),
        parts: state.parts.map((part) => ({
          ...part,
          isSelected: false,
        })),
      }));
    },

    setViewport: (viewport: Partial<CanvasViewport>) => {
      set((state) => ({
        viewport: { ...state.viewport, ...viewport },
      }));
    },

    resetViewport: () => {
      set({
        viewport: {
          x: 0,
          y: 0,
          scale: 1,
        },
      });
    },

    setDragging: (isDragging: boolean) => {
      set({ isDragging });
    },

    setPanning: (isPanning: boolean) => {
      set({ isPanning });
    },

    toggleSnapToGrid: () => {
      set((state) => ({
        snapToGrid: !state.snapToGrid,
      }));
    },

    setGridSize: (size: number) => {
      set({ gridSize: size });
    },
  }))
);
