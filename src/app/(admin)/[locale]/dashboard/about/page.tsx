import Link from "next/link";
import { updateAboutProfileAction } from "./actions";
import AboutForm, { type AboutFormValues } from "@/components/admin/AboutForm";
import { getAboutForEdit } from "@/lib/db/about";
import { skillsToText, cvItemsToText } from "@/schemas/admin";
import { requireUser } from "@/lib/supabase/auth";

const emptyTranslation = {
  biography: "",
  sticker: "",
  experienceTitle: "",
  skillsTitle: "",
  certificationsTitle: "",
  cvNote: "",
  skills: "",
  cvItems: "",
};

export default async function AboutAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireUser(locale);

  const profile = await getAboutForEdit();

  const values: AboutFormValues = {
    portraitUrl: profile?.portraitUrl ?? "",
    translations: {
      en: emptyTranslation,
      id: emptyTranslation,
    },
  };

  for (const tr of profile?.translations ?? []) {
    if (tr.locale !== "en" && tr.locale !== "id") continue;
    values.translations[tr.locale] = {
      // Baris kosong sebagai pemisah paragraf, sama seperti contentBlocks
      // di ProjectForm.
      biography: tr.biography.join("\n\n"),
      sticker: tr.sticker,
      experienceTitle: tr.experienceTitle,
      skillsTitle: tr.skillsTitle,
      certificationsTitle: tr.certificationsTitle,
      cvNote: tr.cvNote,
      skills: skillsToText(
        Array.isArray(tr.skills)
          ? (tr.skills as { category: string; items: string[] }[])
          : [],
      ),
      cvItems: cvItemsToText(
        Array.isArray(tr.cvItems)
          ? (tr.cvItems as { label: string; href: string }[])
          : [],
      ),
    };
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-hand text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
          About page
        </h1>
        <Link
          href={`/${locale}/dashboard/about/entries`}
          className="r-tag ink-border lift-chip px-4 py-2.5 text-[12px] font-bold"
        >
          Manage experience & certifications →
        </Link>
      </div>

      <AboutForm
        action={updateAboutProfileAction}
        locale={locale}
        values={values}
      />
    </>
  );
}
