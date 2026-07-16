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
    .iv-root img.iv-on-code { cursor:pointer; }
    .iv-card { position:absolute; top:12px; left:50%; transform:translateX(-50%); z-index:2;
      max-width:min(90%, 460px); box-sizing:border-box; background:var(--iv-card-bg, #fff);
      color:var(--iv-card-fg, #1a1a1a); border-radius:10px; box-shadow:0 6px 24px rgba(0,0,0,0.32);
      padding:12px 14px; font:14px system-ui, sans-serif; }
    .iv-card-head { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .iv-card-tag { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.03em;
      color:#fff; background:var(--iv-accent, #2563eb); border-radius:5px; padding:2px 7px; }
    .iv-card-x { margin-left:auto; border:0; background:transparent; font-size:20px; line-height:1;
      cursor:pointer; color:var(--iv-muted, #667); padding:0 2px; }
    .iv-card-val { word-break:break-all; margin-bottom:10px; }
    .iv-card-val a { color:var(--iv-accent, #2563eb); }
    .iv-card-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .iv-card-contact .iv-card-name { font-size:16px; font-weight:600; margin-bottom:2px; }
    .iv-card-contact .iv-card-org { color:var(--iv-muted, #667); font-size:13px; margin-bottom:10px; }
    .iv-card-rows { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }
    .iv-card-row { display:flex; gap:8px; align-items:baseline; font-size:13px; }
    .iv-card-rowlabel { flex:0 0 auto; min-width:70px; color:var(--iv-muted, #667); }
    .iv-card-row a { color:var(--iv-accent, #2563eb); word-break:break-all; }
    .iv-card-btn { border:1px solid var(--iv-border, #d5d8dc); background:var(--iv-btn-bg, #f5f6f7);
      color:inherit; border-radius:7px; padding:5px 12px; font-size:13px; cursor:pointer; }
    .iv-card-btn:hover { background:var(--iv-btn-hover, #eceef0); }
    .iv-region-layer { position:absolute; z-index:2; pointer-events:none; }
    .iv-region { position:absolute; box-sizing:border-box; pointer-events:auto; cursor:move;
      border:1.5px solid var(--iv-accent, #2563eb); box-shadow:0 0 0 9999px rgba(0,0,0,0.35); }
    .iv-region-h { position:absolute; width:12px; height:12px; box-sizing:border-box; pointer-events:auto;
      background:#fff; border:1.5px solid var(--iv-accent, #2563eb); border-radius:2px; }
    .iv-region-nw { left:-6px; top:-6px; cursor:nwse-resize; }
    .iv-region-n  { left:calc(50% - 6px); top:-6px; cursor:ns-resize; }
    .iv-region-ne { right:-6px; top:-6px; cursor:nesw-resize; }
    .iv-region-e  { right:-6px; top:calc(50% - 6px); cursor:ew-resize; }
    .iv-region-se { right:-6px; bottom:-6px; cursor:nwse-resize; }
    .iv-region-s  { left:calc(50% - 6px); bottom:-6px; cursor:ns-resize; }
    .iv-region-sw { left:-6px; bottom:-6px; cursor:nesw-resize; }
    .iv-region-w  { left:-6px; top:calc(50% - 6px); cursor:ew-resize; }
    .iv-toolbar { position:absolute; top:10px; right:10px; z-index:3; display:flex; gap:6px; }
    .iv-tbtn { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--iv-border, #d5d8dc);
      background:var(--iv-btn-bg, rgba(255,255,255,0.92)); color:var(--iv-card-fg, #1a1a1a); border-radius:8px;
      padding:6px 11px; font:13px system-ui, sans-serif; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,0.18); }
    .iv-tbtn:hover { background:var(--iv-btn-hover, #fff); }
    .iv-panel { position:absolute; left:0; right:0; bottom:0; z-index:3; box-sizing:border-box;
      max-height:60%; overflow:auto; display:flex; flex-direction:column; background:var(--iv-card-bg, #fff);
      color:var(--iv-card-fg, #1a1a1a); border-top:1px solid var(--iv-border, #d5d8dc);
      box-shadow:0 -6px 24px rgba(0,0,0,0.22); padding:12px 14px; font:14px system-ui, sans-serif; }
    .iv-panel-body { display:flex; gap:18px; }
    .iv-panel-col { flex:1 1 0; min-width:0; display:flex; flex-direction:column; }
    @media (max-width:640px) {
      .iv-panel-body { flex-direction:column; gap:12px; }
      .iv-panel-col + .iv-panel-col { border-top:1px dashed var(--iv-border, #d5d8dc); padding-top:12px; }
    }
    .iv-panel-row { display:flex; align-items:center; gap:8px; margin:0 0 8px; flex-wrap:wrap; }
    .iv-panel-row select { font:inherit; padding:3px 6px; border-radius:6px; border:1px solid var(--iv-border, #d5d8dc); }
    .iv-panel-sub { margin-top:12px; padding-top:10px; border-top:1px dashed var(--iv-border, #d5d8dc); }
    .iv-panel-head { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .iv-panel-title { font-weight:600; }
    .iv-panel-head select { font:inherit; padding:3px 6px; border-radius:6px; border:1px solid var(--iv-border, #d5d8dc); }
    .iv-panel-x { margin-left:auto; border:0; background:transparent; font-size:20px; line-height:1;
      cursor:pointer; color:var(--iv-muted, #667); }
    .iv-panel-prog { color:var(--iv-muted, #667); font-size:13px; min-height:16px; margin-bottom:6px; }
    .iv-panel textarea { min-height:60px; box-sizing:border-box; width:100%; resize:vertical;
      font:13px/1.4 ui-monospace, monospace; border:1px solid var(--iv-border, #d5d8dc); border-radius:7px; padding:8px; }
    .iv-panel-actions { display:flex; gap:8px; margin-top:8px; }
  `;
  document.head.appendChild(s);
}
