// Minimal vCard (2.1/3.0/4.0) parser, enough to turn a scanned contact QR into a structured
// card: name, org, title, and labelled emails / phones / URLs. Apple-style grouped properties
// (item1.URL + item1.X-ABLabel) are resolved to their label. Not a full RFC 6350 implementation.

export interface VCardField {
  value: string;
  label?: string; // from X-ABLabel, or a TYPE param (Work/Home/Mobile)
}

export interface VCard {
  fn?: string; // formatted name
  org?: string;
  title?: string;
  emails: VCardField[];
  phones: VCardField[];
  urls: VCardField[];
  note?: string;
  raw: string; // original text, for the .vcf download
}

export function isVCard(text: string): boolean {
  return /^\s*BEGIN:VCARD/i.test(text);
}

function unescape(v: string): string {
  return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

// Nicely label a property from its TYPE params when no X-ABLabel is present.
function typeLabel(params: string[]): string | undefined {
  const types = params
    .map((p) => p.replace(/^type=/i, "").toUpperCase())
    .filter((p) => /^(WORK|HOME|CELL|MOBILE|FAX|MAIN|OTHER)$/.test(p));
  const map: Record<string, string> = { WORK: "Work", HOME: "Home", CELL: "Mobile", MOBILE: "Mobile", FAX: "Fax", MAIN: "Main", OTHER: "Other" };
  return types.length ? map[types[0]] : undefined;
}

interface Line {
  group?: string;
  name: string;
  params: string[];
  value: string;
}

function parseLines(text: string): Line[] {
  // Unfold: a line starting with space/tab continues the previous one (RFC line folding).
  const rawLines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const unfolded: string[] = [];
  for (const l of rawLines) {
    if (/^[ \t]/.test(l) && unfolded.length) unfolded[unfolded.length - 1] += l.slice(1);
    else unfolded.push(l);
  }
  const out: Line[] = [];
  for (const l of unfolded) {
    const colon = l.indexOf(":");
    if (colon < 0) continue;
    const left = l.slice(0, colon);
    const value = l.slice(colon + 1);
    const parts = left.split(";");
    let name = parts[0];
    let group: string | undefined;
    const dot = name.indexOf(".");
    if (dot >= 0) {
      group = name.slice(0, dot);
      name = name.slice(dot + 1);
    }
    out.push({ group, name: name.toUpperCase(), params: parts.slice(1), value });
  }
  return out;
}

export function parseVCard(text: string): VCard {
  const lines = parseLines(text);
  const card: VCard = { emails: [], phones: [], urls: [], raw: text };

  // Collect group -> X-ABLabel so grouped properties can be labelled.
  const groupLabel: Record<string, string> = {};
  for (const l of lines) {
    if (l.group && l.name === "X-ABLABEL") groupLabel[l.group] = unescape(l.value);
  }
  const labelFor = (l: Line): string | undefined => (l.group && groupLabel[l.group]) || typeLabel(l.params);

  for (const l of lines) {
    const v = unescape(l.value).trim();
    if (!v) continue;
    switch (l.name) {
      case "FN":
        card.fn = v;
        break;
      case "N":
        // "Family;Given;Additional;Prefix;Suffix" -> "Given Family" when FN is absent.
        if (!card.fn) {
          const [family, given] = v.split(";");
          card.fn = [given, family].filter(Boolean).join(" ").trim() || v.replace(/;+/g, " ").trim();
        }
        break;
      case "ORG":
        card.org = v.replace(/;+$/g, "").replace(/;/g, " · ");
        break;
      case "TITLE":
        card.title = v;
        break;
      case "EMAIL":
        card.emails.push({ value: v, label: labelFor(l) });
        break;
      case "TEL":
        card.phones.push({ value: v, label: labelFor(l) });
        break;
      case "URL":
        card.urls.push({ value: v, label: labelFor(l) });
        break;
      case "NOTE":
        card.note = v;
        break;
      default:
        break;
    }
  }
  return card;
}
