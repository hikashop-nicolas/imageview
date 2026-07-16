// One injected stylesheet for the viewer. Scoped under .iv-root so it can't leak into
// the host page. Injected once per document.

const STYLE_ID = "imageview-style";

export function ensureStyles(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .iv-shell { height:100%; min-height:0; display:flex; flex-direction:column; }
    .iv-root { flex:1 1 auto; min-height:0; overflow:auto; background:var(--iv-canvas, #1a1a1a);
      display:flex; align-items:center; justify-content:center; position:relative; }
    .iv-splitter { flex:0 0 auto; height:9px; cursor:row-resize; background:var(--iv-border, #d5d8dc);
      position:relative; touch-action:none; }
    .iv-splitter::after { content:""; position:absolute; left:50%; top:50%; width:38px; height:3px;
      transform:translate(-50%,-50%); border-radius:2px; background:var(--iv-muted, #9aa0a6); }
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
    .iv-panel { flex:0 0 auto; box-sizing:border-box; min-height:0; position:relative;
      display:flex; flex-direction:column; background:var(--iv-card-bg, #fff); color:var(--iv-card-fg, #1a1a1a);
      overflow:hidden; font:14px system-ui, sans-serif; }
    .iv-panel-close { position:absolute; top:7px; right:12px; z-index:1; border:0; background:transparent;
      font-size:20px; line-height:1; cursor:pointer; color:var(--iv-muted, #667); }
    .iv-panel-row { display:flex; align-items:center; gap:8px; margin:0 0 8px; flex-wrap:wrap; }
    .iv-panel-row select { font:inherit; padding:3px 6px; border-radius:6px; border:1px solid var(--iv-border, #d5d8dc); }
    .iv-row-label { color:var(--iv-muted, #667); font-size:13px; }
    .iv-panel-prog { color:var(--iv-muted, #667); font-size:13px; min-height:16px; margin-bottom:6px; }
    .iv-panel textarea { flex:1 1 auto; min-height:52px; box-sizing:border-box; width:100%; resize:none;
      font:13px/1.4 ui-monospace, monospace; border:1px solid var(--iv-border, #d5d8dc); border-radius:7px; padding:8px; }
    .iv-panel-actions { flex:0 0 auto; display:flex; gap:8px; margin-top:8px; }
    /* Accordion */
    .iv-acc { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; }
    .iv-acc-sec { flex:0 0 auto; min-height:0; display:flex; flex-direction:column; }
    .iv-acc-sec.open { flex:1 1 auto; }
    .iv-acc-head { flex:0 0 auto; display:flex; align-items:center; width:100%; text-align:left;
      background:transparent; border:0; border-top:1px solid var(--iv-border, #d5d8dc); color:inherit;
      padding:10px 34px 10px 14px; font:600 14px system-ui, sans-serif; cursor:pointer; }
    .iv-acc-sec:first-child .iv-acc-head { border-top:0; }
    .iv-acc-head:disabled { color:var(--iv-muted, #9aa0a6); cursor:not-allowed; }
    .iv-acc-chev { margin-left:auto; transition:transform 0.15s; }
    .iv-acc-sec.open .iv-acc-chev { transform:rotate(180deg); }
    .iv-acc-body { display:none; min-height:0; overflow:auto; padding:2px 14px 12px; }
    .iv-acc-sec.open > .iv-acc-body { display:flex; flex:1 1 auto; flex-direction:column; }
  `;
  document.head.appendChild(s);
}
