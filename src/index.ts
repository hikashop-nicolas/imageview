// imageview: a standalone, framework-agnostic, client-side image viewer.
//
// - viewer.ts  the read-only <img> viewer + the createImageViewer entry point
//
// Later phases add on-image QR/barcode detection, OCR and translation; the base viewer
// stays dependency-free and those features load their engines on demand.
export {
  createImageViewer,
  type ImageInput,
  type ImageViewerOptions,
  type ImageViewerHandle,
} from "./viewer";
export { setLocale, t, type Dict } from "./i18n";
