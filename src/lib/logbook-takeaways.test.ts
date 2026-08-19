import { describe, expect, it } from "vitest";
import { extractTakeaways } from "./logbook-takeaways";

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
});
