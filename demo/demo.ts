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

fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (f) void open(f);
});

// Drop an image anywhere on the page.
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (f) void open(f);
});
