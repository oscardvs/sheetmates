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
