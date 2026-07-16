// On-image code detection. Native BarcodeDetector first (Chromium: QR + many 1D/2D
// formats, multiple codes per image), jsQR as a universal pure-JS fallback (QR only,
// one code per image) for Firefox/Safari. Both yield boxes in the image's natural pixel
// coordinates so a click can be hit-tested against them.

export interface DetectedCode {
  value: string;
  format: string; // normalized lower_snake, e.g. "qr_code"
  // Bounding box in the image's natural pixel space.
  box: { x: number; y: number; width: number; height: number };
}

function hasNativeDetector(): boolean {
  return typeof BarcodeDetector !== "undefined";
}

async function detectNative(img: HTMLImageElement): Promise<DetectedCode[]> {
  const supported = await BarcodeDetector.getSupportedFormats();
  const detector = supported.length ? new BarcodeDetector({ formats: supported }) : new BarcodeDetector();
  const found = await detector.detect(img);
  return found.map((b) => ({
    value: b.rawValue,
    format: b.format,
    box: { x: b.boundingBox.x, y: b.boundingBox.y, width: b.boundingBox.width, height: b.boundingBox.height },
  }));
}

function imageData(img: HTMLImageElement): ImageData | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  try {
    return ctx.getImageData(0, 0, w, h);
  } catch {
    return null; // tainted canvas (shouldn't happen for same-origin blob URLs)
  }
}

async function detectJsqr(img: HTMLImageElement): Promise<DetectedCode[]> {
  const data = imageData(img);
  if (!data) return [];
  const { default: jsQR } = await import("jsqr");
  const code = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
  if (!code) return [];
  const c = code.location;
  const xs = [c.topLeftCorner.x, c.topRightCorner.x, c.bottomRightCorner.x, c.bottomLeftCorner.x];
  const ys = [c.topLeftCorner.y, c.topRightCorner.y, c.bottomRightCorner.y, c.bottomLeftCorner.y];
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return [{ value: code.data, format: "qr_code", box: { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y } }];
}

// Detect all codes in a fully-loaded <img>. Never rejects; returns [] on any failure.
export async function detectCodes(img: HTMLImageElement): Promise<DetectedCode[]> {
  try {
    if (hasNativeDetector()) {
      const codes = await detectNative(img);
      // If the native detector found nothing, still try jsQR: some builds miss low-contrast
      // or inverted QR codes that jsQR's attemptBoth catches.
      if (codes.length) return codes;
    }
    return await detectJsqr(img);
  } catch {
    try {
      return await detectJsqr(img);
    } catch {
      return [];
    }
  }
}
