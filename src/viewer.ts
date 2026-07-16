// imageview: a standalone, framework-agnostic, read-only image viewer. Shows the bytes
// via a blob URL in an <img>; click toggles fit-to-width vs actual size. SVG is rendered
// through <img> too (its scripts stay inert).
//
// On top of the base viewer: clicking a spot that sits on a QR/barcode opens an info card
// for that code instead of toggling zoom. Detection runs lazily on first interaction (not
// on open) and its engine (jsQR) loads on demand, so the base viewer stays light.

import { ensureStyles } from "./styles";
import { translator, type Dict } from "./i18n";
import { detectCodes, type DetectedCode } from "./detect";
import { buildCodeCard } from "./card";
import { buildOcrPanel, type OcrPanel } from "./ocr-panel";

export interface ImageInput {
  bytes: Uint8Array; // the raw image bytes
  mime?: string; // e.g. "image/png"; used for the blob type when present
  filename?: string; // for display / format hints (unused in the base viewer)
}

export type ExtractSource = "qr" | "ocr" | "translate";

export interface ImageViewerOptions {
  // Per-instance string overrides layered on the detected locale.
  i18n?: Dict;
  // Notified when the user toggles between fit and actual size.
  onZoomToggle?: (actual: boolean) => void;
  // When provided, extracted text (a decoded code, and later OCR/translation output) can
  // be sent to the host, e.g. to open a new document. Adds a "new document" action.
  onExtractText?: (text: string, meta: { source: ExtractSource }) => void;
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
  private readonly opts: ImageViewerOptions;

  private scanPromise: Promise<DetectedCode[]> | null = null;
  private codes: DetectedCode[] = [];
  private card: HTMLElement | null = null;
  private ocrPanel: OcrPanel | null = null;

  constructor(container: HTMLElement, input: ImageInput, opts: ImageViewerOptions) {
    ensureStyles();
    this.tr = translator(opts.i18n);
    this.opts = opts;

    const root = document.createElement("div");
    root.className = "iv-root";
    this.root = root;

    if (input.bytes && input.bytes.length) {
      const blob = new Blob([input.bytes as BlobPart], input.mime ? { type: input.mime } : undefined);
      this.url = URL.createObjectURL(blob);
      const img = document.createElement("img");
      img.src = this.url;
      img.alt = "";
      img.addEventListener("click", (e) => void this.handleClick(e));
      img.addEventListener("mouseenter", () => void this.ensureScan());
      img.addEventListener("mousemove", (e) => this.updateHoverCursor(e));
      img.addEventListener("error", () => {
        root.textContent = "";
        root.append(this.message(this.tr("cannotDisplay")));
      });
      root.appendChild(img);
      this.img = img;
      root.appendChild(this.buildToolbar());
    } else {
      root.append(this.message(this.tr("nothingToDisplay")));
    }

    container.appendChild(root);
  }

  private buildToolbar(): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "iv-toolbar";
    const ocr = document.createElement("button");
    ocr.className = "iv-tbtn";
    ocr.type = "button";
    ocr.textContent = "OCR";
    ocr.title = this.tr("extractText");
    ocr.addEventListener("click", () => this.toggleOcr());
    bar.appendChild(ocr);
    return bar;
  }

  private toggleOcr(): void {
    if (this.ocrPanel) {
      this.ocrPanel.destroy();
      this.ocrPanel = null;
      return;
    }
    if (!this.img) return;
    const onExtractText = this.opts.onExtractText
      ? (value: string, source: "ocr" | "translate") => this.opts.onExtractText!(value, { source })
      : undefined;
    this.ocrPanel = buildOcrPanel(this.img, this.tr, {
      onExtractText,
      onClose: () => {
        this.ocrPanel?.destroy();
        this.ocrPanel = null;
      },
    });
    this.root.appendChild(this.ocrPanel.el);
  }

  // Run code detection once, lazily, caching the result. Never rejects.
  private ensureScan(): Promise<DetectedCode[]> {
    if (!this.scanPromise) {
      const img = this.img;
      this.scanPromise = img
        ? detectCodes(img).then((codes) => {
            this.codes = codes;
            return codes;
          })
        : Promise.resolve([]);
    }
    return this.scanPromise;
  }

  private async handleClick(e: MouseEvent): Promise<void> {
    if (this.card) this.closeCard();
    const codes = this.codes.length ? this.codes : await this.ensureScan();
    const hit = this.hitTest(e, codes);
    if (hit) this.openCard(hit);
    else this.toggleZoom();
  }

  // Map a click to the image's natural pixel space and return the code under it, if any.
  private hitTest(e: MouseEvent, codes: DetectedCode[]): DetectedCode | null {
    const img = this.img;
    if (!img || !codes.length) return null;
    const rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const nx = ((e.clientX - rect.left) * img.naturalWidth) / rect.width;
    const ny = ((e.clientY - rect.top) * img.naturalHeight) / rect.height;
    for (const c of codes) {
      const b = c.box;
      if (nx >= b.x && nx <= b.x + b.width && ny >= b.y && ny <= b.y + b.height) return c;
    }
    return null;
  }

  private updateHoverCursor(e: MouseEvent): void {
    if (!this.img || !this.codes.length) return;
    this.img.classList.toggle("iv-on-code", !!this.hitTest(e, this.codes));
  }

  private openCard(code: DetectedCode): void {
    const onNewDoc = this.opts.onExtractText
      ? (value: string) => this.opts.onExtractText!(value, { source: "qr" })
      : undefined;
    this.card = buildCodeCard(code, this.tr, { onNewDoc, onClose: () => this.closeCard() });
    this.root.appendChild(this.card);
  }

  private closeCard(): void {
    this.card?.remove();
    this.card = null;
  }

  private toggleZoom(): void {
    const actual = this.root.classList.toggle("is-actual");
    this.opts.onZoomToggle?.(actual);
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
    this.closeCard();
    this.ocrPanel?.destroy();
    this.ocrPanel = null;
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
