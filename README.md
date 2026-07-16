# imageview

A standalone, framework-agnostic, **client-side** image viewer for the browser. Feed it
image bytes and it shows them in an `<img>` with click-to-toggle fit vs actual size.
Everything runs on the user's machine, nothing is uploaded.

Read-only and dependency-free at its core. On-image QR/barcode detection, OCR and
translation are layered on top in later versions and load their engines on demand, so the
base viewer stays tiny.

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
- `options`: `{ i18n?: Record<string, string>; onZoomToggle?: (actual: boolean) => void }`
- returns `{ getImage(): HTMLImageElement | null; destroy(): void }`

`setLocale(code)` forces a UI language (`en` / `fr` / `ja`); by default the browser's
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
