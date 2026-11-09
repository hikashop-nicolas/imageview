// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { createImageViewer } from "./viewer";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG magic, enough to blob

function mount(bytes: Uint8Array, opts = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const handle = createImageViewer(container, { bytes, mime: "image/png" }, opts);
  return { container, handle };
}

// Flush pending microtasks (the click handler is async: it awaits code detection first).
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("createImageViewer", () => {
  it("renders an <img> with a blob URL for non-empty bytes", () => {
    const { container, handle } = mount(PNG_BYTES);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toMatch(/^blob:/);
    expect(handle.getImage()).toBe(img);
    handle.destroy();
  });

  it("toggles is-actual on click (no code under the point) and reports via onZoomToggle", async () => {
    const onZoomToggle = vi.fn();
    const { container, handle } = mount(PNG_BYTES, { onZoomToggle });
    const root = container.querySelector(".iv-root")!;
    const img = container.querySelector("img")!;

    img.dispatchEvent(new MouseEvent("click"));
    await tick();
    expect(root.classList.contains("is-actual")).toBe(true);
    expect(onZoomToggle).toHaveBeenLastCalledWith(true);

    img.dispatchEvent(new MouseEvent("click"));
    await tick();
    expect(root.classList.contains("is-actual")).toBe(false);
    expect(onZoomToggle).toHaveBeenLastCalledWith(false);
    handle.destroy();
  });

  it("shows a message and no image for empty bytes", () => {
    const { container, handle } = mount(new Uint8Array(0));
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".iv-msg")?.textContent).toBeTruthy();
    expect(handle.getImage()).toBeNull();
    handle.destroy();
  });

  it("replaces the image with a message when the image fails to load", () => {
    const { container, handle } = mount(PNG_BYTES);
    const img = container.querySelector("img")!;
    img.dispatchEvent(new Event("error"));
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".iv-msg")?.textContent).toBeTruthy();
    handle.destroy();
  });

  it("revokes the blob URL and removes the DOM on destroy", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const { container, handle } = mount(PNG_BYTES);
    const src = container.querySelector("img")!.getAttribute("src")!;
    handle.destroy();
    expect(revoke).toHaveBeenCalledWith(src);
    expect(container.querySelector(".iv-root")).toBeNull();
    revoke.mockRestore();
  });

  it("applies i18n overrides", () => {
    const { container, handle } = mount(new Uint8Array(0), { i18n: { nothingToDisplay: "VIDE" } });
    expect(container.querySelector(".iv-msg")?.textContent).toBe("VIDE");
    handle.destroy();
  });

  describe("bottom bar", () => {
    const size = (img: HTMLImageElement, w: number, h: number): void => {
      Object.defineProperty(img, "naturalWidth", { value: w, configurable: true });
      Object.defineProperty(img, "naturalHeight", { value: h, configurable: true });
    };

    it("puts OCR first, then the zoom, and a slot at the end for the host", () => {
      const { container, handle } = mount(PNG_BYTES);
      const kids = Array.from(container.querySelector(".iv-bar")!.children);
      expect(kids[0]!.classList.contains("iv-ocr-btn")).toBe(true);
      expect(container.querySelector(".iv-zoom")).not.toBeNull();
      expect(kids[kids.length - 1]).toBe(handle.getBarEnd());
      expect(container.querySelector(".iv-fs-btn")).toBeNull(); // no fullscreen unless the host takes it
      handle.destroy();
    });

    it("the slider shows the picture at that share of its natural size", () => {
      const { container, handle } = mount(PNG_BYTES);
      const img = container.querySelector("img")!;
      size(img, 400, 200);
      const slider = container.querySelector<HTMLInputElement>(".iv-zoom")!;
      slider.value = "500"; // the middle of a logarithmic 10%..400%: 63%
      slider.dispatchEvent(new Event("input"));
      expect(container.querySelector(".iv-root")!.classList.contains("is-actual")).toBe(true);
      expect(img.style.width).toBe("253px");
      expect(container.querySelector(".iv-zoom-label")!.textContent).toBe("63%");
      handle.destroy();
    });

    it("a click goes back to fitted after the slider, and the label follows", async () => {
      const { container, handle } = mount(PNG_BYTES);
      const img = container.querySelector("img")!;
      size(img, 400, 200);
      const slider = container.querySelector<HTMLInputElement>(".iv-zoom")!;
      slider.value = "800";
      slider.dispatchEvent(new Event("input"));
      img.dispatchEvent(new MouseEvent("click"));
      await tick();
      expect(container.querySelector(".iv-root")!.classList.contains("is-actual")).toBe(false);
      expect(img.style.width).toBe("");
      handle.destroy();
    });

    it("has a fullscreen button when the host wants one, and reading mode swaps it and hides the rest", () => {
      const onFullscreen = vi.fn();
      const { container, handle } = mount(PNG_BYTES, { onFullscreen });
      const fs = container.querySelector<HTMLButtonElement>(".iv-fs-btn")!;
      fs.click();
      expect(onFullscreen).toHaveBeenCalledOnce();
      const before = fs.title;
      handle.setReadingMode(true);
      expect(container.querySelector(".iv-shell")!.classList.contains("iv-reading")).toBe(true);
      expect(fs.title).not.toBe(before);
      handle.setReadingMode(false);
      expect(container.querySelector(".iv-shell")!.classList.contains("iv-reading")).toBe(false);
      expect(fs.title).toBe(before);
      handle.destroy();
    });

    it("keeps the bar, with only the host's slot working, when there is no picture", () => {
      const { container, handle } = mount(new Uint8Array(0));
      const bar = container.querySelector(".iv-bar")!;
      expect(bar.classList.contains("iv-bar-broken")).toBe(true);
      expect(bar.contains(handle.getBarEnd())).toBe(true);
      handle.destroy();
    });

    it("two fingers zoom about the point between them", async () => {
      const { container, handle } = mount(PNG_BYTES);
      const img = container.querySelector("img")!;
      size(img, 400, 200);
      const root = container.querySelector<HTMLElement>(".iv-root")!;
      const touch = (type: string, pts: [number, number][]): Event =>
        Object.assign(new Event(type, { cancelable: true, bubbles: true }), {
          touches: pts.map(([clientX, clientY]) => ({ clientX, clientY })),
        });
      root.dispatchEvent(touch("touchstart", [[100, 100], [200, 100]]));
      const move = touch("touchmove", [[50, 100], [250, 100]]); // the fingers spread to twice as far
      root.dispatchEvent(move);
      expect(move.defaultPrevented).toBe(true);
      await new Promise((r) => setTimeout(r, 30));
      // fitted, a 400 px picture in a view with no size here is shown at 100%: twice that is 200%
      expect(root.classList.contains("is-actual")).toBe(true);
      expect(img.style.width).toBe("800px");
      expect(container.querySelector(".iv-zoom-label")!.textContent).toBe("200%");
      handle.destroy();
    });

    it("a single touch is left to the browser, to scroll", () => {
      const { container, handle } = mount(PNG_BYTES);
      const root = container.querySelector<HTMLElement>(".iv-root")!;
      root.dispatchEvent(Object.assign(new Event("touchstart", { bubbles: true }), { touches: [{ clientX: 1, clientY: 1 }] }));
      const move = Object.assign(new Event("touchmove", { cancelable: true, bubbles: true }), { touches: [{ clientX: 9, clientY: 9 }] });
      root.dispatchEvent(move);
      expect(move.defaultPrevented).toBe(false);
      handle.destroy();
    });
  });
});
