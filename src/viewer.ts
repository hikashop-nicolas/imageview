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
  // When provided, a fullscreen button sits beside the zoom; the host enters or leaves
  // fullscreen when it is pressed, and tells the viewer through setReadingMode.
  onFullscreen?: () => void;
}

export interface ImageViewerHandle {
  // The <img> element, or null if the bytes could not be shown.
  getImage(): HTMLImageElement | null;
  // The empty end of the bottom bar, for a control the host owns (it hides in reading mode).
  getBarEnd(): HTMLElement;
  // Reading mode, for a host's fullscreen: the picture, the zoom and the way out, nothing else.
  setReadingMode(on: boolean): void;
  destroy(): void;
}

const SLIDER_STEPS = 1000;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 4;
// A logarithmic slider: each stretch of it is the same factor of zoom.
const sliderToZoom = (v: number): number => ZOOM_MIN * (ZOOM_MAX / ZOOM_MIN) ** (v / SLIDER_STEPS);
const zoomToSlider = (z: number): number =>
  Math.round((Math.log(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) / ZOOM_MIN) / Math.log(ZOOM_MAX / ZOOM_MIN)) * SLIDER_STEPS);

const svgIcon = (inner: string): string =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const ICON_FS = svgIcon(
  '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>',
);
const ICON_FS_EXIT = svgIcon(
  '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/>',
);

class ImageViewer implements ImageViewerHandle {
  private shell: HTMLElement;
  private root: HTMLElement;
  private url: string | null = null;
  private img: HTMLImageElement | null = null;
  private readonly tr: (key: string) => string;
  private readonly opts: ImageViewerOptions;

  private scanPromise: Promise<DetectedCode[]> | null = null;
  private codes: DetectedCode[] = [];
  private card: HTMLElement | null = null;
  private ocrPanel: OcrPanel | null = null;
  private splitter: HTMLElement | null = null;
  private panelHeight: number | null = null; // remembered across open/close
  private bar!: HTMLElement;
  private barEnd!: HTMLElement;
  private zoomSlider: HTMLInputElement | null = null;
  private zoomLabel: HTMLElement | null = null;
  private fsButton: HTMLButtonElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  // null: fit the picture to the view; otherwise the scale of its natural size.
  private zoom: number | null = null;

  constructor(container: HTMLElement, input: ImageInput, opts: ImageViewerOptions) {
    ensureStyles();
    this.tr = translator(opts.i18n);
    this.opts = opts;

    // A flex column: the image area (fills), an optional splitter, and the OCR panel.
    const shell = document.createElement("div");
    shell.className = "iv-shell";
    this.shell = shell;

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
        this.img = null;
        this.closeOcr();
        this.bar.classList.add("iv-bar-broken");
      });
      root.appendChild(img);
      this.img = img;
    } else {
      root.append(this.message(this.tr("nothingToDisplay")));
    }

    shell.appendChild(root);
    shell.appendChild(this.buildBar());
    container.appendChild(shell);
    if (this.img) {
      this.img.addEventListener("load", () => this.syncZoom());
      if (this.img.complete) this.syncZoom();
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => this.syncZoom());
        this.resizeObserver.observe(root);
      }
      this.bindPinch();
    } else this.bar.classList.add("iv-bar-broken");
  }

  // Two fingers zoom the picture about the point between them.
  private bindPinch(): void {
    const root = this.root;
    const dist = (e: TouchEvent): number =>
      Math.hypot(e.touches[0]!.clientX - e.touches[1]!.clientX, e.touches[0]!.clientY - e.touches[1]!.clientY) || 1;
    let pinch: { dist: number; zoom: number } | null = null;
    let raf = 0;
    let to = 1;
    let at = { x: 0, y: 0 };
    root.addEventListener(
      "touchstart",
      (e) => {
        pinch = e.touches.length === 2 ? { dist: dist(e), zoom: this.zoom ?? this.fitScale() } : null;
      },
      { passive: true },
    );
    root.addEventListener(
      "touchmove",
      (e) => {
        if (!pinch || e.touches.length !== 2) return;
        e.preventDefault();
        to = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinch.zoom * (dist(e) / pinch.dist)));
        at = {
          x: (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2,
          y: (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2,
        };
        if (!raf)
          raf = requestAnimationFrame(() => {
            raf = 0;
            this.setZoom(to, at);
          });
      },
      { passive: false },
    );
    const end = (e: TouchEvent): void => {
      if (e.touches.length < 2) pinch = null;
    };
    root.addEventListener("touchend", end, { passive: true });
    root.addEventListener("touchcancel", end, { passive: true });
  }

  private buildBar(): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "iv-bar";
    this.bar = bar;
    const button = (className: string, html: string, label: string, onClick: () => void): HTMLButtonElement => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `iv-bb-btn iv-ctl ${className}`;
      b.innerHTML = html;
      b.title = label;
      b.setAttribute("aria-label", label);
      b.addEventListener("click", onClick);
      return b;
    };
    const ocr = button("iv-ocr-btn", "OCR", this.tr("extractText"), () => this.toggleOcr());
    const grow = document.createElement("span");
    grow.className = "iv-bb-grow";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "iv-zoom iv-ctl";
    slider.min = "0";
    slider.max = String(SLIDER_STEPS);
    slider.step = "1";
    slider.title = this.tr("zoom");
    slider.setAttribute("aria-label", this.tr("zoom"));
    slider.addEventListener("input", () => this.setZoom(sliderToZoom(Number(slider.value))));
    this.zoomSlider = slider;
    const label = document.createElement("span");
    label.className = "iv-zoom-label iv-ctl";
    this.zoomLabel = label;
    bar.append(ocr, grow, slider, label);
    if (this.opts.onFullscreen) {
      const fs = button("iv-bb-icon iv-fs-btn", ICON_FS, this.tr("fullscreen"), () => this.opts.onFullscreen?.());
      this.fsButton = fs;
      bar.append(fs);
    }
    const end = document.createElement("span");
    end.className = "iv-bar-end";
    this.barEnd = end;
    bar.append(end);
    return bar;
  }

  getBarEnd(): HTMLElement {
    return this.barEnd;
  }

  setReadingMode(on: boolean): void {
    this.shell.classList.toggle("iv-reading", on);
    if (on) this.closeOcr();
    if (this.fsButton) {
      const label = this.tr(on ? "exitFullscreen" : "fullscreen");
      this.fsButton.innerHTML = on ? ICON_FS_EXIT : ICON_FS;
      this.fsButton.title = label;
      this.fsButton.setAttribute("aria-label", label);
    }
    // The picture has a different room now, and "fit" follows it.
    requestAnimationFrame(() => this.syncZoom());
  }

  // The scale at which the picture shows when it is fitted: never more than its natural size.
  private fitScale(): number {
    const img = this.img;
    if (!img || !img.naturalWidth || !img.naturalHeight) return 1;
    const w = this.root.clientWidth || img.naturalWidth;
    const h = this.root.clientHeight || img.naturalHeight;
    return Math.min(1, w / img.naturalWidth, h / img.naturalHeight);
  }

  // Put the slider and the label on the zoom the picture shows now.
  private syncZoom(): void {
    const z = this.zoom ?? this.fitScale();
    if (this.zoomSlider) this.zoomSlider.value = String(zoomToSlider(z));
    if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(z * 100)}%`;
  }

  // Show the picture at scale `z` of its natural size (null: fitted), keeping the point `at` (client
  // coordinates; the middle of the view by default) of the picture where it was.
  private setZoom(z: number | null, at?: { x: number; y: number }): void {
    const img = this.img;
    if (!img) return;
    const root = this.root;
    const rect = root.getBoundingClientRect();
    const px = at ? at.x - rect.left : root.clientWidth / 2;
    const py = at ? at.y - rect.top : root.clientHeight / 2;
    const before = { w: img.offsetWidth || 1, h: img.offsetHeight || 1 };
    const cx = (root.scrollLeft + px - img.offsetLeft) / before.w;
    const cy = (root.scrollTop + py - img.offsetTop) / before.h;
    this.zoom = z;
    if (z === null) {
      root.classList.remove("is-actual");
      img.style.width = "";
      img.style.height = "";
    } else {
      root.classList.add("is-actual");
      img.style.width = `${Math.round(img.naturalWidth * z)}px`;
      img.style.height = `${Math.round(img.naturalHeight * z)}px`;
      root.scrollLeft = Math.max(0, cx * img.offsetWidth + img.offsetLeft - px);
      root.scrollTop = Math.max(0, cy * img.offsetHeight + img.offsetTop - py);
    }
    this.syncZoom();
  }

  private toggleOcr(): void {
    if (this.ocrPanel) {
      this.closeOcr();
      return;
    }
    if (!this.img) return;
    const onExtractText = this.opts.onExtractText
      ? (value: string, source: "ocr" | "translate") => this.opts.onExtractText!(value, { source })
      : undefined;
    this.ocrPanel = buildOcrPanel(this.img, this.root, this.tr, {
      onExtractText,
      onClose: () => this.closeOcr(),
    });

    // Splitter above the panel; drag to rebalance image vs panel height.
    const splitter = document.createElement("div");
    splitter.className = "iv-splitter";
    splitter.addEventListener("pointerdown", (e) => this.startSplit(e));
    this.splitter = splitter;

    const h = this.panelHeight ?? Math.round(this.shell.clientHeight * 0.42);
    this.setPanelHeight(h);
    this.shell.insertBefore(splitter, this.bar);
    this.shell.insertBefore(this.ocrPanel.el, this.bar);
  }

  private closeOcr(): void {
    this.ocrPanel?.destroy();
    this.ocrPanel = null;
    this.splitter?.remove();
    this.splitter = null;
  }

  private setPanelHeight(h: number): void {
    const max = this.shell.clientHeight - 80; // keep at least a sliver of image visible
    const clamped = Math.max(120, Math.min(h, Math.max(120, max)));
    this.panelHeight = clamped;
    if (this.ocrPanel) this.ocrPanel.el.style.height = `${clamped}px`;
  }

  private startSplit(e: PointerEvent): void {
    e.preventDefault();
    const shellRect = this.shell.getBoundingClientRect();
    const move = (ev: PointerEvent): void => this.setPanelHeight(shellRect.bottom - ev.clientY);
    const up = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
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
    const actual = this.zoom === null;
    this.setZoom(actual ? 1 : null);
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
    this.closeOcr();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
    this.img = null;
    this.shell.remove();
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
