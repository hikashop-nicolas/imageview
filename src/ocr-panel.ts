// The OCR panel: a bottom sheet that recognizes the image's text via localml/ocr
// (Tesseract.js, loaded on demand), with a language picker, a live progress line, the
// recognized text in an editable box, and copy / new-document actions.

import type { OcrRun } from "localml/ocr";

export interface OcrPanelHandlers {
  onExtractText?: (text: string) => void; // adds a "new document" action
  onClose: () => void;
}

export interface OcrPanel {
  el: HTMLElement;
  destroy(): void;
}

// Tesseract language codes offered in the picker.
const OCR_LANGS: { code: string; label: string }[] = [
  { code: "eng", label: "English" },
  { code: "fra", label: "Français" },
  { code: "deu", label: "Deutsch" },
  { code: "spa", label: "Español" },
  { code: "ita", label: "Italiano" },
  { code: "por", label: "Português" },
  { code: "nld", label: "Nederlands" },
  { code: "rus", label: "Русский" },
  { code: "jpn", label: "日本語" },
  { code: "chi_sim", label: "中文" },
  { code: "kor", label: "한국어" },
  { code: "ara", label: "العربية" },
];

const BASE_TO_TESS: Record<string, string> = {
  en: "eng", fr: "fra", de: "deu", es: "spa", it: "ita", pt: "por",
  nl: "nld", ru: "rus", ja: "jpn", zh: "chi_sim", ko: "kor", ar: "ara",
};

// Rasterize the image to a canvas before OCR. Tesseract can read a raster <img> directly
// but throws on an SVG <img>; drawing it to a canvas first makes every format the browser
// can render (SVG included) OCR-able.
function toCanvas(img: HTMLImageElement): HTMLCanvasElement | HTMLImageElement {
  const w = img.naturalWidth || img.clientWidth;
  const h = img.naturalHeight || img.clientHeight;
  if (!w || !h) return img;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return img;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function defaultLang(): string {
  const langs = typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : [];
  for (const l of langs) {
    const t = BASE_TO_TESS[(l || "").toLowerCase().split("-")[0]];
    if (t) return t;
  }
  return "eng";
}

export function buildOcrPanel(
  img: HTMLImageElement,
  tr: (key: string) => string,
  handlers: OcrPanelHandlers,
): OcrPanel {
  const el = document.createElement("div");
  el.className = "iv-panel";

  const head = document.createElement("div");
  head.className = "iv-panel-head";
  const title = document.createElement("span");
  title.className = "iv-panel-title";
  title.textContent = tr("extractText");
  const langSel = document.createElement("select");
  langSel.setAttribute("aria-label", tr("ocrLanguage"));
  for (const l of OCR_LANGS) langSel.add(new Option(l.label, l.code));
  langSel.value = defaultLang();
  const close = document.createElement("button");
  close.className = "iv-panel-x";
  close.type = "button";
  close.setAttribute("aria-label", tr("close"));
  close.textContent = "×";
  close.addEventListener("click", handlers.onClose);
  head.append(title, langSel, close);

  const prog = document.createElement("div");
  prog.className = "iv-panel-prog";

  const text = document.createElement("textarea");
  text.spellcheck = false;

  const actions = document.createElement("div");
  actions.className = "iv-panel-actions";
  const copy = document.createElement("button");
  copy.className = "iv-card-btn";
  copy.type = "button";
  copy.textContent = tr("copy");
  copy.addEventListener("click", () => {
    void navigator.clipboard?.writeText(text.value).then(() => {
      copy.textContent = tr("copied");
      window.setTimeout(() => (copy.textContent = tr("copy")), 1200);
    });
  });
  actions.appendChild(copy);
  if (handlers.onExtractText) {
    const nd = document.createElement("button");
    nd.className = "iv-card-btn";
    nd.type = "button";
    nd.textContent = tr("newDocument");
    nd.addEventListener("click", () => handlers.onExtractText!(text.value));
    actions.appendChild(nd);
  }

  el.append(head, prog, text, actions);

  let run: OcrRun | null = null;
  let disposed = false;

  async function recognize(): Promise<void> {
    run?.cancel();
    text.value = "";
    prog.textContent = tr("ocrLoading");
    const { runOcr } = await import("localml/ocr");
    if (disposed) return;
    run = runOcr(toCanvas(img), {
      lang: langSel.value,
      onProgress: (p) => {
        prog.textContent = p.stage === "recognize"
          ? `${tr("ocrRecognizing")} ${Math.round(p.ratio * 100)}%`
          : tr("ocrLoading");
      },
    });
    try {
      const { text: recognized } = await run.done;
      if (disposed) return;
      const trimmed = recognized.trim();
      text.value = trimmed;
      prog.textContent = trimmed ? "" : tr("ocrNoText");
    } catch {
      if (!disposed) prog.textContent = tr("ocrNoText");
    }
  }

  langSel.addEventListener("change", () => void recognize());
  void recognize();

  return {
    el,
    destroy: () => {
      disposed = true;
      run?.cancel();
      el.remove();
    },
  };
}
