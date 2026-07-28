/**
 * Meta Pixel tracking helper.
 * The base pixel is loaded in index.html. Every call is guarded so the app
 * keeps working when the pixel is blocked or not yet loaded.
 */
export function trackPixel(
  event: string,
  params?: Record<string, unknown>,
  standard = false,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  try {
    window.fbq(standard ? "track" : "trackCustom", event, params);
  } catch (err) {
    console.error("Meta Pixel tracking failed:", err);
  }
}
