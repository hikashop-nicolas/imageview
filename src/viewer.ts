// imageview: a standalone, framework-agnostic, read-only image viewer. Shows the bytes
// via a blob URL in an <img>; click toggles fit-to-width vs actual size. SVG is rendered
// through <img> too (its scripts stay inert). Later phases add on-image QR detection, OCR
// and translation on top of this base; the base stays dependency-free.

import { ensureStyles } from "./styles";
import { translator, type Dict } from "./i18n";

export interface ImageInput {
  bytes: Uint8Array; // the raw image bytes
  mime?: string; // e.g. "image/png"; used for the blob type when present
  filename?: string; // for display / format hints (unused in the base viewer)
}

export interface ImageViewerOptions {
  // Per-instance string overrides layered on the detected locale.
  i18n?: Dict;
  // Notified when the user toggles between fit and actual size.
  onZoomToggle?: (actual: boolean) => void;
}

export interface ImageViewerHandle {
  // The <img> element, or null if the bytes could not be shown.
  getImage(): HTMLImageElement | null;
  destroy(): void;
}

class ImageViewer implements ImageViewerHandle {
  private root: HTMLElement;
  private url: string | null = null;
  private img: HTMLImageElement | null = null;
  private readonly tr: (key: string) => string;
  private readonly onZoomToggle?: (actual: boolean) => void;

  constructor(container: HTMLElement, input: ImageInput, opts: ImageViewerOptions) {
    ensureStyles();
    this.tr = translator(opts.i18n);
    this.onZoomToggle = opts.onZoomToggle;

    const root = document.createElement("div");
    root.className = "iv-root";
    this.root = root;

    if (input.bytes && input.bytes.length) {
      const blob = new Blob([input.bytes as BlobPart], input.mime ? { type: input.mime } : undefined);
      this.url = URL.createObjectURL(blob);
      const img = document.createElement("img");
      img.src = this.url;
      img.alt = "";
      img.addEventListener("click", () => this.toggleZoom());
      img.addEventListener("error", () => {
        root.textContent = "";
        root.append(this.message(this.tr("cannotDisplay")));
      });
      root.appendChild(img);
      this.img = img;
    } else {
      root.append(this.message(this.tr("nothingToDisplay")));
    }

    container.appendChild(root);
  }

  private toggleZoom(): void {
    const actual = this.root.classList.toggle("is-actual");
    this.onZoomToggle?.(actual);
  }

  private message(text: string): HTMLElement {
    const d = document.createElement("div");
    d.className = "iv-msg";
    d.textContent = text;
    return d;
  }

  getImage(): HTMLImageElement | null {
    return this.img;
  }

  destroy(): void {
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
    this.img = null;
    this.root.remove();
  }
}

// Mount a read-only image viewer inside `container`. Returns a handle; call destroy() to
// revoke the blob URL and remove the DOM.
export function createImageViewer(
  container: HTMLElement,
  input: ImageInput,
  options: ImageViewerOptions = {},
): ImageViewerHandle {
  return new ImageViewer(container, input, options);
}
