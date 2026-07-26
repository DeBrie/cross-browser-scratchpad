const SURFACES = new Set(["popup", "side-panel", "sidebar"]);

export function scratchpadSurface(documentUrl) {
  try {
    const surface = new URL(documentUrl).searchParams.get("surface");
    return SURFACES.has(surface) ? surface : "unknown";
  } catch {
    return "unknown";
  }
}
