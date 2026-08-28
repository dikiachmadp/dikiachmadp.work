/**
 * "What I Learned" takeaways come from the post body itself, not a DB
 * field — schema for Logbook posts only has title/excerpt/body/images.
 *
 * The convention: a post opts into the panel by ending its Markdown body with
 * a heading matching one of `headings` (case-insensitive), followed by a
 * bullet list. Everything from that heading onward is pulled out of the
 * rendered body and returned as `items`; posts that don't use the convention
 * are unaffected — `items` is empty and `body` comes back unchanged.
 *
 * More than one heading is accepted because the authoring marker in the DB is
 * `TAKEAWAYS_MARKER` in every language, while each locale also has its own
 * translated heading in `ui.json`. The panel's visible title always comes from
 * the dictionary, so an English marker still renders an Indonesian heading.
 */
export const TAKEAWAYS_MARKER = "What I Learned";

export function extractTakeaways(
  body: string,
  headings: string | string[],
): { body: string; items: string[] } {
  const headingRe = /^ {0,3}#{1,6}[ \t]+(.+?)[ \t]*#*$/gm;
  const targets = new Set(
    (Array.isArray(headings) ? headings : [headings])
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
  if (targets.size === 0) return { body, items: [] };

  // Scan for the *last* heading whose text matches — a post can legitimately
  // use the same words in an earlier section title.
  let match: RegExpExecArray | null;
  let start = -1;
  let sectionStart = -1;
  while ((match = headingRe.exec(body))) {
    if (targets.has(match[1].trim().toLowerCase())) {
      start = match.index;
      sectionStart = match.index + match[0].length;
    }
  }
  if (start === -1) return { body, items: [] };

  // The section runs to the next heading (any level) or the end of body.
  headingRe.lastIndex = sectionStart;
  const next = headingRe.exec(body);
  const sectionEnd = next ? next.index : body.length;
  const section = body.slice(sectionStart, sectionEnd);

  const items = Array.from(section.matchAll(/^ {0,3}[-*+][ \t]+(.+)$/gm), (m) =>
    m[1].trim(),
  ).filter(Boolean);

  // No list under the heading — nothing to pull out, leave body untouched
  // rather than silently dropping a heading with no takeaways.
  if (items.length === 0) return { body, items: [] };

  const remaining = (body.slice(0, start) + body.slice(sectionEnd)).trim();
  return { body: remaining, items };
}
