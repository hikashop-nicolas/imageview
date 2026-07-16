// Self-contained i18n for imageview so the library is a complete multilingual product on
// its own. Detects the locale from the browser preferred-languages list (base language,
// first match), English fallback. Adding a language = add a dict to LOCALES; hosts may
// force one via setLocale() or override individual strings via the viewer options.

export type Dict = Record<string, string>;

const en: Dict = {
  cannotDisplay: "This image could not be displayed by your browser.",
  nothingToDisplay: "Nothing to display.",
  qrCode: "QR code",
  copy: "Copy",
  copied: "Copied",
  newDocument: "New document",
  close: "Close",
};

const fr: Dict = {
  cannotDisplay: "Cette image n'a pas pu être affichée par votre navigateur.",
  nothingToDisplay: "Rien à afficher.",
  qrCode: "QR code",
  copy: "Copier",
  copied: "Copié",
  newDocument: "Nouveau document",
  close: "Fermer",
};

const ja: Dict = {
  cannotDisplay: "この画像はお使いのブラウザーでは表示できませんでした。",
  nothingToDisplay: "表示するものがありません。",
  qrCode: "QRコード",
  copy: "コピー",
  copied: "コピーしました",
  newDocument: "新規ドキュメント",
  close: "閉じる",
};

const LOCALES: Record<string, Dict> = { en, fr, ja };

let active: Dict = en;

function detect(): Dict {
  const langs = typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : [];
  for (const l of langs) {
    const base = (l || "").toLowerCase().split("-")[0];
    if (LOCALES[base]) return LOCALES[base];
  }
  return en;
}

active = detect();

// Force a locale (e.g. "fr"); unknown codes fall back to English.
export function setLocale(code: string): void {
  active = LOCALES[code] ?? en;
}

export function t(key: string): string {
  return active[key] ?? en[key] ?? key;
}

// Build a translator that layers per-instance overrides on top of the active locale.
export function translator(overrides?: Dict): (key: string) => string {
  return (key) => overrides?.[key] ?? t(key);
}
