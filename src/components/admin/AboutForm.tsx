"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  AdminField,
  AdminFieldset,
  AdminFile,
  AdminTextarea,
} from "./AdminField";
import SubmitButton from "./SubmitButton";
import { uploadRejectionReason } from "@/lib/upload-limits";
import { initialFormState, type FormState } from "@/schemas/admin";

export interface AboutFormTranslationValues {
  biography: string;
  sticker: string;
  experienceTitle: string;
  skillsTitle: string;
  certificationsTitle: string;
  cvNote: string;
  skills: string;
  cvItems: string;
}

export interface AboutFormValues {
  portraitUrl: string;
  translations: Record<"en" | "id", AboutFormTranslationValues>;
}

export default function AboutForm({
  action,
  locale,
  values,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  locale: string;
  values: AboutFormValues;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sama seperti ProjectForm: Next menolak body yang melebihi
  // `serverActions.bodySizeLimit` sebelum server action sempat jalan, jadi
  // ini satu-satunya tempat admin bisa melihat pesan yang bisa dibaca.
  const guardUploadSize = (event: React.FormEvent<HTMLFormElement>) => {
    const files = Array.from(
      event.currentTarget.querySelectorAll<HTMLInputElement>(
        'input[type="file"]',
      ),
    ).flatMap((input) => Array.from(input.files ?? []));

    const reason = uploadRejectionReason(files);
    setUploadError(reason);
    if (reason) event.preventDefault();
  };

  const v = (name: string, fallback: string) =>
    state.values?.[name] ?? fallback;
  const err = (name: string) => state.fieldErrors?.[name];

  return (
    <form
      action={formAction}
      onSubmit={guardUploadSize}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="formLocale" value={locale} />

      {uploadError && (
        <p
          role="alert"
          className="ink-border-dashed r-chip m-0 bg-(--wash) px-4 py-3 text-[13px] font-semibold text-(--accent-ink)"
        >
          {uploadError}
        </p>
      )}

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="ink-border-dashed r-chip m-0 bg-(--wash) px-4 py-3 text-[13px] font-semibold"
        >
          {state.message}
        </p>
      )}

      <AdminFieldset legend="Portrait">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <AdminField
            name="portraitUrl"
            label="Portrait URL"
            hint="Leave empty and upload below, or keep empty to fall back to /foto.webp."
            defaultValue={v("portraitUrl", values.portraitUrl)}
            error={err("portraitUrl")}
          />
          <AdminFile name="portraitFile" label="Upload portrait" />
        </div>
      </AdminFieldset>

      {(["en", "id"] as const).map((lang) => (
        <AdminFieldset
          key={lang}
          legend={lang === "en" ? "English" : "Bahasa Indonesia"}
        >
          <AdminTextarea
            name={`translations.${lang}.biography`}
            label="Biography"
            required
            rows={4}
            hint="Separate paragraphs with a blank line."
            defaultValue={v(
              `translations.${lang}.biography`,
              values.translations[lang].biography,
            )}
            error={err(`translations.${lang}.biography`)}
          />
          <AdminField
            name={`translations.${lang}.sticker`}
            label="Sticker text"
            required
            hint="Handwritten note overlapping the portrait."
            defaultValue={v(
              `translations.${lang}.sticker`,
              values.translations[lang].sticker,
            )}
            error={err(`translations.${lang}.sticker`)}
          />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <AdminField
              name={`translations.${lang}.experienceTitle`}
              label="Experience title"
              required
              defaultValue={v(
                `translations.${lang}.experienceTitle`,
                values.translations[lang].experienceTitle,
              )}
              error={err(`translations.${lang}.experienceTitle`)}
            />
            <AdminField
              name={`translations.${lang}.skillsTitle`}
              label="Skills title"
              required
              defaultValue={v(
                `translations.${lang}.skillsTitle`,
                values.translations[lang].skillsTitle,
              )}
              error={err(`translations.${lang}.skillsTitle`)}
            />
            <AdminField
              name={`translations.${lang}.certificationsTitle`}
              label="Certifications title"
              required
              defaultValue={v(
                `translations.${lang}.certificationsTitle`,
                values.translations[lang].certificationsTitle,
              )}
              error={err(`translations.${lang}.certificationsTitle`)}
            />
          </div>
          <AdminField
            name={`translations.${lang}.cvNote`}
            label="CV note"
            required
            hint='Small label above the CV buttons, e.g. "grab my CV".'
            defaultValue={v(
              `translations.${lang}.cvNote`,
              values.translations[lang].cvNote,
            )}
            error={err(`translations.${lang}.cvNote`)}
          />
          <AdminTextarea
            name={`translations.${lang}.cvItems`}
            label="CV buttons"
            rows={2}
            hint="One per line: Label | /path/to/file.pdf"
            defaultValue={v(
              `translations.${lang}.cvItems`,
              values.translations[lang].cvItems,
            )}
            error={err(`translations.${lang}.cvItems`)}
          />
          <AdminTextarea
            name={`translations.${lang}.skills`}
            label="Skills"
            rows={3}
            hint="One category per line: Category: item one, item two, item three"
            defaultValue={v(
              `translations.${lang}.skills`,
              values.translations[lang].skills,
            )}
            error={err(`translations.${lang}.skills`)}
          />
        </AdminFieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Save changes</SubmitButton>
        <Link
          href={`/${locale}/dashboard`}
          className="r-tag ink-border lift-chip px-4 py-2.5 text-[12px] font-bold"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
