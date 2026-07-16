// A resizable/movable selection rectangle overlaid on the image, used to OCR only part of
// it. The region is stored in the image's natural pixels so it survives zoom/resize; the
// overlay layer is sized to exactly cover the image (same offset parent, so it scrolls with
// it) and the rectangle is positioned in percentages so it rescales for free. The layer is
// click-through except on the rectangle (drag to move) and its 8 handles (drag to resize),
// so clicking elsewhere on the image still reaches the viewer.

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RegionSelector {
  el: HTMLElement;
  getRegion(): Region;
  reposition(): void;
  destroy(): void;
}

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type Dir = (typeof HANDLES)[number];
const MIN = 16; // minimum region size in natural px

// The returned layer must be appended into the image's positioned offset parent (.iv-root)
// so it overlays and scrolls with the image.
export function createRegionSelector(img: HTMLImageElement, onChange: (r: Region) => void): RegionSelector {
  const nW = img.naturalWidth || img.clientWidth;
  const nH = img.naturalHeight || img.clientHeight;
  let region: Region = { x: 0, y: 0, w: nW, h: nH };

  const layer = document.createElement("div");
  layer.className = "iv-region-layer";
  const rect = document.createElement("div");
  rect.className = "iv-region";
  layer.appendChild(rect);
  for (const dir of HANDLES) {
    const h = document.createElement("div");
    h.className = `iv-region-h iv-region-${dir}`;
    h.dataset.dir = dir;
    rect.appendChild(h);
  }

  function render(): void {
    rect.style.left = `${(region.x / nW) * 100}%`;
    rect.style.top = `${(region.y / nH) * 100}%`;
    rect.style.width = `${(region.w / nW) * 100}%`;
    rect.style.height = `${(region.h / nH) * 100}%`;
  }

  // Cover the image exactly. offsetLeft/Top are relative to the shared positioned parent
  // (.iv-root), so the layer and image scroll together without rect-math.
  function reposition(): void {
    layer.style.left = `${img.offsetLeft}px`;
    layer.style.top = `${img.offsetTop}px`;
    layer.style.width = `${img.offsetWidth}px`;
    layer.style.height = `${img.offsetHeight}px`;
  }

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  function startDrag(e: PointerEvent, dir: Dir | "move"): void {
    e.preventDefault();
    e.stopPropagation();
    const scale = nW / (layer.clientWidth || nW); // natural px per display px
    const scaleY = nH / (layer.clientHeight || nH);
    const start = { ...region };
    const px0 = e.clientX;
    const py0 = e.clientY;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent): void => {
      const dx = (ev.clientX - px0) * scale;
      const dy = (ev.clientY - py0) * scaleY;
      let { x, y, w, h } = start;
      if (dir === "move") {
        x = clamp(start.x + dx, 0, nW - start.w);
        y = clamp(start.y + dy, 0, nH - start.h);
      } else {
        if (dir.includes("w")) {
          const nx = clamp(start.x + dx, 0, start.x + start.w - MIN);
          w = start.x + start.w - nx;
          x = nx;
        }
        if (dir.includes("e")) w = clamp(start.w + dx, MIN, nW - start.x);
        if (dir.includes("n")) {
          const ny = clamp(start.y + dy, 0, start.y + start.h - MIN);
          h = start.y + start.h - ny;
          y = ny;
        }
        if (dir.includes("s")) h = clamp(start.h + dy, MIN, nH - start.y);
      }
      region = { x, y, w, h };
      render();
    };
    const up = (ev: PointerEvent): void => {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      onChange(region);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  }

  rect.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).dataset.dir) return; // a handle: let its own listener run
    startDrag(e, "move");
  });
  for (const h of Array.from(rect.querySelectorAll<HTMLElement>(".iv-region-h"))) {
    h.addEventListener("pointerdown", (e) => startDrag(e, h.dataset.dir as Dir));
  }

  reposition();
  render();

  const ro = new ResizeObserver(() => reposition());
  ro.observe(img);
  window.addEventListener("resize", reposition);

  return {
    el: layer,
    getRegion: () => region,
    reposition,
    destroy: () => {
      ro.disconnect();
      window.removeEventListener("resize", reposition);
      layer.remove();
    },
  };
}
