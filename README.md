# imageview

A standalone, framework-agnostic, **client-side** image viewer for the browser. Feed it
image bytes and it shows them in an `<img>` with click-to-toggle fit vs actual size.
Everything runs on the user's machine, nothing is uploaded.

Read-only and dependency-free at its core. On-image QR/barcode detection, OCR and
translation are layered on top in later versions and load their engines on demand, so the
base viewer stays tiny.

**[▶ Live demo](https://hikashop-nicolas.github.io/imageview/)** — open an image, toggle
fit vs actual size, and try the QR, OCR and translation layers.

Used in production by **[Omnitext](https://hikashop-nicolas.github.io/omnitext/)**, a free
browser editor for practically any file, as its image viewer. Try it there without
installing anything.

## Usage

```ts
import { createImageViewer } from "imageview";

const handle = createImageViewer(
  document.getElementById("viewer")!,
  { bytes: myUint8Array, mime: "image/png", filename: "photo.png" },
);

// later
handle.destroy();
```

`createImageViewer(container, input, options?)`:

- `input`: `{ bytes: Uint8Array; mime?: string; filename?: string }`
- `options`: `{ i18n?: Record<string, string>; onZoomToggle?: (actual: boolean) => void; onFullscreen?: () => void; onExtractText?: ... }`
- returns `{ getImage(); getBarEnd(); setReadingMode(on); destroy() }`

A bottom bar holds the OCR button on the left, then a zoom slider (10% to 400%, a click on the picture
still toggles fit and 100%) and, when the host passes `onFullscreen`, a fullscreen button. The host does
the fullscreen itself and tells the viewer with `setReadingMode(on)`, which leaves the picture, the zoom
and the way out. `getBarEnd()` is the empty end of the bar, for a control the host owns.

`setLocale(code)` forces a UI language (`en`, `fr`, `ja`, `es`, `de`, `pt`, `ru`, `zh`); by default the browser's
preferred language is used, English fallback. Per-instance string overrides go through
`options.i18n`.

## Develop

```bash
npm install
npm run dev        # demo at the printed URL
npm run typecheck
npm test
npm run build      # emits dist/ (also runs on install via prepare)
```

## License

MIT
