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
});
