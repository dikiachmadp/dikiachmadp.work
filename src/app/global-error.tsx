"use client";

import { useEffect, useSyncExternalStore } from "react";
import enUi from "@/content/en/ui.json";
import idUi from "@/content/id/ui.json";

/** The URL never changes under this component, so there is nothing to watch. */
const subscribeToNothing = () => () => {};

const getLocale = (): "en" | "id" =>
  window.location.pathname.split("/")[1] === "id" ? "id" : "en";

/**
 * Last resort: this replaces the root layout when the layout itself fails, so
 * it must render its own <html> and <body>.
 *
 * It does not inherit globals.css or the `data-theme` attribute — Next renders
 * this document standalone. Everything it needs is therefore inline, and the
 * palette follows the OS colour scheme rather than the app's theme toggle.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  // The locale lives in the URL, which is not available while this renders on
  // the server. useSyncExternalStore is the sanctioned way to read a value
  // like that: it hands hydration the server snapshot, then re-renders with
  // the real one. usePathname() is avoided here on purpose — this component
  // stands in for a root layout that has already failed, and leaning on router
  // context would risk the fallback crashing too.
  const locale = useSyncExternalStore(
    subscribeToNothing,
    getLocale,
    () => "en",
  );

  useEffect(() => {
    // In production the message is redacted; `digest` matches the server log.
    console.error("Global error:", error.digest ?? error.message);
  }, [error]);

  const dict = (locale === "id" ? idUi : enUi).errorPage;

  return (
    <html lang={locale}>
      <body>
        <title>{dict.heading}</title>
        <style>{`
          :root { color-scheme: light dark; --paper: #fbfaf6; --ink: #16150f; --accent: #0d7c6f; }
          @media (prefers-color-scheme: dark) {
            :root { --paper: #16150f; --ink: #fbfaf6; }
          }
          body {
            margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: var(--paper); color: var(--ink); padding: 2rem; text-align: center;
            font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.6;
          }
          .g-btn {
            display: inline-block; margin-top: 1.75rem; padding: 0.8rem 1.75rem; cursor: pointer;
            border: 2px solid var(--ink); background: var(--accent); color: #fff;
            font: inherit; font-weight: 700; box-shadow: 3px 3px 0 var(--ink);
          }
          .g-btn:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
        `}</style>
        <main>
          <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)", margin: 0 }}>
            {dict.heading}
          </h1>
          <p style={{ maxWidth: "26rem", margin: "1rem auto 0" }}>
            {dict.description}
          </p>
          <button type="button" className="g-btn" onClick={() => retry()}>
            {dict.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
