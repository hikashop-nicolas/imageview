// One injected stylesheet for the viewer. Scoped under .iv-root so it can't leak into
// the host page. Injected once per document.

const STYLE_ID = "imageview-style";

export function ensureStyles(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .iv-root { height:100%; overflow:auto; background:var(--iv-canvas, #1a1a1a);
      display:flex; align-items:center; justify-content:center; position:relative; }
    .iv-root img { display:block; max-width:100%; max-height:100%; object-fit:contain; cursor:zoom-in; }
    .iv-root.is-actual { align-items:flex-start; justify-content:flex-start; }
    .iv-root.is-actual img { max-width:none; max-height:none; cursor:zoom-out; }
    .iv-msg { color:var(--iv-muted, #9aa0a6); padding:24px; font:14px system-ui, sans-serif; text-align:center; }
  `;
  document.head.appendChild(s);
}
