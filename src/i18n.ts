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
  extractText: "Extract text (OCR)",
  ocrLanguage: "Language",
  ocrLoading: "Loading OCR engine…",
  ocrRecognizing: "Recognizing…",
  ocrNoText: "No text found.",
  translate: "Translate",
  translateTo: "Translate to",
  translating: "Translating…",
  translateLoading: "Loading translation model…",
  contact: "Contact",
  addToContacts: "Add to contacts",
  email: "Email",
  phone: "Phone",
  website: "Website",
  extractRegion: "Extract text from a selected area (drag the handles)",
  ocrAuto: "Auto-detect",
};

const fr: Dict = {
  cannotDisplay: "Cette image n'a pas pu être affichée par votre navigateur.",
  nothingToDisplay: "Rien à afficher.",
  qrCode: "QR code",
  copy: "Copier",
  copied: "Copié",
  newDocument: "Nouveau document",
  close: "Fermer",
  extractText: "Extraire le texte (OCR)",
  ocrLanguage: "Langue",
  ocrLoading: "Chargement du moteur OCR…",
  ocrRecognizing: "Reconnaissance…",
  ocrNoText: "Aucun texte détecté.",
  translate: "Traduire",
  translateTo: "Traduire vers",
  translating: "Traduction…",
  translateLoading: "Chargement du modèle de traduction…",
  contact: "Contact",
  addToContacts: "Ajouter aux contacts",
  email: "E-mail",
  phone: "Téléphone",
  website: "Site web",
  extractRegion: "Extraire le texte d'une zone sélectionnée (déplacez les poignées)",
  ocrAuto: "Détection automatique",
};

const ja: Dict = {
  cannotDisplay: "この画像はお使いのブラウザーでは表示できませんでした。",
  nothingToDisplay: "表示するものがありません。",
  qrCode: "QRコード",
  copy: "コピー",
  copied: "コピーしました",
  newDocument: "新規ドキュメント",
  close: "閉じる",
  extractText: "テキスト抽出 (OCR)",
  ocrLanguage: "言語",
  ocrLoading: "OCRエンジンを読み込み中…",
  ocrRecognizing: "認識中…",
  ocrNoText: "テキストが見つかりませんでした。",
  translate: "翻訳",
  translateTo: "翻訳先",
  translating: "翻訳中…",
  translateLoading: "翻訳モデルを読み込み中…",
  contact: "連絡先",
  addToContacts: "連絡先に追加",
  email: "メール",
  phone: "電話",
  website: "ウェブサイト",
  extractRegion: "選択した範囲のテキストを抽出 (ハンドルをドラッグ)",
  ocrAuto: "自動検出",
};

const es: Dict = {
  cannotDisplay: "Su navegador no pudo mostrar esta imagen.",
  nothingToDisplay: "No hay nada que mostrar.",
  qrCode: "Código QR",
  copy: "Copiar",
  copied: "Copiado",
  newDocument: "Nuevo documento",
  close: "Cerrar",
  extractText: "Extraer el texto (OCR)",
  ocrLanguage: "Idioma",
  ocrLoading: "Cargando el motor de OCR…",
  ocrRecognizing: "Reconociendo…",
  ocrNoText: "No se encontró texto.",
  translate: "Traducir",
  translateTo: "Traducir a",
  translating: "Traduciendo…",
  translateLoading: "Cargando el modelo de traducción…",
  contact: "Contacto",
  addToContacts: "Añadir a los contactos",
  email: "Correo electrónico",
  phone: "Teléfono",
  website: "Sitio web",
  extractRegion: "Extraer el texto de un área seleccionada (arrastre los tiradores)",
  ocrAuto: "Detección automática",
};

const de: Dict = {
  cannotDisplay: "Ihr Browser konnte dieses Bild nicht anzeigen.",
  nothingToDisplay: "Nichts anzuzeigen.",
  qrCode: "QR-Code",
  copy: "Kopieren",
  copied: "Kopiert",
  newDocument: "Neues Dokument",
  close: "Schließen",
  extractText: "Text auslesen (OCR)",
  ocrLanguage: "Sprache",
  ocrLoading: "OCR-Engine wird geladen…",
  ocrRecognizing: "Wird erkannt…",
  ocrNoText: "Kein Text gefunden.",
  translate: "Übersetzen",
  translateTo: "Übersetzen nach",
  translating: "Wird übersetzt…",
  translateLoading: "Übersetzungsmodell wird geladen…",
  contact: "Kontakt",
  addToContacts: "Zu den Kontakten hinzufügen",
  email: "E-Mail",
  phone: "Telefon",
  website: "Website",
  extractRegion: "Text aus einem gewählten Bereich auslesen (an den Griffen ziehen)",
  ocrAuto: "Automatisch erkennen",
};

const pt: Dict = {
  cannotDisplay: "O seu navegador não conseguiu mostrar esta imagem.",
  nothingToDisplay: "Não há nada para mostrar.",
  qrCode: "Código QR",
  copy: "Copiar",
  copied: "Copiado",
  newDocument: "Novo documento",
  close: "Fechar",
  extractText: "Extrair o texto (OCR)",
  ocrLanguage: "Idioma",
  ocrLoading: "A carregar o motor de OCR…",
  ocrRecognizing: "A reconhecer…",
  ocrNoText: "Não foi encontrado texto.",
  translate: "Traduzir",
  translateTo: "Traduzir para",
  translating: "A traduzir…",
  translateLoading: "A carregar o modelo de tradução…",
  contact: "Contacto",
  addToContacts: "Adicionar aos contactos",
  email: "E-mail",
  phone: "Telefone",
  website: "Sítio web",
  extractRegion: "Extrair o texto de uma área selecionada (arraste as pegas)",
  ocrAuto: "Detetar automaticamente",
};

const ru: Dict = {
  cannotDisplay: "Ваш браузер не смог показать это изображение.",
  nothingToDisplay: "Показывать нечего.",
  qrCode: "QR-код",
  copy: "Копировать",
  copied: "Скопировано",
  newDocument: "Новый документ",
  close: "Закрыть",
  extractText: "Распознать текст (OCR)",
  ocrLanguage: "Язык",
  ocrLoading: "Загрузка модуля OCR…",
  ocrRecognizing: "Распознавание…",
  ocrNoText: "Текст не найден.",
  translate: "Перевести",
  translateTo: "Перевести на",
  translating: "Перевод…",
  translateLoading: "Загрузка модели перевода…",
  contact: "Контакт",
  addToContacts: "Добавить в контакты",
  email: "Эл. почта",
  phone: "Телефон",
  website: "Сайт",
  extractRegion: "Распознать текст в выбранной области (потяните за маркеры)",
  ocrAuto: "Определить автоматически",
};

const zh: Dict = {
  cannotDisplay: "您的浏览器无法显示此图像。",
  nothingToDisplay: "没有可显示的内容。",
  qrCode: "二维码",
  copy: "复制",
  copied: "已复制",
  newDocument: "新建文档",
  close: "关闭",
  extractText: "提取文字（OCR）",
  ocrLanguage: "语言",
  ocrLoading: "正在加载 OCR 引擎…",
  ocrRecognizing: "正在识别…",
  ocrNoText: "未找到文字。",
  translate: "翻译",
  translateTo: "翻译成",
  translating: "正在翻译…",
  translateLoading: "正在加载翻译模型…",
  contact: "联系人",
  addToContacts: "添加到联系人",
  email: "电子邮件",
  phone: "电话",
  website: "网站",
  extractRegion: "从选定区域提取文字（拖动手柄）",
  ocrAuto: "自动检测",
};

const LOCALES: Record<string, Dict> = { en, fr, ja, es, de, pt, ru, zh };

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
