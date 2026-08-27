import { describe, expect, it } from "vitest";
import { extractTakeaways, TAKEAWAYS_MARKER } from "./logbook-takeaways";

describe("extractTakeaways", () => {
  it("returns the body unchanged when the heading is absent", () => {
    const body = "Just a plain post.\n\nNothing to see here.";
    expect(extractTakeaways(body, "What I Learned")).toEqual({
      body,
      items: [],
    });
  });

  it("pulls the bullet list under a matching trailing heading", () => {
    const body = [
      "Intro paragraph.",
      "",
      "## What I Learned",
      "",
      "- First thing",
      "- Second thing",
      "- Third thing",
    ].join("\n");

    const result = extractTakeaways(body, "What I Learned");
    expect(result.items).toEqual([
      "First thing",
      "Second thing",
      "Third thing",
    ]);
    expect(result.body).toBe("Intro paragraph.");
  });

  it("matches heading text case-insensitively", () => {
    const body = "Body.\n\n## what i learned\n\n- One";
    expect(extractTakeaways(body, "What I Learned").items).toEqual(["One"]);
  });

  it("uses the last matching heading when the words appear earlier too", () => {
    const body = [
      "## What I Learned about journals",
      "",
      "Not the real section — no list follows immediately, prose instead.",
      "",
      "## What I Learned",
      "",
      "- Real takeaway",
    ].join("\n");

    const result = extractTakeaways(body, "What I Learned");
    expect(result.items).toEqual(["Real takeaway"]);
    expect(result.body).toContain("Not the real section");
  });

  it("stops the section at the next heading", () => {
    const body = [
      "## What I Learned",
      "",
      "- Takeaway one",
      "",
      "## Unrelated section",
      "",
      "More prose that must survive.",
    ].join("\n");

    const result = extractTakeaways(body, "What I Learned");
    expect(result.items).toEqual(["Takeaway one"]);
    expect(result.body).toBe(
      "## Unrelated section\n\nMore prose that must survive.",
    );
  });

  it("leaves the body untouched when the heading has no list under it", () => {
    const body = "Intro.\n\n## What I Learned\n\nJust prose, no bullets.";
    expect(extractTakeaways(body, "What I Learned")).toEqual({
      body,
      items: [],
    });
  });

  // Badan tulisan Indonesia di database memakai marker Inggris; heading versi
  // locale ada di `ui.json`. Keduanya harus sama-sama diterima.
  describe("with several accepted headings", () => {
    const headings = ["Apa yang Saya Pelajari", TAKEAWAYS_MARKER];

    it("matches the canonical English marker in a translated body", () => {
      const body = [
        "Paragraf pembuka.",
        "",
        "## What I Learned",
        "",
        "- Pelajaran pertama",
        "- Pelajaran kedua",
      ].join("\n");

      const result = extractTakeaways(body, headings);
      expect(result.items).toEqual(["Pelajaran pertama", "Pelajaran kedua"]);
      expect(result.body).toBe("Paragraf pembuka.");
    });

    it("matches the translated heading too", () => {
      const body = "Paragraf.\n\n## Apa yang Saya Pelajari\n\n- Satu";
      expect(extractTakeaways(body, headings).items).toEqual(["Satu"]);
    });

    it("still picks the last match when both forms appear", () => {
      const body = [
        "## Apa yang Saya Pelajari",
        "",
        "- Bagian lama",
        "",
        "## What I Learned",
        "",
        "- Bagian penutup",
      ].join("\n");

      const result = extractTakeaways(body, headings);
      expect(result.items).toEqual(["Bagian penutup"]);
      expect(result.body).toContain("Bagian lama");
    });

    it("returns the body unchanged when no candidate matches", () => {
      const body = "Paragraf.\n\n## Penutup\n\n- Bukan takeaway";
      expect(extractTakeaways(body, headings)).toEqual({ body, items: [] });
    });

    // Pos di database disimpan dengan line ending CRLF.
    it("handles CRLF line endings", () => {
      const body = "Paragraf.\r\n\r\n## What I Learned\r\n\r\n- Satu\r\n- Dua";
      const result = extractTakeaways(body, headings);
      expect(result.items).toEqual(["Satu", "Dua"]);
      expect(result.body).toBe("Paragraf.");
    });
  });
});
