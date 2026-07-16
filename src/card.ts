// The info card shown when the user clicks a detected code. A vCard payload becomes a rich
// contact card (name, org, clickable email / phone / links, "add to contacts"); anything else
// shows its value (linkified when it is a URL/mailto/tel) with copy / new-document actions.

import type { DetectedCode } from "./detect.js";
import { isVCard, parseVCard, type VCard, type VCardField } from "./vcard.js";

export interface CardHandlers {
  onNewDoc?: (value: string) => void; // present only when the host wants a "new document" action
  onClose: () => void;
}

const URL_RE = /^(https?:\/\/|mailto:|tel:|www\.)/i;

function formatLabel(format: string, tr: (k: string) => string): string {
  if (format === "qr_code") return tr("qrCode");
  return format.replace(/_/g, " ");
}

function headRow(tagText: string, tr: (k: string) => string, onClose: () => void): HTMLElement {
  const head = document.createElement("div");
  head.className = "iv-card-head";
  const tag = document.createElement("span");
  tag.className = "iv-card-tag";
  tag.textContent = tagText;
  const close = document.createElement("button");
  close.className = "iv-card-x";
  close.type = "button";
  close.setAttribute("aria-label", tr("close"));
  close.textContent = "×";
  close.addEventListener("click", onClose);
  head.append(tag, close);
  return head;
}

function actionBtn(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = "iv-card-btn";
  b.type = "button";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

function copyBtn(value: string, tr: (k: string) => string): HTMLButtonElement {
  const copy = actionBtn(tr("copy"), () => {
    void navigator.clipboard?.writeText(value).then(() => {
      copy.textContent = tr("copied");
      window.setTimeout(() => (copy.textContent = tr("copy")), 1200);
    });
  });
  return copy;
}

// A labelled clickable row (email / phone / website) inside the contact card.
function linkRow(field: VCardField, href: string, fallbackLabel: string): HTMLElement {
  const row = document.createElement("div");
  row.className = "iv-card-row";
  const label = document.createElement("span");
  label.className = "iv-card-rowlabel";
  label.textContent = field.label || fallbackLabel;
  const a = document.createElement("a");
  a.href = href;
  if (/^https?:/i.test(href)) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  a.textContent = field.value;
  row.append(label, a);
  return row;
}

function downloadVcf(vcard: VCard): void {
  const blob = new Blob([vcard.raw], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(vcard.fn || "contact").replace(/[^\w.-]+/g, "_")}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildVCardCard(code: DetectedCode, vcard: VCard, tr: (k: string) => string, handlers: CardHandlers): HTMLElement {
  const card = document.createElement("div");
  card.className = "iv-card iv-card-contact";
  card.append(headRow(tr("contact"), tr, handlers.onClose));

  if (vcard.fn) {
    const name = document.createElement("div");
    name.className = "iv-card-name";
    name.textContent = vcard.fn;
    card.appendChild(name);
  }
  const sub = [vcard.title, vcard.org].filter(Boolean).join(" · ");
  if (sub) {
    const org = document.createElement("div");
    org.className = "iv-card-org";
    org.textContent = sub;
    card.appendChild(org);
  }

  const rows = document.createElement("div");
  rows.className = "iv-card-rows";
  for (const e of vcard.emails) rows.appendChild(linkRow(e, `mailto:${e.value}`, tr("email")));
  for (const p of vcard.phones) rows.appendChild(linkRow(p, `tel:${p.value.replace(/[^\d+]/g, "")}`, tr("phone")));
  for (const u of vcard.urls) {
    const href = /^www\./i.test(u.value) ? `https://${u.value}` : u.value;
    rows.appendChild(linkRow(u, href, tr("website")));
  }
  card.appendChild(rows);

  const actions = document.createElement("div");
  actions.className = "iv-card-actions";
  actions.appendChild(actionBtn(tr("addToContacts"), () => downloadVcf(vcard)));
  actions.appendChild(copyBtn(code.value, tr));
  if (handlers.onNewDoc) actions.appendChild(actionBtn(tr("newDocument"), () => handlers.onNewDoc!(code.value)));
  card.appendChild(actions);
  return card;
}

function buildGenericCard(code: DetectedCode, tr: (k: string) => string, handlers: CardHandlers): HTMLElement {
  const card = document.createElement("div");
  card.className = "iv-card";
  card.append(headRow(formatLabel(code.format, tr), tr, handlers.onClose));

  const valWrap = document.createElement("div");
  valWrap.className = "iv-card-val";
  if (URL_RE.test(code.value)) {
    const a = document.createElement("a");
    a.href = /^www\./i.test(code.value) ? `https://${code.value}` : code.value;
    if (/^(https?:|www\.)/i.test(code.value)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    a.textContent = code.value;
    valWrap.appendChild(a);
  } else {
    valWrap.textContent = code.value;
  }

  const actions = document.createElement("div");
  actions.className = "iv-card-actions";
  actions.appendChild(copyBtn(code.value, tr));
  if (handlers.onNewDoc) actions.appendChild(actionBtn(tr("newDocument"), () => handlers.onNewDoc!(code.value)));
  card.append(valWrap, actions);
  return card;
}

export function buildCodeCard(code: DetectedCode, tr: (k: string) => string, handlers: CardHandlers): HTMLElement {
  if (isVCard(code.value)) return buildVCardCard(code, parseVCard(code.value), tr, handlers);
  return buildGenericCard(code, tr, handlers);
}
