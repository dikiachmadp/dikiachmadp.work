"use client";

import ErrorContent from "@/components/sections/ErrorContent";

/**
 * The dashboard reads and writes the same database as the public pages, so it
 * fails the same way. Kept separate from the public boundary so an error in
 * the admin area does not tear down the whole locale subtree.
 */
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorContent error={error} retry={retry} />;
}
