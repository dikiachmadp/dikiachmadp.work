"use client";

import ErrorContent from "@/components/sections/ErrorContent";

/**
 * Catches failures anywhere under /[locale]. The public pages read from the
 * database, and Supabase's free tier pauses after ~7 days idle (see
 * docs/operations.md) — without this boundary that pause hands every visitor
 * Next's bare error screen: no navigation, no branding, no way back.
 */
export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorContent error={error} retry={retry} />;
}
