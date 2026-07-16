import { createImageViewer, type ImageViewerHandle } from "../src/index";

const viewerEl = document.getElementById("viewer")!;
const fileInput = document.getElementById("file") as HTMLInputElement;
let handle: ImageViewerHandle | null = null;

async function open(file: File): Promise<void> {
  handle?.destroy();
  viewerEl.textContent = "";
  handle = createImageViewer(
    viewerEl,
    { bytes: new Uint8Array(await file.arrayBuffer()), mime: file.type, filename: file.name },
    { onZoomToggle: (actual) => console.log("actual size:", actual) },
  );
  (window as unknown as Record<string, unknown>).ivHandle = handle; // handy in the console
}

async function openUrl(url: string): Promise<void> {
  const res = await fetch(url);
  const bytes = new Uint8Array(await res.arrayBuffer());
  handle?.destroy();
  viewerEl.textContent = "";
  handle = createImageViewer(
    viewerEl,
    { bytes, mime: res.headers.get("content-type") ?? undefined, filename: url.split("/").pop() },
    { onZoomToggle: (actual) => console.log("actual size:", actual) },
  );
  (window as unknown as Record<string, unknown>).ivHandle = handle;
}

fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (f) void open(f);
});

// Convenience: ?src=<url> loads an image straight away (handy for demos and testing).
const src = new URLSearchParams(location.search).get("src");
if (src) void openUrl(src);

// Drop an image anywhere on the page.
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (f) void open(f);
});
