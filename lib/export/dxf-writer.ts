import type { NestingPlacement } from "@/lib/nesting/types";

export function generateNestingDxf(
  placements: NestingPlacement[],
  sheetWidth: number,
  sheetHeight: number
): string {
  const lines: string[] = [];

  // DXF header
  lines.push("0", "SECTION", "2", "HEADER");
  lines.push("0", "ENDSEC");

  // Entities section
  lines.push("0", "SECTION", "2", "ENTITIES");

  // Sheet outline
  addRect(lines, 0, 0, sheetWidth, sheetHeight, "SHEET");

  // Placed parts as rectangles (bounding box representation)
  for (const p of placements) {
    addRect(lines, p.x, p.y, p.width, p.height, "PARTS");
  }

  lines.push("0", "ENDSEC");
  lines.push("0", "EOF");

  return lines.join("\n");
}

function addRect(
  lines: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  layer: string
) {
  const corners = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];

  for (let i = 0; i < 4; i++) {
    const [x1, y1] = corners[i];
    const [x2, y2] = corners[(i + 1) % 4];
    lines.push(
      "0", "LINE",
      "8", layer,
      "10", x1.toString(),
      "20", y1.toString(),
      "30", "0",
      "11", x2.toString(),
      "21", y2.toString(),
      "31", "0"
    );
  }
}
