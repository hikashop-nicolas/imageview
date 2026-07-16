// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { buildCodeCard } from "./card";
import type { DetectedCode } from "./detect";

const tr = (k: string) => k; // identity translator for assertions
const box = { x: 0, y: 0, width: 10, height: 10 };

function code(value: string, format = "qr_code"): DetectedCode {
  return { value, format, box };
}

describe("buildCodeCard", () => {
  it("renders a URL value as a safe external link", () => {
    const card = buildCodeCard(code("https://example.com/x"), tr, { onClose: () => {} });
    const a = card.querySelector("a")!;
    expect(a.href).toBe("https://example.com/x");
    expect(a.target).toBe("_blank");
    expect(a.rel).toContain("noopener");
  });

  it("prefixes www. links with https://", () => {
    const card = buildCodeCard(code("www.example.com"), tr, { onClose: () => {} });
    expect(card.querySelector("a")!.href).toBe("https://www.example.com/");
  });

  it("renders a non-URL value as plain text (no link)", () => {
    const card = buildCodeCard(code("just some text"), tr, { onClose: () => {} });
    expect(card.querySelector("a")).toBeNull();
    expect(card.querySelector(".iv-card-val")!.textContent).toBe("just some text");
  });

  it("shows the QR format tag", () => {
    const card = buildCodeCard(code("x"), tr, { onClose: () => {} });
    expect(card.querySelector(".iv-card-tag")!.textContent).toBe("qrCode");
  });

  it("fires onClose from the × button", () => {
    const onClose = vi.fn();
    const card = buildCodeCard(code("x"), tr, { onClose });
    card.querySelector(".iv-card-x")!.dispatchEvent(new MouseEvent("click"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("adds a new-document action only when onNewDoc is given", () => {
    const without = buildCodeCard(code("x"), tr, { onClose: () => {} });
    expect(without.querySelectorAll(".iv-card-btn").length).toBe(1); // copy only

    const onNewDoc = vi.fn();
    const withNd = buildCodeCard(code("payload"), tr, { onNewDoc, onClose: () => {} });
    const btns = withNd.querySelectorAll(".iv-card-btn");
    expect(btns.length).toBe(2);
    (btns[1] as HTMLElement).dispatchEvent(new MouseEvent("click"));
    expect(onNewDoc).toHaveBeenCalledWith("payload");
  });
});
