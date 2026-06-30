// Client-side helper to download a sheet's production DXF from the admin-gated export
// route. Kept free of server imports so it never pulls the writer into the bundle.

/**
 * Fetch `GET /api/export/sheet/{sheetId}` with the caller's Firebase ID token and
 * trigger a browser download of the resulting DXF. Returns the number of parts the
 * server had to skip (0 on a fully resolved sheet). Throws on failure.
 */
export async function downloadSheetDxf(
  sheetId: string,
  idToken: string
): Promise<{ skipped: number }> {
  const res = await fetch(`/api/export/sheet/${sheetId}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) {
    let message = `Export failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep the default message
    }
    throw new Error(message);
  }

  const skipped = Number(res.headers.get("X-Parts-Skipped") ?? "0");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sheet-${sheetId}.dxf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { skipped };
}
