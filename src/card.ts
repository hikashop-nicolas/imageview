// The info card shown when the user clicks a detected code: its value (linkified when it
// is a URL), a format tag, and copy / new-document / close actions. Framework-free DOM.

import type { DetectedCode } from "./detect.js";

export interface CardHandlers {
  onNewDoc?: (value: string) => void; // present only when the host wants a "new document" action
  onClose: () => void;
}

const URL_RE = /^(https?:\/\/|mailto:|tel:|www\.)/i;

function formatLabel(format: string, tr: (k: string) => string): string {
  if (format === "qr_code") return tr("qrCode");
  return format.replace(/_/g, " ");
}

export function buildCodeCard(code: DetectedCode, tr: (k: string) => string, handlers: CardHandlers): HTMLElement {
  const card = document.createElement("div");
  card.className = "iv-card";

  const head = document.createElement("div");
  head.className = "iv-card-head";
  const tag = document.createElement("span");
  tag.className = "iv-card-tag";
  tag.textContent = formatLabel(code.format, tr);
  const close = document.createElement("button");
  close.className = "iv-card-x";
  close.type = "button";
  close.setAttribute("aria-label", tr("close"));
  close.textContent = "×";
  close.addEventListener("click", handlers.onClose);
  head.append(tag, close);

  const valWrap = document.createElement("div");
  valWrap.className = "iv-card-val";
  if (URL_RE.test(code.value)) {
    const a = document.createElement("a");
    a.href = /^www\./i.test(code.value) ? `https://${code.value}` : code.value;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = code.value;
    valWrap.appendChild(a);
  } else {
    valWrap.textContent = code.value;
  }

  const actions = document.createElement("div");
  actions.className = "iv-card-actions";

  const copy = document.createElement("button");
  copy.className = "iv-card-btn";
  copy.type = "button";
  copy.textContent = tr("copy");
  copy.addEventListener("click", () => {
    void navigator.clipboard?.writeText(code.value).then(() => {
      copy.textContent = tr("copied");
      window.setTimeout(() => (copy.textContent = tr("copy")), 1200);
    });
  });
  actions.appendChild(copy);

  if (handlers.onNewDoc) {
    const nd = document.createElement("button");
    nd.className = "iv-card-btn";
    nd.type = "button";
    nd.textContent = tr("newDocument");
    nd.addEventListener("click", () => handlers.onNewDoc!(code.value));
    actions.appendChild(nd);
  }

  card.append(head, valWrap, actions);
  return card;
}
