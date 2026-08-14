import { describe, it, expect } from "vitest";
import { fill } from "./utils";
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
});
