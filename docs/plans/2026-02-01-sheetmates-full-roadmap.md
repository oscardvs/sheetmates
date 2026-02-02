# SheetMates Full Engineering Roadmap

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete community-driven sheet metal fabrication marketplace that transforms Tech-Centrum's virgin buffer sheets into accessible manufacturing for makers, engineers, and hardware startups.

**Architecture:** Next.js 16 frontend with Firebase backend (Firestore, Auth, Storage). Interactive Konva.js canvas for nesting visualization. Zustand for high-frequency canvas state, TanStack Query for server sync. Dutch Auction pricing with real-time sheet claiming. WASM-based true-shape nesting engine. Stripe for payments with EU VAT compliance.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, Shadcn UI, Konva.js, Zustand, TanStack Query, Firebase (europe-west1), Stripe, WebAssembly (libnest2d)

**Timeline Overview:**
- **Phase 1 (Weeks 1-4):** Core Platform MVP - Canvas, State, Guest Flow
- **Phase 2 (Weeks 5-8):** Dutch Auction + Real-Time Community
- **Phase 3 (Weeks 9-12):** Factory Integration + Admin
- **Phase 4 (Weeks 13-16):** WASM Nesting + Polish
- **Phase 5 (Weeks 17-20):** Launch Prep + Marketing Integration

---

# Phase 1: Core Platform MVP

## Milestone 1.1: State Management Foundation

**Objective:** Replace ad-hoc useState with proper state architecture (Zustand + TanStack Query)

---

### Task 1.1.1: Install and Configure Zustand

**Files:**
- Create: `lib/stores/canvas-store.ts`
- Create: `lib/stores/index.ts`
- Modify: `package.json`

**Step 1: Install Zustand**

```bash
npm install zustand
```

**Step 2: Create canvas store with TypeScript types**

Create `lib/stores/canvas-store.ts`:

```typescript
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
  subscribeWithSelector((set, get) => ({
    // Initial state
    sheetWidth: 3000,
    sheetHeight: 1500,
    parts: [],
    viewport: { x: 0, y: 0, scale: 1 },
    selectedPartIds: new Set(),
    isDragging: false,
    isPanning: false,
    gridSize: 10,
    snapToGrid: true,

    // Sheet actions
    setSheetDimensions: (width, height) =>
      set({ sheetWidth: width, sheetHeight: height }),

    // Part actions
    addPart: (part) => {
      const id = crypto.randomUUID();
      set((state) => ({
        parts: [
          ...state.parts,
          { ...part, id, isSelected: false, isDragging: false },
        ],
      }));
      return id;
    },

    updatePart: (id, updates) =>
      set((state) => ({
        parts: state.parts.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),

    removePart: (id) =>
      set((state) => ({
        parts: state.parts.filter((p) => p.id !== id),
        selectedPartIds: new Set(
          [...state.selectedPartIds].filter((sid) => sid !== id)
        ),
      })),

    clearParts: () => set({ parts: [], selectedPartIds: new Set() }),

    // Selection actions
    selectPart: (id, additive = false) =>
      set((state) => {
        const newSelected = additive
          ? new Set([...state.selectedPartIds, id])
          : new Set([id]);
        return {
          selectedPartIds: newSelected,
          parts: state.parts.map((p) => ({
            ...p,
            isSelected: newSelected.has(p.id),
          })),
        };
      }),

    deselectAll: () =>
      set((state) => ({
        selectedPartIds: new Set(),
        parts: state.parts.map((p) => ({ ...p, isSelected: false })),
      })),

    // Viewport actions
    setViewport: (viewport) =>
      set((state) => ({ viewport: { ...state.viewport, ...viewport } })),

    resetViewport: () => set({ viewport: { x: 0, y: 0, scale: 1 } }),

    // Interaction state
    setDragging: (isDragging) => set({ isDragging }),
    setPanning: (isPanning) => set({ isPanning }),

    // Grid actions
    toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
    setGridSize: (gridSize) => set({ gridSize }),
  }))
);

// Selectors for optimized subscriptions
export const selectParts = (state: CanvasState) => state.parts;
export const selectViewport = (state: CanvasState) => state.viewport;
export const selectSelectedIds = (state: CanvasState) => state.selectedPartIds;
```

**Step 3: Create store barrel export**

Create `lib/stores/index.ts`:

```typescript
export { useCanvasStore, type CanvasPart, type CanvasViewport } from "./canvas-store";
```

**Step 4: Verify TypeScript compilation**

```bash
npm run build
```

Expected: Build succeeds with no type errors

**Step 5: Commit**

```bash
git add lib/stores/ package.json package-lock.json
git commit -m "feat(canvas): add Zustand store for canvas state management"
```

---

### Task 1.1.2: Install and Configure TanStack Query

**Files:**
- Create: `lib/query/client.ts`
- Create: `lib/query/hooks/use-sheets.ts`
- Create: `lib/query/hooks/use-pricing.ts`
- Create: `lib/query/hooks/index.ts`
- Create: `components/providers/query-provider.tsx`
- Modify: `app/[locale]/layout.tsx`
- Modify: `package.json`

**Step 1: Install TanStack Query**

```bash
npm install @tanstack/react-query
```

**Step 2: Create query client configuration**

Create `lib/query/client.ts`:

```typescript
import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 30 seconds for real-time feel
        staleTime: 30 * 1000,
        // Refetch on window focus for live data
        refetchOnWindowFocus: true,
        // Retry once on failure
        retry: 1,
        // Keep previous data while fetching
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
}

// Query keys factory for type-safe, consistent keys
export const queryKeys = {
  sheets: {
    all: ["sheets"] as const,
    list: () => [...queryKeys.sheets.all, "list"] as const,
    detail: (id: string) => [...queryKeys.sheets.all, "detail", id] as const,
    byStatus: (status: string) => [...queryKeys.sheets.all, "status", status] as const,
  },
  pricing: {
    all: ["pricing"] as const,
    config: () => [...queryKeys.pricing.all, "config"] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: () => [...queryKeys.orders.all, "list"] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
    byUser: (userId: string) => [...queryKeys.orders.all, "user", userId] as const,
  },
  parts: {
    all: ["parts"] as const,
    byUser: (userId: string) => [...queryKeys.parts.all, "user", userId] as const,
  },
} as const;
```

**Step 3: Create sheets query hook**

Create `lib/query/hooks/use-sheets.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../client";
import {
  getAllSheets,
  getSheet,
  createSheet,
  updateSheet,
  type SheetDoc,
} from "@/lib/firebase/db/sheets";

export function useSheets() {
  return useQuery({
    queryKey: queryKeys.sheets.list(),
    queryFn: getAllSheets,
  });
}

export function useSheet(id: string | null) {
  return useQuery({
    queryKey: queryKeys.sheets.detail(id ?? ""),
    queryFn: () => (id ? getSheet(id) : null),
    enabled: !!id,
  });
}

export function useOpenSheets() {
  const { data: sheets, ...rest } = useSheets();
  return {
    data: sheets?.filter((s) => s.status === "open"),
    ...rest,
  };
}

export function useCreateSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<SheetDoc, "id" | "createdAt">) => createSheet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sheets.all });
    },
  });
}

export function useUpdateSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<SheetDoc, "id" | "createdAt">>;
    }) => updateSheet(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sheets.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sheets.list() });
    },
  });
}
```

**Step 4: Create pricing query hook**

Create `lib/query/hooks/use-pricing.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../client";
import {
  getPricingConfig,
  setPricingConfig,
  type PricingConfig,
} from "@/lib/firebase/db/pricing-config";

export function usePricingConfig() {
  return useQuery({
    queryKey: queryKeys.pricing.config(),
    queryFn: getPricingConfig,
    // Pricing config rarely changes, cache longer
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePricingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: PricingConfig) => setPricingConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.all });
    },
  });
}
```

**Step 5: Create hooks barrel export**

Create `lib/query/hooks/index.ts`:

```typescript
export * from "./use-sheets";
export * from "./use-pricing";
```

**Step 6: Create QueryProvider component**

Create `components/providers/query-provider.tsx`:

```typescript
"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query/client";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create client once per component instance (SSR-safe)
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**Step 7: Add QueryProvider to root layout**

Modify `app/[locale]/layout.tsx` to wrap with QueryProvider:

```typescript
// Add import at top
import { QueryProvider } from "@/components/providers/query-provider";

// Wrap children with QueryProvider (inside other providers)
// Find the return statement and add QueryProvider
```

**Step 8: Verify build**

```bash
npm run build
```

**Step 9: Commit**

```bash
git add lib/query/ components/providers/query-provider.tsx app/[locale]/layout.tsx package.json package-lock.json
git commit -m "feat: add TanStack Query for server state management"
```

---

### Task 1.1.3: Create App-Level Store

**Files:**
- Create: `lib/stores/app-store.ts`
- Modify: `lib/stores/index.ts`

**Step 1: Create app store for global UI state**

Create `lib/stores/app-store.ts`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GuestSession {
  id: string;
  createdAt: number;
  draftSheetId?: string;
  draftParts: string[]; // Part IDs in guest draft
}

interface AppState {
  // Guest session management
  guestSession: GuestSession | null;

  // UI preferences
  sidebarCollapsed: boolean;
  canvasToolbarPosition: "bottom" | "left" | "right";

  // Current workflow state
  currentSheetId: string | null;
  currentMaterial: string;
  currentThickness: string;

  // Actions
  initGuestSession: () => string;
  clearGuestSession: () => void;
  setDraftSheetId: (sheetId: string) => void;
  addDraftPart: (partId: string) => void;
  removeDraftPart: (partId: string) => void;

  setSidebarCollapsed: (collapsed: boolean) => void;
  setCanvasToolbarPosition: (position: "bottom" | "left" | "right") => void;

  setCurrentSheet: (sheetId: string | null) => void;
  setCurrentMaterial: (material: string) => void;
  setCurrentThickness: (thickness: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      guestSession: null,
      sidebarCollapsed: false,
      canvasToolbarPosition: "bottom",
      currentSheetId: null,
      currentMaterial: "steel",
      currentThickness: "3",

      // Guest session actions
      initGuestSession: () => {
        const existing = get().guestSession;
        if (existing && Date.now() - existing.createdAt < 24 * 60 * 60 * 1000) {
          return existing.id;
        }
        const id = crypto.randomUUID();
        set({
          guestSession: {
            id,
            createdAt: Date.now(),
            draftParts: [],
          },
        });
        return id;
      },

      clearGuestSession: () => set({ guestSession: null }),

      setDraftSheetId: (sheetId) =>
        set((state) => ({
          guestSession: state.guestSession
            ? { ...state.guestSession, draftSheetId: sheetId }
            : null,
        })),

      addDraftPart: (partId) =>
        set((state) => ({
          guestSession: state.guestSession
            ? {
                ...state.guestSession,
                draftParts: [...state.guestSession.draftParts, partId],
              }
            : null,
        })),

      removeDraftPart: (partId) =>
        set((state) => ({
          guestSession: state.guestSession
            ? {
                ...state.guestSession,
                draftParts: state.guestSession.draftParts.filter(
                  (id) => id !== partId
                ),
              }
            : null,
        })),

      // UI preference actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCanvasToolbarPosition: (position) =>
        set({ canvasToolbarPosition: position }),

      // Workflow actions
      setCurrentSheet: (sheetId) => set({ currentSheetId: sheetId }),
      setCurrentMaterial: (material) => set({ currentMaterial: material }),
      setCurrentThickness: (thickness) => set({ currentThickness: thickness }),
    }),
    {
      name: "sheetmates-app-storage",
      partialize: (state) => ({
        guestSession: state.guestSession,
        sidebarCollapsed: state.sidebarCollapsed,
        canvasToolbarPosition: state.canvasToolbarPosition,
        currentMaterial: state.currentMaterial,
        currentThickness: state.currentThickness,
      }),
    }
  )
);
```

**Step 2: Update barrel export**

Modify `lib/stores/index.ts`:

```typescript
export { useCanvasStore, type CanvasPart, type CanvasViewport } from "./canvas-store";
export { useAppStore } from "./app-store";
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add lib/stores/
git commit -m "feat: add app-level store with guest session management"
```

---

## Milestone 1.2: Interactive Konva Canvas

**Objective:** Replace SVG-based SheetViewer with high-performance Konva.js canvas

---

### Task 1.2.1: Install Konva and React-Konva

**Files:**
- Modify: `package.json`

**Step 1: Install Konva packages**

```bash
npm install konva react-konva
```

**Step 2: Verify installation**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add konva and react-konva dependencies"
```

---

### Task 1.2.2: Create Grid Layer Component

**Files:**
- Create: `components/canvas/grid-layer.tsx`
- Create: `components/canvas/index.ts`

**Step 1: Create grid layer**

Create `components/canvas/grid-layer.tsx`:

```typescript
"use client";

import { Layer, Line } from "react-konva";
import { useMemo } from "react";

interface GridLayerProps {
  width: number;
  height: number;
  gridSize?: number;
  majorGridSize?: number;
}

export function GridLayer({
  width,
  height,
  gridSize = 10,
  majorGridSize = 100,
}: GridLayerProps) {
  const lines = useMemo(() => {
    const result: JSX.Element[] = [];

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      const isMajor = x % majorGridSize === 0;
      result.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke={isMajor ? "#3f3f46" : "#27272a"} // zinc-700 : zinc-800
          strokeWidth={isMajor ? 1 : 0.5}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      const isMajor = y % majorGridSize === 0;
      result.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke={isMajor ? "#3f3f46" : "#27272a"}
          strokeWidth={isMajor ? 1 : 0.5}
          listening={false}
        />
      );
    }

    return result;
  }, [width, height, gridSize, majorGridSize]);

  return <Layer listening={false}>{lines}</Layer>;
}
```

**Step 2: Create barrel export**

Create `components/canvas/index.ts`:

```typescript
export { GridLayer } from "./grid-layer";
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add components/canvas/
git commit -m "feat(canvas): add Konva grid layer component"
```

---

### Task 1.2.3: Create Sheet Boundary Layer

**Files:**
- Create: `components/canvas/sheet-layer.tsx`
- Modify: `components/canvas/index.ts`

**Step 1: Create sheet boundary layer**

Create `components/canvas/sheet-layer.tsx`:

```typescript
"use client";

import { Layer, Rect, Text } from "react-konva";

interface SheetLayerProps {
  width: number;
  height: number;
}

export function SheetLayer({ width, height }: SheetLayerProps) {
  return (
    <Layer listening={false}>
      {/* Sheet boundary */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#334155" // slate-700
        opacity={0.3}
        stroke="#64748b" // slate-500
        strokeWidth={2}
        dash={[10, 5]}
      />

      {/* Dimension labels */}
      <Text
        x={width / 2}
        y={-25}
        text={`${width} mm`}
        fontSize={14}
        fontFamily="JetBrains Mono, monospace"
        fill="#a1a1aa" // zinc-400
        align="center"
        offsetX={30}
      />
      <Text
        x={-45}
        y={height / 2}
        text={`${height} mm`}
        fontSize={14}
        fontFamily="JetBrains Mono, monospace"
        fill="#a1a1aa"
        rotation={-90}
        offsetY={7}
      />

      {/* Origin marker */}
      <Text
        x={5}
        y={5}
        text="(0,0)"
        fontSize={10}
        fontFamily="JetBrains Mono, monospace"
        fill="#71717a" // zinc-500
      />
    </Layer>
  );
}
```

**Step 2: Update barrel export**

```typescript
export { GridLayer } from "./grid-layer";
export { SheetLayer } from "./sheet-layer";
```

**Step 3: Commit**

```bash
git add components/canvas/
git commit -m "feat(canvas): add sheet boundary layer with dimensions"
```

---

### Task 1.2.4: Create Draggable Part Component

**Files:**
- Create: `components/canvas/canvas-part.tsx`
- Modify: `components/canvas/index.ts`

**Step 1: Create interactive part component**

Create `components/canvas/canvas-part.tsx`:

```typescript
"use client";

import { useRef, useCallback } from "react";
import { Group, Rect, Path, Text } from "react-konva";
import type Konva from "konva";
import { useCanvasStore, type CanvasPart } from "@/lib/stores/canvas-store";

interface CanvasPartProps {
  part: CanvasPart;
  color: string;
  sheetWidth: number;
  sheetHeight: number;
}

export function CanvasPartComponent({
  part,
  color,
  sheetWidth,
  sheetHeight,
}: CanvasPartProps) {
  const groupRef = useRef<Konva.Group>(null);
  const { updatePart, selectPart, snapToGrid, gridSize } = useCanvasStore();

  const snapToGridValue = useCallback(
    (value: number): number => {
      if (!snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  const handleDragStart = useCallback(() => {
    updatePart(part.id, { isDragging: true });
    selectPart(part.id);
  }, [part.id, updatePart, selectPart]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const x = snapToGridValue(node.x());
      const y = snapToGridValue(node.y());

      // Clamp to sheet boundaries
      const clampedX = Math.max(0, Math.min(x, sheetWidth - part.width));
      const clampedY = Math.max(0, Math.min(y, sheetHeight - part.height));

      updatePart(part.id, {
        x: clampedX,
        y: clampedY,
        isDragging: false,
      });

      // Snap position visually
      node.position({ x: clampedX, y: clampedY });
    },
    [part.id, part.width, part.height, sheetWidth, sheetHeight, updatePart, snapToGridValue]
  );

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      selectPart(part.id, e.evt.shiftKey);
    },
    [part.id, selectPart]
  );

  const fillOpacity = part.isSelected ? 0.6 : part.isDragging ? 0.5 : 0.3;
  const strokeWidth = part.isSelected ? 2 : 1;

  return (
    <Group
      ref={groupRef}
      x={part.x}
      y={part.y}
      rotation={part.rotation}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      {part.svgPath ? (
        <Path
          data={part.svgPath}
          fill={color}
          opacity={fillOpacity}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ) : (
        <Rect
          width={part.width}
          height={part.height}
          fill={color}
          opacity={fillOpacity}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      )}

      {/* Part ID label (shown on hover/select) */}
      {part.isSelected && (
        <Text
          x={part.width / 2}
          y={part.height / 2}
          text={part.partId.slice(0, 8)}
          fontSize={Math.min(part.width, part.height) * 0.12}
          fontFamily="JetBrains Mono, monospace"
          fill="#ffffff"
          align="center"
          verticalAlign="middle"
          offsetX={part.width * 0.15}
          offsetY={part.height * 0.06}
        />
      )}
    </Group>
  );
}
```

**Step 2: Update barrel export**

```typescript
export { GridLayer } from "./grid-layer";
export { SheetLayer } from "./sheet-layer";
export { CanvasPartComponent } from "./canvas-part";
```

**Step 3: Commit**

```bash
git add components/canvas/
git commit -m "feat(canvas): add draggable part component with snap-to-grid"
```

---

### Task 1.2.5: Create Parts Layer with Collision Detection

**Files:**
- Create: `components/canvas/parts-layer.tsx`
- Create: `lib/canvas/collision.ts`
- Modify: `components/canvas/index.ts`

**Step 1: Create collision detection utilities**

Create `lib/canvas/collision.ts`:

```typescript
import type { CanvasPart } from "@/lib/stores/canvas-store";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getBoundingBox(part: CanvasPart): BoundingBox {
  // Handle rotation (only 90-degree increments)
  if (part.rotation === 90 || part.rotation === 270) {
    return {
      x: part.x,
      y: part.y,
      width: part.height,
      height: part.width,
    };
  }
  return {
    x: part.x,
    y: part.y,
    width: part.width,
    height: part.height,
  };
}

export function checkCollision(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function checkPartCollisions(
  parts: CanvasPart[],
  targetId: string
): boolean {
  const target = parts.find((p) => p.id === targetId);
  if (!target) return false;

  const targetBox = getBoundingBox(target);

  return parts.some((part) => {
    if (part.id === targetId) return false;
    return checkCollision(targetBox, getBoundingBox(part));
  });
}

export function isOutOfBounds(
  part: CanvasPart,
  sheetWidth: number,
  sheetHeight: number
): boolean {
  const box = getBoundingBox(part);
  return (
    box.x < 0 ||
    box.y < 0 ||
    box.x + box.width > sheetWidth ||
    box.y + box.height > sheetHeight
  );
}

export function calculateUtilization(
  parts: CanvasPart[],
  sheetWidth: number,
  sheetHeight: number
): number {
  const sheetArea = sheetWidth * sheetHeight;
  if (sheetArea === 0) return 0;

  const usedArea = parts.reduce((sum, part) => {
    return sum + part.width * part.height;
  }, 0);

  return usedArea / sheetArea;
}
```

**Step 2: Create parts layer**

Create `components/canvas/parts-layer.tsx`:

```typescript
"use client";

import { Layer } from "react-konva";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { CanvasPartComponent } from "./canvas-part";

const PART_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
];

interface PartsLayerProps {
  sheetWidth: number;
  sheetHeight: number;
}

export function PartsLayer({ sheetWidth, sheetHeight }: PartsLayerProps) {
  const parts = useCanvasStore((state) => state.parts);

  // Create color map by unique partId
  const partIds = [...new Set(parts.map((p) => p.partId))];
  const colorMap: Record<string, string> = {};
  partIds.forEach((id, index) => {
    colorMap[id] = PART_COLORS[index % PART_COLORS.length];
  });

  return (
    <Layer>
      {parts.map((part) => (
        <CanvasPartComponent
          key={part.id}
          part={part}
          color={colorMap[part.partId]}
          sheetWidth={sheetWidth}
          sheetHeight={sheetHeight}
        />
      ))}
    </Layer>
  );
}
```

**Step 3: Update barrel exports**

```typescript
export { GridLayer } from "./grid-layer";
export { SheetLayer } from "./sheet-layer";
export { CanvasPartComponent } from "./canvas-part";
export { PartsLayer } from "./parts-layer";
```

**Step 4: Commit**

```bash
git add components/canvas/ lib/canvas/
git commit -m "feat(canvas): add parts layer with collision detection utilities"
```

---

### Task 1.2.6: Create Main Nesting Canvas Component

**Files:**
- Create: `components/canvas/nesting-canvas.tsx`
- Modify: `components/canvas/index.ts`

**Step 1: Create main canvas component**

Create `components/canvas/nesting-canvas.tsx`:

```typescript
"use client";

import { useRef, useCallback, useEffect } from "react";
import { Stage } from "react-konva";
import type Konva from "konva";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { GridLayer } from "./grid-layer";
import { SheetLayer } from "./sheet-layer";
import { PartsLayer } from "./parts-layer";

interface NestingCanvasProps {
  className?: string;
}

const PADDING = 50; // Canvas padding around sheet
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

export function NestingCanvas({ className }: NestingCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    sheetWidth,
    sheetHeight,
    viewport,
    setViewport,
    isPanning,
    setPanning,
    deselectAll,
  } = useCanvasStore();

  // Calculate initial scale to fit sheet in viewport
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current) return 1;
    const container = containerRef.current;
    const scaleX = (container.clientWidth - PADDING * 2) / sheetWidth;
    const scaleY = (container.clientHeight - PADDING * 2) / sheetHeight;
    return Math.min(scaleX, scaleY, 1);
  }, [sheetWidth, sheetHeight]);

  // Initialize viewport on mount
  useEffect(() => {
    const scale = calculateFitScale();
    setViewport({
      x: PADDING,
      y: PADDING,
      scale,
    });
  }, [calculateFitScale, setViewport]);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewport.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - viewport.x) / oldScale,
        y: (pointer.y - viewport.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1.1;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, direction > 0 ? oldScale * factor : oldScale / factor)
      );

      setViewport({
        scale: newScale,
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [viewport, setViewport]
  );

  // Handle pan (middle mouse or space+drag)
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Middle mouse button or space key held
      if (e.evt.button === 1) {
        setPanning(true);
      }
    },
    [setPanning]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanning) return;
      const stage = stageRef.current;
      if (!stage) return;

      setViewport({
        x: viewport.x + e.evt.movementX,
        y: viewport.y + e.evt.movementY,
      });
    },
    [isPanning, viewport, setViewport]
  );

  const handleMouseUp = useCallback(() => {
    setPanning(false);
  }, [setPanning]);

  // Click on empty space to deselect
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        deselectAll();
      }
    },
    [deselectAll]
  );

  return (
    <div
      ref={containerRef}
      className={`bg-zinc-950 overflow-hidden ${className ?? ""}`}
      style={{ cursor: isPanning ? "grabbing" : "default" }}
    >
      <Stage
        ref={stageRef}
        width={containerRef.current?.clientWidth ?? 800}
        height={containerRef.current?.clientHeight ?? 600}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleStageClick}
      >
        <GridLayer width={sheetWidth} height={sheetHeight} />
        <SheetLayer width={sheetWidth} height={sheetHeight} />
        <PartsLayer sheetWidth={sheetWidth} sheetHeight={sheetHeight} />
      </Stage>
    </div>
  );
}
```

**Step 2: Update barrel export**

```typescript
export { GridLayer } from "./grid-layer";
export { SheetLayer } from "./sheet-layer";
export { CanvasPartComponent } from "./canvas-part";
export { PartsLayer } from "./parts-layer";
export { NestingCanvas } from "./nesting-canvas";
```

**Step 3: Commit**

```bash
git add components/canvas/
git commit -m "feat(canvas): add main NestingCanvas component with pan/zoom"
```

---

### Task 1.2.7: Create Canvas Toolbar

**Files:**
- Create: `components/canvas/canvas-toolbar.tsx`
- Modify: `components/canvas/index.ts`

**Step 1: Create toolbar component**

Create `components/canvas/canvas-toolbar.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MagnetStraight,
  ArrowsOut,
  Trash,
  ArrowClockwise,
  GridFour,
} from "@phosphor-icons/react";
import { calculateUtilization } from "@/lib/canvas/collision";

interface CanvasToolbarProps {
  onRunNesting?: () => void;
  nestingLoading?: boolean;
}

export function CanvasToolbar({
  onRunNesting,
  nestingLoading,
}: CanvasToolbarProps) {
  const t = useTranslations("canvas");
  const {
    parts,
    sheetWidth,
    sheetHeight,
    snapToGrid,
    toggleSnapToGrid,
    clearParts,
    resetViewport,
    selectedPartIds,
    removePart,
    updatePart,
  } = useCanvasStore();

  const utilization = calculateUtilization(parts, sheetWidth, sheetHeight);
  const selectedId = [...selectedPartIds][0];

  const handleRotateSelected = () => {
    if (!selectedId) return;
    const part = parts.find((p) => p.id === selectedId);
    if (!part) return;
    const newRotation = ((part.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    updatePart(selectedId, { rotation: newRotation });
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    removePart(selectedId);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-2">
      {/* Snap toggle */}
      <Button
        variant={snapToGrid ? "default" : "ghost"}
        size="icon-sm"
        onClick={toggleSnapToGrid}
        title={t("snapToGrid")}
      >
        <MagnetStraight className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Selection actions */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleRotateSelected}
        disabled={!selectedId}
        title={t("rotate90")}
      >
        <ArrowClockwise className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleDeleteSelected}
        disabled={!selectedId}
        title={t("deleteSelected")}
      >
        <Trash className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* View actions */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={resetViewport}
        title={t("resetView")}
      >
        <ArrowsOut className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={clearParts}
        disabled={parts.length === 0}
        title={t("clearAll")}
      >
        <Trash className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Auto-nest */}
      <Button
        variant="default"
        size="sm"
        onClick={onRunNesting}
        disabled={nestingLoading || parts.length === 0}
      >
        <GridFour className="mr-1.5 h-4 w-4" />
        {t("autoNest")}
      </Button>

      {/* Stats */}
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline">
          {parts.length} {t("parts")}
        </Badge>
        <Badge
          variant={utilization > 0.7 ? "default" : "secondary"}
          className="font-mono"
        >
          {(utilization * 100).toFixed(1)}%
        </Badge>
      </div>
    </div>
  );
}
```

**Step 2: Add translations**

Add to `messages/en.json` under a new "canvas" key:
```json
{
  "canvas": {
    "snapToGrid": "Snap to Grid",
    "rotate90": "Rotate 90°",
    "deleteSelected": "Delete Selected",
    "resetView": "Reset View",
    "clearAll": "Clear All",
    "autoNest": "Auto-Nest",
    "parts": "parts"
  }
}
```

**Step 3: Update barrel export**

```typescript
export { GridLayer } from "./grid-layer";
export { SheetLayer } from "./sheet-layer";
export { CanvasPartComponent } from "./canvas-part";
export { PartsLayer } from "./parts-layer";
export { NestingCanvas } from "./nesting-canvas";
export { CanvasToolbar } from "./canvas-toolbar";
```

**Step 4: Commit**

```bash
git add components/canvas/ messages/
git commit -m "feat(canvas): add canvas toolbar with snap, rotate, delete controls"
```

---

## Milestone 1.3: Playground Page Integration

**Objective:** Create the /playground route combining canvas, uploader, and controls

---

### Task 1.3.1: Create Playground Layout

**Files:**
- Create: `app/[locale]/(protected)/playground/page.tsx`
- Create: `app/[locale]/(protected)/playground/layout.tsx`

**Step 1: Create playground layout**

Create `app/[locale]/(protected)/playground/layout.tsx`:

```typescript
"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/navbar";

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen flex-col">
        <Navbar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </AuthProvider>
  );
}
```

**Step 2: Create playground page**

Create `app/[locale]/(protected)/playground/page.tsx`:

```typescript
"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { NestingCanvas, CanvasToolbar } from "@/components/canvas";
import { DxfUploader, type UploadedPart } from "@/components/dxf-uploader";
import { NestingControls } from "@/components/nesting-controls";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useAppStore } from "@/lib/stores/app-store";
import { shelfPack } from "@/lib/nesting/shelf-packer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlaygroundPage() {
  const t = useTranslations("playground");
  const [uploadedParts, setUploadedParts] = useState<UploadedPart[]>([]);
  const [nestingLoading, setNestingLoading] = useState(false);

  const {
    sheetWidth,
    sheetHeight,
    setSheetDimensions,
    addPart,
    clearParts,
  } = useCanvasStore();

  const { currentMaterial, currentThickness, setCurrentMaterial, setCurrentThickness } =
    useAppStore();

  const [kerf, setKerf] = useState(2);

  const handlePartsReady = useCallback(
    (parts: UploadedPart[]) => {
      setUploadedParts(parts);
      // Add parts to canvas store
      clearParts();
      parts.forEach((part) => {
        for (let i = 0; i < part.quantity; i++) {
          addPart({
            partId: part.fileName,
            x: 0,
            y: 0,
            width: part.parsed.width,
            height: part.parsed.height,
            rotation: 0,
            svgPath: part.svgPath,
          });
        }
      });
    },
    [addPart, clearParts]
  );

  const handleRunNesting = useCallback(() => {
    setNestingLoading(true);

    // Convert uploaded parts to nesting input format
    const nestingParts = uploadedParts.map((p) => ({
      id: p.fileName,
      width: p.parsed.width,
      height: p.parsed.height,
      quantity: p.quantity,
    }));

    const sheet = { width: sheetWidth, height: sheetHeight };
    const result = shelfPack(nestingParts, sheet, kerf);

    // Update canvas with nesting results
    clearParts();
    result.placements.forEach((placement) => {
      const originalPart = uploadedParts.find(
        (p) => p.fileName === placement.partId
      );
      addPart({
        partId: placement.partId,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        rotation: placement.rotation as 0 | 90 | 180 | 270,
        svgPath: originalPart?.svgPath,
      });
    });

    setNestingLoading(false);
  }, [uploadedParts, sheetWidth, sheetHeight, kerf, clearParts, addPart]);

  const utilization = useCanvasStore((state) => {
    const totalArea = state.parts.reduce((sum, p) => sum + p.width * p.height, 0);
    const sheetArea = state.sheetWidth * state.sheetHeight;
    return sheetArea > 0 ? totalArea / sheetArea : 0;
  });

  const partsPlaced = useCanvasStore((state) => state.parts.length);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b border-zinc-800 p-2">
        <CanvasToolbar
          onRunNesting={handleRunNesting}
          nestingLoading={nestingLoading}
        />
      </div>

      {/* Main content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left sidebar - Upload & Controls */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full overflow-y-auto border-r border-zinc-800 p-4">
            <Tabs defaultValue="upload">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1">
                  {t("upload")}
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">
                  {t("settings")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <DxfUploader onPartsReady={handlePartsReady} />
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <NestingControls
                  sheetWidth={sheetWidth}
                  sheetHeight={sheetHeight}
                  material={currentMaterial}
                  kerf={kerf}
                  utilization={utilization}
                  partsPlaced={partsPlaced}
                  onSheetWidthChange={(w) => setSheetDimensions(w, sheetHeight)}
                  onSheetHeightChange={(h) => setSheetDimensions(sheetWidth, h)}
                  onMaterialChange={setCurrentMaterial}
                  onKerfChange={setKerf}
                  onRunNesting={handleRunNesting}
                  loading={nestingLoading}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Canvas */}
        <ResizablePanel defaultSize={75}>
          <NestingCanvas className="h-full w-full" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

**Step 3: Add translations**

Add to `messages/en.json`:
```json
{
  "playground": {
    "upload": "Upload",
    "settings": "Settings"
  }
}
```

**Step 4: Commit**

```bash
git add app/[locale]/(protected)/playground/ messages/
git commit -m "feat: add playground page with canvas, uploader, and controls"
```

---

# Phase 2: Dutch Auction + Real-Time Community

## Milestone 2.1: Real-Time Firestore Integration

**Objective:** Add live subscriptions and optimistic locking for sheets

---

### Task 2.1.1: Create Real-Time Sheet Subscription Hook

**Files:**
- Create: `lib/firebase/db/subscriptions.ts`
- Create: `lib/query/hooks/use-realtime-sheet.ts`
- Modify: `lib/query/hooks/index.ts`

**Step 1: Create Firestore subscription utilities**

Create `lib/firebase/db/subscriptions.ts`:

```typescript
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "../config";
import type { SheetDoc } from "./sheets";

export function subscribeToSheet(
  sheetId: string,
  callback: (sheet: SheetDoc | null) => void
): () => void {
  const docRef = doc(db, "sheets", sheetId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as SheetDoc);
    } else {
      callback(null);
    }
  });
}

export function subscribeToOpenSheets(
  callback: (sheets: SheetDoc[]) => void
): () => void {
  const q = query(collection(db, "sheets"), where("status", "==", "open"));
  return onSnapshot(q, (snap) => {
    const sheets = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SheetDoc);
    callback(sheets);
  });
}
```

**Step 2: Create real-time hook**

Create `lib/query/hooks/use-realtime-sheet.ts`:

```typescript
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../client";
import { subscribeToSheet, subscribeToOpenSheets } from "@/lib/firebase/db/subscriptions";
import type { SheetDoc } from "@/lib/firebase/db/sheets";

export function useRealtimeSheet(sheetId: string | null) {
  const [sheet, setSheet] = useState<SheetDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sheetId) {
      setSheet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToSheet(sheetId, (data) => {
      setSheet(data);
      setLoading(false);
      // Also update TanStack Query cache for consistency
      queryClient.setQueryData(queryKeys.sheets.detail(sheetId), data);
    });

    return () => unsubscribe();
  }, [sheetId, queryClient]);

  return { data: sheet, isLoading: loading };
}

export function useRealtimeOpenSheets() {
  const [sheets, setSheets] = useState<SheetDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToOpenSheets((data) => {
      setSheets(data);
      setLoading(false);
      // Update query cache
      queryClient.setQueryData(queryKeys.sheets.list(), data);
    });

    return () => unsubscribe();
  }, [queryClient]);

  return { data: sheets, isLoading: loading };
}
```

**Step 3: Update exports**

```typescript
export * from "./use-sheets";
export * from "./use-pricing";
export * from "./use-realtime-sheet";
```

**Step 4: Commit**

```bash
git add lib/firebase/db/subscriptions.ts lib/query/hooks/
git commit -m "feat: add real-time Firestore subscriptions for sheets"
```

---

### Task 2.1.2: Implement Sheet Locking with Transactions

**Files:**
- Create: `lib/firebase/db/sheet-locks.ts`
- Create: `lib/query/hooks/use-sheet-lock.ts`

**Step 1: Create sheet locking functions**

Create `lib/firebase/db/sheet-locks.ts`:

```typescript
import {
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config";

const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export interface LockResult {
  success: boolean;
  error?: "ALREADY_LOCKED" | "SHEET_NOT_FOUND" | "SHEET_FULL";
  lockExpiry?: Date;
}

export async function acquireSheetLock(
  sheetId: string,
  userId: string
): Promise<LockResult> {
  const sheetRef = doc(db, "sheets", sheetId);

  try {
    return await runTransaction(db, async (transaction) => {
      const sheetDoc = await transaction.get(sheetRef);

      if (!sheetDoc.exists()) {
        return { success: false, error: "SHEET_NOT_FOUND" };
      }

      const data = sheetDoc.data();

      // Check if sheet is still open
      if (data.status !== "open") {
        return { success: false, error: "SHEET_FULL" };
      }

      // Check existing lock
      if (data.currentLockHolder && data.lockExpiry) {
        const lockExpiry = (data.lockExpiry as Timestamp).toDate();
        if (lockExpiry > new Date() && data.currentLockHolder !== userId) {
          return { success: false, error: "ALREADY_LOCKED" };
        }
      }

      // Acquire lock
      const expiry = new Date(Date.now() + LOCK_DURATION_MS);
      transaction.update(sheetRef, {
        currentLockHolder: userId,
        lockExpiry: Timestamp.fromDate(expiry),
        lockAcquiredAt: serverTimestamp(),
      });

      return { success: true, lockExpiry: expiry };
    });
  } catch (error) {
    console.error("Failed to acquire lock:", error);
    return { success: false, error: "ALREADY_LOCKED" };
  }
}

export async function releaseSheetLock(
  sheetId: string,
  userId: string
): Promise<boolean> {
  const sheetRef = doc(db, "sheets", sheetId);

  try {
    await runTransaction(db, async (transaction) => {
      const sheetDoc = await transaction.get(sheetRef);

      if (!sheetDoc.exists()) return;

      const data = sheetDoc.data();

      // Only release if we hold the lock
      if (data.currentLockHolder === userId) {
        transaction.update(sheetRef, {
          currentLockHolder: null,
          lockExpiry: null,
          lockAcquiredAt: null,
        });
      }
    });
    return true;
  } catch (error) {
    console.error("Failed to release lock:", error);
    return false;
  }
}

export async function extendSheetLock(
  sheetId: string,
  userId: string
): Promise<LockResult> {
  const sheetRef = doc(db, "sheets", sheetId);

  try {
    return await runTransaction(db, async (transaction) => {
      const sheetDoc = await transaction.get(sheetRef);

      if (!sheetDoc.exists()) {
        return { success: false, error: "SHEET_NOT_FOUND" };
      }

      const data = sheetDoc.data();

      // Must already hold the lock
      if (data.currentLockHolder !== userId) {
        return { success: false, error: "ALREADY_LOCKED" };
      }

      const expiry = new Date(Date.now() + LOCK_DURATION_MS);
      transaction.update(sheetRef, {
        lockExpiry: Timestamp.fromDate(expiry),
      });

      return { success: true, lockExpiry: expiry };
    });
  } catch (error) {
    console.error("Failed to extend lock:", error);
    return { success: false, error: "ALREADY_LOCKED" };
  }
}
```

**Step 2: Create lock hook**

Create `lib/query/hooks/use-sheet-lock.ts`:

```typescript
import { useState, useCallback, useEffect, useRef } from "react";
import {
  acquireSheetLock,
  releaseSheetLock,
  extendSheetLock,
  type LockResult,
} from "@/lib/firebase/db/sheet-locks";

interface UseLockOptions {
  autoExtend?: boolean;
  extensionInterval?: number;
}

export function useSheetLock(
  sheetId: string | null,
  userId: string | null,
  options: UseLockOptions = {}
) {
  const { autoExtend = true, extensionInterval = 5 * 60 * 1000 } = options;

  const [isLocked, setIsLocked] = useState(false);
  const [lockExpiry, setLockExpiry] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const extensionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const acquire = useCallback(async (): Promise<LockResult> => {
    if (!sheetId || !userId) {
      return { success: false, error: "SHEET_NOT_FOUND" };
    }

    const result = await acquireSheetLock(sheetId, userId);

    if (result.success) {
      setIsLocked(true);
      setLockExpiry(result.lockExpiry ?? null);
      setError(null);
    } else {
      setError(result.error ?? "Unknown error");
    }

    return result;
  }, [sheetId, userId]);

  const release = useCallback(async () => {
    if (!sheetId || !userId) return;

    const success = await releaseSheetLock(sheetId, userId);
    if (success) {
      setIsLocked(false);
      setLockExpiry(null);
    }
  }, [sheetId, userId]);

  // Auto-extend lock
  useEffect(() => {
    if (!autoExtend || !isLocked || !sheetId || !userId) return;

    extensionTimerRef.current = setInterval(async () => {
      const result = await extendSheetLock(sheetId, userId);
      if (result.success) {
        setLockExpiry(result.lockExpiry ?? null);
      } else {
        // Lost the lock
        setIsLocked(false);
        setLockExpiry(null);
        setError("Lock expired");
      }
    }, extensionInterval);

    return () => {
      if (extensionTimerRef.current) {
        clearInterval(extensionTimerRef.current);
      }
    };
  }, [autoExtend, isLocked, sheetId, userId, extensionInterval]);

  // Release on unmount
  useEffect(() => {
    return () => {
      if (isLocked && sheetId && userId) {
        releaseSheetLock(sheetId, userId);
      }
    };
  }, [isLocked, sheetId, userId]);

  return {
    isLocked,
    lockExpiry,
    error,
    acquire,
    release,
  };
}
```

**Step 3: Update exports**

**Step 4: Commit**

```bash
git add lib/firebase/db/sheet-locks.ts lib/query/hooks/
git commit -m "feat: add sheet locking with Firestore transactions"
```

---

## Milestone 2.2: Dutch Auction Pricing

**Objective:** Implement time-based price decay with yield sensitivity

---

### Task 2.2.1: Create Auction Pricing Model

**Files:**
- Create: `lib/pricing/auction.ts`
- Modify: `lib/firebase/db/sheets.ts`

**Step 1: Create auction pricing utilities**

Create `lib/pricing/auction.ts`:

```typescript
export interface AuctionConfig {
  initialPrice: number;
  floorPrice: number;
  decayRate: number; // Lambda in exponential decay
  auctionStartTime: Date;
}

export interface AuctionPriceResult {
  currentPrice: number;
  priceDropPercent: number;
  nextDropTime: Date;
  nextDropAmount: number;
  isAtFloor: boolean;
  timeToFloor: number; // milliseconds
}

/**
 * Calculate current Dutch Auction price using exponential decay
 * P(t) = FloorPrice + (InitialPrice - FloorPrice) * e^(-λt)
 */
export function calculateAuctionPrice(
  config: AuctionConfig,
  currentTime: Date = new Date()
): AuctionPriceResult {
  const elapsed = currentTime.getTime() - config.auctionStartTime.getTime();
  const elapsedMinutes = elapsed / (60 * 1000);

  const priceDelta = config.initialPrice - config.floorPrice;
  const decayFactor = Math.exp(-config.decayRate * elapsedMinutes);
  const currentPrice = config.floorPrice + priceDelta * decayFactor;

  // Round to 2 decimal places
  const roundedPrice = Math.max(
    config.floorPrice,
    Math.round(currentPrice * 100) / 100
  );

  const isAtFloor = roundedPrice <= config.floorPrice;

  // Calculate next drop (1 minute from now)
  const nextMinute = elapsedMinutes + 1;
  const nextDecay = Math.exp(-config.decayRate * nextMinute);
  const nextPrice = config.floorPrice + priceDelta * nextDecay;
  const nextDropAmount = Math.round((currentPrice - nextPrice) * 100) / 100;

  // Time to floor (when price is within 1% of floor)
  // Solve: 0.01 * (Initial - Floor) = (Initial - Floor) * e^(-λt)
  // t = -ln(0.01) / λ
  const timeToFloorMinutes = Math.log(100) / config.decayRate;
  const timeToFloor = Math.max(0, timeToFloorMinutes * 60 * 1000 - elapsed);

  return {
    currentPrice: roundedPrice,
    priceDropPercent: ((config.initialPrice - roundedPrice) / config.initialPrice) * 100,
    nextDropTime: new Date(currentTime.getTime() + 60 * 1000),
    nextDropAmount: isAtFloor ? 0 : nextDropAmount,
    isAtFloor,
    timeToFloor,
  };
}

/**
 * Calculate decay rate based on inventory levels
 * High inventory = faster decay (aggressive clearing)
 * Low inventory = slower decay (maximize margin)
 */
export function calculateDynamicDecayRate(
  materialInventoryCount: number,
  baseRate: number = 0.02
): number {
  if (materialInventoryCount > 50) {
    return baseRate * 2.5; // Aggressive: 5% per interval
  } else if (materialInventoryCount > 20) {
    return baseRate * 1.5; // Moderate: 3% per interval
  } else if (materialInventoryCount < 5) {
    return baseRate * 0.5; // Conservative: 1% per interval
  }
  return baseRate; // Default: 2% per interval
}

/**
 * Calculate the "Bus Driver" premium to force immediate production
 * User pays for remaining empty space on sheet
 */
export function calculateBusDriverPremium(
  currentUtilization: number,
  sheetBaseCost: number
): number {
  const remainingSpace = 1 - currentUtilization;
  // Premium is cost of remaining space + 20% urgency fee
  return sheetBaseCost * remainingSpace * 1.2;
}
```

**Step 2: Update SheetDoc type**

Modify `lib/firebase/db/sheets.ts` to add auction fields:

```typescript
export interface SheetDoc {
  id: string;
  width: number;
  height: number;
  material: string;
  thickness: number;
  placements: SheetPlacement[];
  utilization: number;
  status: "open" | "full" | "cutting" | "done";
  createdAt: unknown;

  // Auction fields
  auctionEnabled?: boolean;
  initialPrice?: number;
  floorPrice?: number;
  decayRate?: number;
  auctionStartTime?: unknown; // Firestore Timestamp

  // Locking fields
  currentLockHolder?: string | null;
  lockExpiry?: unknown;
  lockAcquiredAt?: unknown;
}
```

**Step 3: Commit**

```bash
git add lib/pricing/auction.ts lib/firebase/db/sheets.ts
git commit -m "feat(pricing): add Dutch Auction exponential decay model"
```

---

### Task 2.2.2: Create Price Ticker Component

**Files:**
- Create: `components/auction/price-ticker.tsx`
- Create: `components/auction/index.ts`

**Step 1: Create price ticker component**

Create `components/auction/price-ticker.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { calculateAuctionPrice, type AuctionConfig } from "@/lib/pricing/auction";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendDown, Clock, Fire } from "@phosphor-icons/react";

interface PriceTickerProps {
  config: AuctionConfig;
  className?: string;
}

export function PriceTicker({ config, className }: PriceTickerProps) {
  const t = useTranslations("auction");
  const [priceResult, setPriceResult] = useState(() =>
    calculateAuctionPrice(config)
  );
  const [timeToNextDrop, setTimeToNextDrop] = useState(60);

  // Update price every second
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceResult(calculateAuctionPrice(config));
      setTimeToNextDrop((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);

    return () => clearInterval(interval);
  }, [config]);

  const priceDropProgress = ((60 - timeToNextDrop) / 60) * 100;

  return (
    <Card className={`border-zinc-800 bg-zinc-900 ${className ?? ""}`}>
      <CardContent className="p-4">
        {/* Current Price */}
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-3xl font-bold text-emerald-500">
            €{priceResult.currentPrice.toFixed(2)}
          </span>
          {priceResult.isAtFloor ? (
            <Badge variant="secondary">{t("floorReached")}</Badge>
          ) : (
            <Badge variant="outline" className="font-mono">
              <TrendDown className="mr-1 h-3 w-3" />
              -{priceResult.priceDropPercent.toFixed(1)}%
            </Badge>
          )}
        </div>

        {/* Price range bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>€{config.floorPrice.toFixed(2)}</span>
            <span>€{config.initialPrice.toFixed(2)}</span>
          </div>
          <Progress
            value={
              ((priceResult.currentPrice - config.floorPrice) /
                (config.initialPrice - config.floorPrice)) *
              100
            }
            className="h-2"
          />
        </div>

        {/* Next drop countdown */}
        {!priceResult.isAtFloor && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">{t("nextDrop")}:</span>
            <span className="font-mono">{timeToNextDrop}s</span>
            <span className="text-muted-foreground">
              (-€{priceResult.nextDropAmount.toFixed(2)})
            </span>
          </div>
        )}

        {/* Urgency indicator */}
        {priceResult.timeToFloor < 30 * 60 * 1000 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-rose-500">
            <Fire className="h-4 w-4" />
            <span>{t("priceDropping")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Add translations**

Add to `messages/en.json`:
```json
{
  "auction": {
    "floorReached": "Floor Price",
    "nextDrop": "Next drop",
    "priceDropping": "Price dropping fast!"
  }
}
```

**Step 3: Create barrel export**

Create `components/auction/index.ts`:

```typescript
export { PriceTicker } from "./price-ticker";
```

**Step 4: Commit**

```bash
git add components/auction/ messages/
git commit -m "feat(auction): add real-time price ticker component"
```

---

### Task 2.2.3: Create Viability Progress Component

**Files:**
- Create: `components/auction/viability-meter.tsx`
- Modify: `components/auction/index.ts`

**Step 1: Create viability meter**

Create `components/auction/viability-meter.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, Rocket, Target } from "@phosphor-icons/react";

interface ViabilityMeterProps {
  currentUtilization: number;
  targetUtilization?: number;
  participantCount: number;
  busDriverPremium: number;
  onBecomeDriver?: () => void;
  className?: string;
}

export function ViabilityMeter({
  currentUtilization,
  targetUtilization = 0.85,
  participantCount,
  busDriverPremium,
  onBecomeDriver,
  className,
}: ViabilityMeterProps) {
  const t = useTranslations("viability");

  const utilizationPercent = currentUtilization * 100;
  const targetPercent = targetUtilization * 100;
  const isViable = currentUtilization >= targetUtilization;

  // Determine status color
  const getStatusColor = () => {
    if (isViable) return "bg-emerald-500";
    if (utilizationPercent >= 70) return "bg-amber-500";
    return "bg-zinc-500";
  };

  return (
    <Card className={`border-zinc-800 bg-zinc-900 ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4" />
          {t("sheetViability")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-mono">{utilizationPercent.toFixed(1)}%</span>
            <span className="text-muted-foreground">
              {t("target")}: {targetPercent}%
            </span>
          </div>
          <div className="relative">
            <Progress value={utilizationPercent} className="h-4" />
            {/* Target marker */}
            <div
              className="absolute top-0 h-4 w-0.5 bg-white"
              style={{ left: `${targetPercent}%` }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm">
            {isViable ? t("readyToCut") : t("waitingForParticipants")}
          </span>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {participantCount} {t("participants")}
          </span>
        </div>

        {/* Bus Driver option */}
        {!isViable && onBecomeDriver && (
          <div className="border-t border-zinc-800 pt-4">
            <p className="mb-2 text-xs text-muted-foreground">
              {t("busDriverDescription")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onBecomeDriver}
            >
              <Rocket className="mr-2 h-4 w-4" />
              {t("forceRun")} (+€{busDriverPremium.toFixed(2)})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Add translations**

```json
{
  "viability": {
    "sheetViability": "Sheet Viability",
    "target": "Target",
    "readyToCut": "Ready to cut!",
    "waitingForParticipants": "Waiting for participants",
    "participants": "participants",
    "busDriverDescription": "Pay to force immediate production",
    "forceRun": "Force Run"
  }
}
```

**Step 3: Update exports**

```typescript
export { PriceTicker } from "./price-ticker";
export { ViabilityMeter } from "./viability-meter";
```

**Step 4: Commit**

```bash
git add components/auction/ messages/
git commit -m "feat(auction): add viability meter with bus driver option"
```

---

# Phase 3: Factory Integration + Admin

## Milestone 3.1: Admin Dashboard

**Objective:** Build operator interface for sheet injection and queue management

---

### Task 3.1.1: Create Admin Layout

**Files:**
- Modify: `app/[locale]/(protected)/(admin)/layout.tsx`
- Create: `components/admin/admin-sidebar.tsx`

**Step 1: Update admin layout with sidebar**

Modify `app/[locale]/(protected)/(admin)/layout.tsx`:

```typescript
"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/protected-route";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute requireAdmin>
        <div className="flex h-screen bg-zinc-950">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
```

**Step 2: Create admin sidebar**

Create `components/admin/admin-sidebar.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  HardDrives,
  Queue,
  CurrencyDollar,
  Gear,
  SignOut,
  Package,
} from "@phosphor-icons/react";

const navItems = [
  { href: "/admin", icon: HardDrives, labelKey: "inventory" },
  { href: "/admin/queue", icon: Queue, labelKey: "productionQueue" },
  { href: "/admin/orders", icon: Package, labelKey: "orders" },
  { href: "/admin/pricing", icon: CurrencyDollar, labelKey: "pricing" },
  { href: "/admin/settings", icon: Gear, labelKey: "settings" },
];

export function AdminSidebar() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <span className="font-mono text-lg font-bold">SheetMates</span>
        <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-500">
          ADMIN
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-white">
          <SignOut className="h-5 w-5" />
          {t("logout")}
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Add translations**

```json
{
  "admin": {
    "nav": {
      "inventory": "Inventory",
      "productionQueue": "Production Queue",
      "orders": "Orders",
      "pricing": "Pricing",
      "settings": "Settings",
      "logout": "Logout"
    }
  }
}
```

**Step 4: Commit**

```bash
git add app/[locale]/(protected)/(admin)/ components/admin/ messages/
git commit -m "feat(admin): add admin layout with sidebar navigation"
```

---

### Task 3.1.2: Create Sheet Injection Form

**Files:**
- Create: `components/admin/inject-sheet-form.tsx`
- Create: `lib/firebase/db/inject-sheet.ts`
- Create: `components/admin/index.ts`

**Step 1: Create injection database function**

Create `lib/firebase/db/inject-sheet.ts`:

```typescript
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../config";
import { calculateDynamicDecayRate } from "@/lib/pricing/auction";

export interface InjectSheetInput {
  width: number;
  height: number;
  material: string;
  thickness: number;
  quantity: number;
  initialPrice: number;
  floorPrice: number;
  qrCodePrefix?: string;
}

export interface InjectedSheet {
  id: string;
  qrCode: string;
}

export async function injectSheet(
  input: InjectSheetInput,
  inventoryCount: number = 10
): Promise<InjectedSheet[]> {
  const sheetsCol = collection(db, "sheets");
  const results: InjectedSheet[] = [];

  const decayRate = calculateDynamicDecayRate(inventoryCount);

  for (let i = 0; i < input.quantity; i++) {
    const qrCode = `${input.qrCodePrefix ?? "SM"}-${Date.now()}-${i}`;

    const docRef = await addDoc(sheetsCol, {
      width: input.width,
      height: input.height,
      material: input.material,
      thickness: input.thickness,
      placements: [],
      utilization: 0,
      status: "open",

      // Auction config
      auctionEnabled: true,
      initialPrice: input.initialPrice,
      floorPrice: input.floorPrice,
      decayRate,
      auctionStartTime: serverTimestamp(),

      // Tracking
      qrCode,
      injectedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    results.push({ id: docRef.id, qrCode });
  }

  return results;
}
```

**Step 2: Create injection form component**

Create `components/admin/inject-sheet-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { injectSheet, type InjectSheetInput } from "@/lib/firebase/db/inject-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, QrCode } from "@phosphor-icons/react";

const MATERIALS = ["steel", "stainless", "aluminum", "copper"];
const THICKNESSES = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

interface FormData {
  width: number;
  height: number;
  material: string;
  thickness: number;
  quantity: number;
  initialPrice: number;
  floorPrice: number;
}

export function InjectSheetForm() {
  const t = useTranslations("admin.inject");
  const [loading, setLoading] = useState(false);
  const [injectedSheets, setInjectedSheets] = useState<
    { id: string; qrCode: string }[]
  >([]);

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      width: 3000,
      height: 1500,
      material: "steel",
      thickness: 3,
      quantity: 1,
      initialPrice: 100,
      floorPrice: 20,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const results = await injectSheet(data);
      setInjectedSheets(results);
      toast.success(t("success", { count: results.length }));
    } catch (error) {
      console.error("Injection failed:", error);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("width")}</Label>
                <Input
                  type="number"
                  {...register("width", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("height")}</Label>
                <Input
                  type="number"
                  {...register("height", { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Material */}
            <div className="space-y-2">
              <Label>{t("material")}</Label>
              <Select
                value={watch("material")}
                onValueChange={(v) => setValue("material", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Thickness */}
            <div className="space-y-2">
              <Label>{t("thickness")}</Label>
              <Select
                value={watch("thickness").toString()}
                onValueChange={(v) => setValue("thickness", parseFloat(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THICKNESSES.map((th) => (
                    <SelectItem key={th} value={th.toString()}>
                      {th} mm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>{t("quantity")}</Label>
              <Input
                type="number"
                min={1}
                max={100}
                {...register("quantity", { valueAsNumber: true })}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("initialPrice")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("initialPrice", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("floorPrice")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("floorPrice", { valueAsNumber: true })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("injecting") : t("inject")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* QR Code results */}
      {injectedSheets.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {t("injectedSheets")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {injectedSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="flex items-center justify-between rounded border border-zinc-800 p-2"
                >
                  <code className="text-xs">{sheet.qrCode}</code>
                  <Button variant="ghost" size="xs">
                    {t("printLabel")}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 3: Add translations and create exports**

**Step 4: Commit**

```bash
git add components/admin/ lib/firebase/db/inject-sheet.ts messages/
git commit -m "feat(admin): add sheet injection form with QR code generation"
```

---

# Phase 4: WASM Nesting Engine

## Milestone 4.1: WebAssembly Integration

**Objective:** Compile libnest2d to WASM and integrate with canvas

---

### Task 4.1.1: Set Up WASM Build Infrastructure

**Files:**
- Create: `wasm/README.md`
- Create: `wasm/build.sh`
- Create: `wasm/nest-worker.ts`

*This task documents the WASM build process. Actual compilation requires Emscripten toolchain.*

**Step 1: Create WASM directory with build documentation**

Create `wasm/README.md`:

```markdown
# WASM Nesting Engine

This directory contains the WebAssembly build of libnest2d for true-shape nesting.

## Prerequisites

- Emscripten SDK (emsdk)
- CMake 3.10+
- Git

## Build Steps

1. Install Emscripten:
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. Clone libnest2d:
   ```bash
   git clone https://github.com/tamasmeszaros/libnest2d.git
   cd libnest2d
   ```

3. Build with Emscripten:
   ```bash
   mkdir build && cd build
   emcmake cmake .. -DLIBNEST2D_HEADER_ONLY=ON
   emmake make
   ```

4. Copy output:
   ```bash
   cp nest2d.wasm ../public/wasm/
   cp nest2d.js ../public/wasm/
   ```

## Integration

The WASM module is loaded in a Web Worker (`nest-worker.ts`) to prevent
blocking the main thread during computation.

## API

```typescript
interface NestInput {
  sheet: { width: number; height: number };
  parts: Array<{
    id: string;
    polygon: number[]; // Flattened [x1, y1, x2, y2, ...]
  }>;
  config: {
    rotations: number; // Allowed rotation steps (e.g., 4 = 90° increments)
    spacing: number; // Minimum part spacing in mm
  };
}

interface NestOutput {
  placements: Array<{
    id: string;
    x: number;
    y: number;
    rotation: number;
  }>;
  utilization: number;
  iterations: number;
}
```
```

**Step 2: Create worker stub**

Create `wasm/nest-worker.ts`:

```typescript
// Web Worker for WASM nesting engine
// This runs heavy computation off the main thread

interface NestMessage {
  type: "NEST";
  payload: {
    sheet: { width: number; height: number };
    parts: Array<{
      id: string;
      width: number;
      height: number;
      polygon?: number[];
    }>;
    config: {
      rotations: number;
      spacing: number;
      iterations: number;
    };
  };
}

interface NestResult {
  type: "RESULT";
  payload: {
    placements: Array<{
      id: string;
      x: number;
      y: number;
      rotation: number;
    }>;
    utilization: number;
    iterations: number;
  };
}

interface ProgressUpdate {
  type: "PROGRESS";
  payload: {
    iteration: number;
    totalIterations: number;
    currentUtilization: number;
  };
}

// WASM module will be loaded here
let wasmModule: any = null;

async function loadWasm() {
  // TODO: Load actual WASM module when compiled
  // const response = await fetch("/wasm/nest2d.wasm");
  // wasmModule = await WebAssembly.instantiate(response);
  console.log("WASM loading placeholder - using fallback nesting");
}

function fallbackNest(
  message: NestMessage
): NestResult["payload"] {
  // Simple shelf-packing fallback when WASM unavailable
  const { sheet, parts, config } = message.payload;
  const placements: NestResult["payload"]["placements"] = [];

  let currentX = config.spacing;
  let currentY = config.spacing;
  let rowHeight = 0;

  for (const part of parts) {
    // Check if part fits in current row
    if (currentX + part.width + config.spacing > sheet.width) {
      // Start new row
      currentX = config.spacing;
      currentY += rowHeight + config.spacing;
      rowHeight = 0;
    }

    // Check if part fits on sheet
    if (currentY + part.height + config.spacing <= sheet.height) {
      placements.push({
        id: part.id,
        x: currentX,
        y: currentY,
        rotation: 0,
      });

      currentX += part.width + config.spacing;
      rowHeight = Math.max(rowHeight, part.height);
    }
  }

  // Calculate utilization
  const usedArea = parts.reduce((sum, p) => sum + p.width * p.height, 0);
  const sheetArea = sheet.width * sheet.height;

  return {
    placements,
    utilization: usedArea / sheetArea,
    iterations: 1,
  };
}

self.onmessage = async (e: MessageEvent<NestMessage>) => {
  if (e.data.type === "NEST") {
    if (!wasmModule) {
      await loadWasm();
    }

    // Use fallback for now
    const result = fallbackNest(e.data);

    self.postMessage({
      type: "RESULT",
      payload: result,
    } as NestResult);
  }
};

export {};
```

**Step 3: Create hook to use worker**

Create `lib/nesting/use-wasm-nesting.ts`:

```typescript
import { useState, useCallback, useRef, useEffect } from "react";

interface NestingPart {
  id: string;
  width: number;
  height: number;
  polygon?: number[];
}

interface NestingResult {
  placements: Array<{
    id: string;
    x: number;
    y: number;
    rotation: number;
  }>;
  utilization: number;
}

interface UseWasmNestingOptions {
  sheetWidth: number;
  sheetHeight: number;
  spacing?: number;
  rotations?: number;
}

export function useWasmNesting(options: UseWasmNestingOptions) {
  const { sheetWidth, sheetHeight, spacing = 2, rotations = 4 } = options;
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<NestingResult | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../wasm/nest-worker.ts", import.meta.url)
    );

    workerRef.current.onmessage = (e) => {
      if (e.data.type === "RESULT") {
        setResult(e.data.payload);
        setLoading(false);
        setProgress(100);
      } else if (e.data.type === "PROGRESS") {
        setProgress(
          (e.data.payload.iteration / e.data.payload.totalIterations) * 100
        );
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const nest = useCallback(
    (parts: NestingPart[]) => {
      if (!workerRef.current) return;

      setLoading(true);
      setProgress(0);
      setResult(null);

      workerRef.current.postMessage({
        type: "NEST",
        payload: {
          sheet: { width: sheetWidth, height: sheetHeight },
          parts,
          config: {
            rotations,
            spacing,
            iterations: 100,
          },
        },
      });
    },
    [sheetWidth, sheetHeight, spacing, rotations]
  );

  return {
    nest,
    loading,
    progress,
    result,
  };
}
```

**Step 4: Commit**

```bash
git add wasm/ lib/nesting/use-wasm-nesting.ts
git commit -m "feat(nesting): add WASM worker infrastructure and hook"
```

---

# Phase 5: Launch Prep

## Milestone 5.1: Testing Infrastructure

### Task 5.1.1: Set Up Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/nesting/__tests__/shelf-packer.test.ts`
- Modify: `package.json`

**Step 1: Install Vitest**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 2: Create Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

**Step 3: Create setup file**

Create `vitest.setup.ts`:

```typescript
import "@testing-library/jest-dom";
```

**Step 4: Create nesting tests**

Create `lib/nesting/__tests__/shelf-packer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { shelfPack } from "../shelf-packer";

describe("shelfPack", () => {
  const standardSheet = { width: 3000, height: 1500 };

  it("places a single part at origin", () => {
    const parts = [{ id: "part1", width: 100, height: 50, quantity: 1 }];
    const result = shelfPack(parts, standardSheet, 2);

    expect(result.placements).toHaveLength(1);
    expect(result.placements[0]).toMatchObject({
      partId: "part1",
      x: 0,
      y: 0,
    });
    expect(result.sheetsUsed).toBe(1);
  });

  it("places multiple copies of same part", () => {
    const parts = [{ id: "part1", width: 100, height: 50, quantity: 3 }];
    const result = shelfPack(parts, standardSheet, 2);

    expect(result.placements).toHaveLength(3);
    expect(result.placements.every((p) => p.partId === "part1")).toBe(true);
  });

  it("starts new row when width exceeded", () => {
    const parts = [{ id: "part1", width: 2000, height: 100, quantity: 2 }];
    const result = shelfPack(parts, standardSheet, 2);

    expect(result.placements).toHaveLength(2);
    // Second part should be in a new row
    expect(result.placements[1].y).toBeGreaterThan(0);
  });

  it("rotates parts to fit when necessary", () => {
    const parts = [{ id: "tall", width: 100, height: 2000, quantity: 1 }];
    const result = shelfPack(parts, standardSheet, 2);

    expect(result.placements).toHaveLength(1);
    // Should rotate to fit (2000 > 1500 height)
    expect(result.placements[0].rotation).toBe(90);
  });

  it("calculates utilization correctly", () => {
    const parts = [{ id: "part1", width: 1500, height: 750, quantity: 1 }];
    const result = shelfPack(parts, standardSheet, 0);

    // 1500 * 750 = 1,125,000
    // 3000 * 1500 = 4,500,000
    // Utilization = 0.25
    expect(result.utilization[0]).toBeCloseTo(0.25);
  });

  it("uses multiple sheets when needed", () => {
    const parts = [{ id: "large", width: 2000, height: 1000, quantity: 5 }];
    const result = shelfPack(parts, standardSheet, 2);

    expect(result.sheetsUsed).toBeGreaterThan(1);
    expect(result.placements).toHaveLength(5);
  });
});
```

**Step 5: Add test script to package.json**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Step 6: Run tests**

```bash
npm run test:run
```

**Step 7: Commit**

```bash
git add vitest.config.ts vitest.setup.ts lib/nesting/__tests__/ package.json
git commit -m "test: add Vitest configuration and nesting algorithm tests"
```

---

## Milestone 5.2: DFM Validation

### Task 5.2.1: Create DFM Checks Module

**Files:**
- Create: `lib/dxf/dfm-checks.ts`
- Create: `lib/dxf/__tests__/dfm-checks.test.ts`

**Step 1: Create DFM validation functions**

Create `lib/dxf/dfm-checks.ts`:

```typescript
import type { ParsedDxf } from "./parser";

export type DfmSeverity = "error" | "warning";

export interface DfmIssue {
  type:
    | "HOLE_TOO_SMALL"
    | "WALL_TOO_THIN"
    | "ASPECT_RATIO_EXTREME"
    | "OPEN_CONTOUR"
    | "PART_TOO_LARGE"
    | "HEAT_WARP_RISK";
  severity: DfmSeverity;
  message: string;
  location?: { x: number; y: number };
  details?: Record<string, number | string>;
}

export interface DfmCheckConfig {
  thickness: number; // mm
  maxSheetWidth: number; // mm
  maxSheetHeight: number; // mm
  minHoleDiameterRatio: number; // multiplier of thickness
  minWallThicknessRatio: number; // multiplier of thickness
  maxAspectRatio: number;
  heatWarpAspectRatio: number;
}

export const defaultDfmConfig: DfmCheckConfig = {
  thickness: 3,
  maxSheetWidth: 3000,
  maxSheetHeight: 1500,
  minHoleDiameterRatio: 1.0, // hole >= thickness
  minWallThicknessRatio: 1.0, // wall >= thickness
  maxAspectRatio: 20, // flag if length/width > 20
  heatWarpAspectRatio: 10, // warn if length/width > 10 and thin
};

export function checkDfm(
  parsed: ParsedDxf,
  config: DfmCheckConfig = defaultDfmConfig
): DfmIssue[] {
  const issues: DfmIssue[] = [];

  // Check part size against sheet limits
  if (
    parsed.width > config.maxSheetWidth ||
    parsed.height > config.maxSheetHeight
  ) {
    issues.push({
      type: "PART_TOO_LARGE",
      severity: "error",
      message: `Part dimensions (${parsed.width.toFixed(0)}x${parsed.height.toFixed(0)}mm) exceed maximum sheet size (${config.maxSheetWidth}x${config.maxSheetHeight}mm)`,
      details: {
        partWidth: parsed.width,
        partHeight: parsed.height,
        maxWidth: config.maxSheetWidth,
        maxHeight: config.maxSheetHeight,
      },
    });
  }

  // Check aspect ratio for extreme shapes
  const aspectRatio = Math.max(parsed.width, parsed.height) /
    Math.min(parsed.width, parsed.height);

  if (aspectRatio > config.maxAspectRatio) {
    issues.push({
      type: "ASPECT_RATIO_EXTREME",
      severity: "error",
      message: `Extreme aspect ratio (${aspectRatio.toFixed(1)}:1) may cause handling issues`,
      details: { aspectRatio },
    });
  } else if (aspectRatio > config.heatWarpAspectRatio) {
    issues.push({
      type: "HEAT_WARP_RISK",
      severity: "warning",
      message: `High aspect ratio (${aspectRatio.toFixed(1)}:1) may cause heat warping during cutting`,
      details: { aspectRatio },
    });
  }

  // Check for small holes (circles in parsed.entities)
  const minHoleDiameter = config.thickness * config.minHoleDiameterRatio;
  for (const entity of parsed.entities) {
    if (entity.type === "CIRCLE" && entity.radius) {
      const diameter = entity.radius * 2;
      if (diameter < minHoleDiameter) {
        issues.push({
          type: "HOLE_TOO_SMALL",
          severity: "error",
          message: `Hole diameter (${diameter.toFixed(2)}mm) is smaller than minimum (${minHoleDiameter}mm) for ${config.thickness}mm material`,
          location: entity.center,
          details: {
            diameter,
            minimum: minHoleDiameter,
            thickness: config.thickness,
          },
        });
      }
    }
  }

  // Check for open contours (simplified - check if first/last points match)
  // This is a simplified check; real implementation would trace polylines
  const hasOpenContour = parsed.entities.some((e) => {
    if (e.type === "LWPOLYLINE" && e.vertices && e.vertices.length > 2) {
      const first = e.vertices[0];
      const last = e.vertices[e.vertices.length - 1];
      const distance = Math.hypot(last.x - first.x, last.y - first.y);
      return distance > 0.1 && !e.closed;
    }
    return false;
  });

  if (hasOpenContour) {
    issues.push({
      type: "OPEN_CONTOUR",
      severity: "error",
      message: "Part contains open contours that cannot be cut",
    });
  }

  return issues;
}

export function hasCriticalIssues(issues: DfmIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}

export function formatIssueForDisplay(issue: DfmIssue): string {
  const prefix = issue.severity === "error" ? "ERROR" : "WARNING";
  return `[${prefix}] ${issue.type}: ${issue.message}`;
}
```

**Step 2: Create tests**

Create `lib/dxf/__tests__/dfm-checks.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { checkDfm, hasCriticalIssues, defaultDfmConfig } from "../dfm-checks";
import type { ParsedDxf } from "../parser";

describe("DFM Checks", () => {
  const createMockParsed = (
    width: number,
    height: number,
    entities: any[] = []
  ): ParsedDxf => ({
    width,
    height,
    boundingBox: { minX: 0, minY: 0, maxX: width, maxY: height },
    entities,
  });

  describe("part size validation", () => {
    it("flags parts larger than sheet", () => {
      const parsed = createMockParsed(3500, 1000);
      const issues = checkDfm(parsed);

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe("PART_TOO_LARGE");
      expect(issues[0].severity).toBe("error");
    });

    it("passes parts within sheet bounds", () => {
      const parsed = createMockParsed(2000, 1000);
      const issues = checkDfm(parsed);

      expect(issues.filter((i) => i.type === "PART_TOO_LARGE")).toHaveLength(0);
    });
  });

  describe("aspect ratio validation", () => {
    it("errors on extreme aspect ratios", () => {
      const parsed = createMockParsed(2500, 100); // 25:1 ratio
      const issues = checkDfm(parsed);

      expect(issues.some((i) => i.type === "ASPECT_RATIO_EXTREME")).toBe(true);
    });

    it("warns on heat warp risk", () => {
      const parsed = createMockParsed(1500, 100); // 15:1 ratio
      const issues = checkDfm(parsed);

      expect(issues.some((i) => i.type === "HEAT_WARP_RISK")).toBe(true);
    });

    it("passes normal aspect ratios", () => {
      const parsed = createMockParsed(500, 200); // 2.5:1 ratio
      const issues = checkDfm(parsed);

      expect(
        issues.filter(
          (i) =>
            i.type === "ASPECT_RATIO_EXTREME" || i.type === "HEAT_WARP_RISK"
        )
      ).toHaveLength(0);
    });
  });

  describe("hole size validation", () => {
    it("flags holes smaller than material thickness", () => {
      const parsed = createMockParsed(100, 100, [
        { type: "CIRCLE", center: { x: 50, y: 50 }, radius: 1 }, // 2mm diameter
      ]);

      const issues = checkDfm(parsed, { ...defaultDfmConfig, thickness: 3 });

      expect(issues.some((i) => i.type === "HOLE_TOO_SMALL")).toBe(true);
    });

    it("passes adequately sized holes", () => {
      const parsed = createMockParsed(100, 100, [
        { type: "CIRCLE", center: { x: 50, y: 50 }, radius: 5 }, // 10mm diameter
      ]);

      const issues = checkDfm(parsed, { ...defaultDfmConfig, thickness: 3 });

      expect(issues.filter((i) => i.type === "HOLE_TOO_SMALL")).toHaveLength(0);
    });
  });

  describe("hasCriticalIssues", () => {
    it("returns true for error severity", () => {
      const issues = [{ type: "PART_TOO_LARGE" as const, severity: "error" as const, message: "test" }];
      expect(hasCriticalIssues(issues)).toBe(true);
    });

    it("returns false for warnings only", () => {
      const issues = [{ type: "HEAT_WARP_RISK" as const, severity: "warning" as const, message: "test" }];
      expect(hasCriticalIssues(issues)).toBe(false);
    });
  });
});
```

**Step 3: Run tests**

```bash
npm run test:run
```

**Step 4: Commit**

```bash
git add lib/dxf/dfm-checks.ts lib/dxf/__tests__/
git commit -m "feat(dfm): add DFM validation checks with tests"
```

---

# Summary: Task Checklist

## Phase 1: Core Platform MVP (Weeks 1-4)

### Milestone 1.1: State Management
- [ ] Task 1.1.1: Install and Configure Zustand
- [ ] Task 1.1.2: Install and Configure TanStack Query
- [ ] Task 1.1.3: Create App-Level Store

### Milestone 1.2: Interactive Konva Canvas
- [ ] Task 1.2.1: Install Konva and React-Konva
- [ ] Task 1.2.2: Create Grid Layer Component
- [ ] Task 1.2.3: Create Sheet Boundary Layer
- [ ] Task 1.2.4: Create Draggable Part Component
- [ ] Task 1.2.5: Create Parts Layer with Collision Detection
- [ ] Task 1.2.6: Create Main Nesting Canvas Component
- [ ] Task 1.2.7: Create Canvas Toolbar

### Milestone 1.3: Playground Integration
- [ ] Task 1.3.1: Create Playground Layout and Page

## Phase 2: Dutch Auction (Weeks 5-8)

### Milestone 2.1: Real-Time Firestore
- [ ] Task 2.1.1: Create Real-Time Sheet Subscription Hook
- [ ] Task 2.1.2: Implement Sheet Locking with Transactions

### Milestone 2.2: Dutch Auction Pricing
- [ ] Task 2.2.1: Create Auction Pricing Model
- [ ] Task 2.2.2: Create Price Ticker Component
- [ ] Task 2.2.3: Create Viability Progress Component

## Phase 3: Factory Integration (Weeks 9-12)

### Milestone 3.1: Admin Dashboard
- [ ] Task 3.1.1: Create Admin Layout
- [ ] Task 3.1.2: Create Sheet Injection Form
- [ ] Task 3.1.3: Create Production Queue View (not detailed above)
- [ ] Task 3.1.4: Create Order Management (not detailed above)

## Phase 4: WASM Nesting (Weeks 13-16)

### Milestone 4.1: WebAssembly Integration
- [ ] Task 4.1.1: Set Up WASM Build Infrastructure
- [ ] Task 4.1.2: Compile libnest2d (requires Emscripten)
- [ ] Task 4.1.3: Create Genetic Algorithm Progress UI (not detailed above)

## Phase 5: Launch Prep (Weeks 17-20)

### Milestone 5.1: Testing
- [ ] Task 5.1.1: Set Up Vitest
- [ ] Task 5.1.2: Add Pricing Engine Tests (not detailed above)
- [ ] Task 5.1.3: Add E2E Tests with Playwright (not detailed above)

### Milestone 5.2: DFM Validation
- [ ] Task 5.2.1: Create DFM Checks Module

### Milestone 5.3: Production Hardening
- [ ] Task 5.3.1: Add Error Boundaries (not detailed above)
- [ ] Task 5.3.2: Configure Firestore Security Rules (not detailed above)
- [ ] Task 5.3.3: Set Up CI/CD Pipeline (not detailed above)

---

Plan complete and saved to `docs/plans/2026-02-01-sheetmates-full-roadmap.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
