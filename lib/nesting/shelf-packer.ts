import type {
  NestingPart,
  NestingSheet,
  NestingPlacement,
  NestingResult,
} from "./types";

interface Shelf {
  y: number;
  height: number;
  xCursor: number;
}

interface SheetState {
  shelves: Shelf[];
  sheetIndex: number;
}

export function shelfPack(
  parts: NestingPart[],
  sheet: NestingSheet,
  kerfMm: number = 2
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

  const placements: NestingPlacement[] = [];
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

  for (const item of expanded) {
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
      // Create a new sheet
      const si = sheets.length;
      const sheetState = getOrCreateSheet(si);

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
      } else {
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
        }
      }
    }
  }

  // Calculate utilization per sheet
  const sheetArea = sheet.width * sheet.height;
  const utilization = sheets.map((_, si) => {
    const sheetPlacements = placements.filter((p) => p.sheetIndex === si);
    const usedArea = sheetPlacements.reduce(
      (sum, p) => sum + p.width * p.height,
      0
    );
    return sheetArea > 0 ? usedArea / sheetArea : 0;
  });

  return {
    placements,
    sheetsUsed: sheets.length,
    utilization,
  };
}
