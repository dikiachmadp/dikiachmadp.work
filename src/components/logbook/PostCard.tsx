import Image from "next/image";
import Link from "next/link";
import type { LogbookPostSummary } from "@/lib/db/logbook";
import type { Locale } from "@/types/content";
import { cn } from "@/lib/utils";

/**
 * Tanggal terbit disimpan sebagai UTC dan diisi admin sebagai UTC, jadi
 * dirender sebagai UTC juga. Tanpa `timeZone` yang tetap, server (Vercel, UTC)
 * dan peramban pembaca bisa menghasilkan tanggal berbeda untuk pos yang terbit
 * mendekati tengah malam — dan itu muncul sebagai galat hidrasi.
 */
const FORMATS: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }),
  id: new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }),
};

export function formatPublishedAt(date: Date | null, locale: Locale): string {
  return date ? FORMATS[locale].format(date) : "";
}

export default function PostCard({
  post,
  locale,
  readLabel,
  index = 0,
}: {
  post: LogbookPostSummary;
  locale: Locale;
  readLabel: string;
  /** Menyelang-nyeling bentuk sudut kartu, sama seperti kartu Studio. */
  index?: number;
}) {
  return (
    <Link
      href={`/${locale}/logbook/${post.slug}`}
      className={cn(
        "ink-border flat-3 lift-card-sm flex flex-col overflow-hidden bg-(--paper)",
        index % 2 === 0 ? "r-card" : "r-card-alt",
      )}
    >
      <span
        className={cn(
          "relative block aspect-[16/9] w-full overflow-hidden border-b-2 border-(--line) bg-(--wash)",
          // Pos tanpa gambar memakai panel crosshatch yang sudah dipakai
          // ProjectCard, bukan bingkai kosong.
          !post.cover && "crosshatch",
        )}
      >
        {post.cover && (
          <Image
            src={post.cover.url}
            alt={post.cover.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
            className="object-cover"
          />
        )}
      </span>

      <span className="flex flex-1 flex-col gap-2 p-5">
        <time
          dateTime={post.publishedAt?.toISOString()}
          className="font-tech text-[11px] tracking-[0.1em] text-(--soft) uppercase"
        >
          {formatPublishedAt(post.publishedAt, locale)}
        </time>
        <span className="font-hand block text-[22px] leading-[1.2]">
          {post.title}
        </span>
        <span className="m-justify block flex-1 text-[13px] leading-[1.6] text-(--soft)">
          {post.excerpt}
        </span>
        <span className="mt-1 block text-[11px] font-bold tracking-[0.1em] uppercase">
          {readLabel} →
        </span>
      </span>
    </Link>
  );
}
