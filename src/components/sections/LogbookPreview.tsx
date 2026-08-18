import { SectionsData, UiLabels, Locale } from "@/types/content";
import type { LogbookPostSummary } from "@/lib/db/logbook";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import PostCard from "@/components/logbook/PostCard";

interface LogbookPreviewProps {
  posts: LogbookPostSummary[];
  sectionsData: SectionsData;
  uiLabels: UiLabels;
  locale: Locale;
}

/** The three latest posts on the home page — mirrors ProjectsGallery. */
export default function LogbookPreview({
  posts,
  sectionsData,
  uiLabels,
  locale,
}: LogbookPreviewProps) {
  const section = sectionsData.logbook;

  if (posts.length === 0) return null;

  return (
    <>
      <SectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        action={
          section.showButton ? (
            <Button
              href={`/${locale}/logbook`}
              variant="secondary"
              size="sm"
              mirrored
            >
              {uiLabels.logbook.viewAll} →
            </Button>
          ) : null
        }
      />
      <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            locale={locale}
            readLabel={uiLabels.logbook.readPost}
            index={i}
          />
        ))}
      </div>
    </>
  );
}
