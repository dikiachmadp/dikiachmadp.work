import { describe, it, expect } from "vitest";
import { estimateReadingMinutes, fill, formatPrice } from "./utils";
import enUi from "@/content/en/ui.json";
import idUi from "@/content/id/ui.json";

describe("fill", () => {
  it("substitutes a placeholder", () => {
    expect(fill("{category} cover", { category: "branding" })).toBe(
      "branding cover",
    );
  });

  it("accepts numbers", () => {
    expect(fill("detail shot {n}", { n: 2 })).toBe("detail shot 2");
  });

  it("substitutes every occurrence", () => {
    expect(fill("{a} and {a} and {b}", { a: "x", b: "y" })).toBe(
      "x and x and y",
    );
  });

  it("leaves an unknown placeholder visible rather than blanking it", () => {
    // An empty string in an alt attribute is a silent bug; "{oops}" is one you
    // notice the first time you look at the page.
    expect(fill("a {oops} b", { other: "x" })).toBe("a {oops} b");
  });

  it("leaves a string with no placeholders untouched", () => {
    expect(fill("Toggle menu", { category: "x" })).toBe("Toggle menu");
  });

  it("does not treat the substituted value as a template", () => {
    // Category names come from the database, so a value that happens to look
    // like a placeholder must not trigger another round of substitution.
    expect(fill("{category} cover", { category: "{n}" })).toBe("{n} cover");
  });
});

describe("the placeholders each locale actually uses", () => {
  // Word order differs between the two languages ("{category} cover" vs
  // "Sampul {category}"), so the strings are not interchangeable — but they
  // must ask for the same values, or one locale renders a literal "{category}".
  const placeholders = (s: string) =>
    [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  const keys = [
    "switchToLanguage",
    "projectCover",
    "projectShot",
    "galleryPlaceholder",
  ] as const;

  it.each(keys)("%s asks for the same values in en and id", (key) => {
    expect(placeholders(idUi.a11y[key])).toEqual(placeholders(enUi.a11y[key]));
  });

  it("logbook.readTime asks for the same values in en and id", () => {
    expect(placeholders(idUi.logbook.readTime)).toEqual(
      placeholders(enUi.logbook.readTime),
    );
  });
});

describe("estimateReadingMinutes", () => {
  it("floors at 1 minute for very short text", () => {
    expect(estimateReadingMinutes("just a few words here")).toBe(1);
  });

  it("floors at 1 minute for empty text", () => {
    expect(estimateReadingMinutes("")).toBe(1);
  });

  it("rounds to the nearest minute at 200 words per minute", () => {
    const words = Array.from({ length: 450 }, () => "word").join(" ");
    // 450 / 200 = 2.25 -> rounds to 2
    expect(estimateReadingMinutes(words)).toBe(2);
  });

  it("respects a custom words-per-minute rate", () => {
    const words = Array.from({ length: 300 }, () => "word").join(" ");
    expect(estimateReadingMinutes(words, 100)).toBe(3);
  });
});

describe("formatPrice", () => {
  it("returns null when the price is null", () => {
    expect(formatPrice(null, "USD", "en")).toBeNull();
  });

  it("returns null for a malformed price string", () => {
    expect(formatPrice("not-a-number", "USD", "en")).toBeNull();
  });

  it("formats a whole number without decimals", () => {
    expect(formatPrice("20", "USD", "en")).toBe("$20");
  });

  it("formats a fractional price with two decimals", () => {
    expect(formatPrice("19.99", "USD", "en")).toBe("$19.99");
  });

  it("uses the id-ID locale format for the id locale", () => {
    const result = formatPrice("150000", "IDR", "id");
    // Indonesian formatting groups with dots — just assert it's not the
    // English format rather than pin the exact separator characters.
    expect(result).not.toBe(formatPrice("150000", "IDR", "en"));
  });
});
