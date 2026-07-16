import { describe, it, expect } from "vitest";
import { isVCard, parseVCard } from "./vcard";

const SAMPLE = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "N:Claverie;Nicolas;;;",
  "FN:Nicolas Claverie",
  "ORG:HikaShop",
  "EMAIL;type=INTERNET;type=WORK:contact@hikashop.com",
  "URL;type=WORK:https://www.hikashop.com",
  "item1.URL:https://github.com/hikashop-nicolas",
  "item1.X-ABLabel:GitHub",
  "item2.URL:https://www.linkedin.com/in/nicolas-c-2100862/",
  "item2.X-ABLabel:LinkedIn",
  "END:VCARD",
].join("\n");

describe("vcard", () => {
  it("recognizes a vCard payload", () => {
    expect(isVCard(SAMPLE)).toBe(true);
    expect(isVCard("https://example.com")).toBe(false);
  });

  it("parses name, org, email and labelled urls", () => {
    const c = parseVCard(SAMPLE);
    expect(c.fn).toBe("Nicolas Claverie");
    expect(c.org).toBe("HikaShop");
    expect(c.emails).toEqual([{ value: "contact@hikashop.com", label: "Work" }]);
    expect(c.urls).toContainEqual({ value: "https://github.com/hikashop-nicolas", label: "GitHub" });
    expect(c.urls).toContainEqual({ value: "https://www.linkedin.com/in/nicolas-c-2100862/", label: "LinkedIn" });
    expect(c.urls).toContainEqual({ value: "https://www.hikashop.com", label: "Work" });
    expect(c.raw).toContain("BEGIN:VCARD");
  });

  it("derives a name from N when FN is absent", () => {
    const c = parseVCard("BEGIN:VCARD\nN:Doe;Jane;;;\nEND:VCARD");
    expect(c.fn).toBe("Jane Doe");
  });

  it("unescapes escaped characters", () => {
    const c = parseVCard("BEGIN:VCARD\nFN:A\\, B\nORG:X\\; Y\nEND:VCARD");
    expect(c.fn).toBe("A, B");
  });
});
