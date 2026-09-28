"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  AdminCheckbox,
  AdminField,
  AdminFieldset,
  AdminFile,
  AdminSelect,
  AdminTextarea,
} from "./AdminField";
import BlockEditor, {
  blockStatesFromValue,
  copyBlockLanguage,
  type BlockState,
  type Lang,
} from "./BlockEditor";
import MarkdownEditor from "./MarkdownEditor";
import SubmitButton from "./SubmitButton";
import { uploadRejectionReason } from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
import { initialFormState, type FormState } from "@/schemas/admin";
import type { ProductBlocks } from "@/schemas/product-blocks";

const LANGS: { code: Lang; label: string; legend: string }[] = [
  { code: "en", label: "EN", legend: "English" },
  { code: "id", label: "ID", legend: "Bahasa Indonesia" },
];

const TABS = [
  { id: "product", label: "Product" },
  { id: "sales", label: "Sales page" },
] as const;

type Tab = (typeof TABS)[number]["id"];

/** Field per bahasa yang ikut tersalin oleh tombol "copy to". */
const COPYABLE_TRANSLATION_FIELDS = [
  "slug",
  "title",
  "summary",
  "deliverables",
] as const;

/** Isi grup `<details>` yang terlipat; dipakai untuk membukanya saat bergalat. */
const ADVANCED_FIELDS = ["publishedAt", "order", "currency", "buyUrl"];

export interface ProductTranslationValues {
  slug: string;
  title: string;
  summary: string;
  body: string;
  /** Satu butir per baris; server memecahnya lagi dengan `splitLines()`. */
  deliverables: string;
}

export interface ProductFormValues {
  status: "DRAFT" | "PUBLISHED";
  /** Format `datetime-local`: "2026-08-15T09:30", atau kosong. */
  publishedAt: string;
  featured: boolean;
  order: string;
  price: string;
  currency: string;
  buyUrl: string;
  polarProductId: string;
  pwywEnabled: boolean;
  /** Sen, sebagai string karena berasal dari input form. */
  pwywMinAmount: string;
  coverImage: string;
  gallery: string;
  tags: string;
  demoUrl: string;
  /** Blok halaman jualan apa adanya dari database. */
  blocks: ProductBlocks;
  translations: Record<Lang, ProductTranslationValues>;
}

const emptyTranslation: ProductTranslationValues = {
  slug: "",
  title: "",
  summary: "",
  body: "",
  deliverables: "",
};

export const emptyProductForm: ProductFormValues = {
  status: "DRAFT",
  publishedAt: "",
  featured: false,
  order: "0",
  price: "",
  currency: "USD",
  buyUrl: "",
  polarProductId: "",
  pwywEnabled: false,
  pwywMinAmount: "0",
  coverImage: "",
  gallery: "",
  tags: "",
  demoUrl: "",
  blocks: [],
  translations: { en: { ...emptyTranslation }, id: { ...emptyTranslation } },
};

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED"];

const isFilled = (translation: ProductTranslationValues) =>
  Boolean(
    translation.slug ||
    translation.title ||
    translation.summary ||
    translation.body ||
    translation.deliverables,
  );

/**
 * Bahasa mana yang terbuka lebih dulu. Produk baru selalu `en`; produk yang
 * disunting membuka bahasa pertama yang benar-benar terisi, supaya produk yang
 * hanya berbahasa Indonesia tidak menyambut pemiliknya dengan lima field
 * kosong.
 */
function initialLang(values: ProductFormValues): Lang {
  if (isFilled(values.translations.en)) return "en";
  if (isFilled(values.translations.id)) return "id";
  return "en";
}

/**
 * Form produk: dua tab, satu `<form>`, satu server action.
 *
 * **Tab dan bahasa hanya menyembunyikan, tidak pernah melepas.** Field tingkat
 * atas adalah input DOM tak terkendali — begitulah `FormState` memulihkan isian
 * setelah validasi gagal. Input yang dilepas dari DOM juga hilang dari
 * `FormData`, jadi melepas tab atau bahasa yang tidak aktif berarti tiap simpan
 * diam-diam mengosongkan separuh produk. Karena itu semua penyembunyian di sini
 * memakai atribut `hidden`, dan kelas tata letak tidak pernah duduk di elemen
 * yang sama (`display:flex` mengalahkan `[hidden]{display:none}`).
 *
 * Blok adalah kekecualian yang memang harus beda: berkas gambar yang dipilih
 * tapi belum diunggah tidak bisa hidup di DOM, jadi blok tinggal di state React
 * — yang kebetulan juga membuatnya selamat dari reset form setelah action.
 */
export default function ProductForm({
  action,
  locale,
  values,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  locale: string;
  values: ProductFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("product");
  const [lang, setLang] = useState<Lang>(() => initialLang(values));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [blocks, setBlocks] = useState<BlockState[]>(() =>
    blockStatesFromValue(values.blocks ?? []),
  );
  // Body dikendalikan dari sini, bukan dari dalam MarkdownEditor: tombol
  // "copy to" harus bisa menulisinya, dan menulis lewat DOM akan ditimpa React
  // pada render berikutnya.
  const [bodies, setBodies] = useState<Record<Lang, string>>({
    en: values.translations.en.body,
    id: values.translations.id.body,
  });

  /**
   * React me-reset form setelah tiap server action. Input teks dan textarea
   * pulih sendiri dari `defaultValue`-nya; `<select>` tidak. Yang tak
   * terkendali balik ke opsi pertama — produk PUBLISHED diam-diam turun jadi
   * DRAFT begitu ada satu galat validasi, lalu tersimpan sebagai draf dan
   * hilang dari situs. Yang terkendali lebih licik lagi: state React-nya tetap
   * benar sementara DOM-nya balik ke opsi pertama, jadi tata letak blok yang
   * terbaca di layar bukan yang akan terkirim, sampai ada render lain yang
   * kebetulan memperbaikinya.
   *
   * Kunci yang berganti tiap kali action menjawab memaksa setiap `<select>`
   * dipasang ulang dengan nilai yang benar. Hanya select yang butuh ini.
   */
  const [seenState, setSeenState] = useState(state);
  const [selectEpoch, setSelectEpoch] = useState(0);
  if (seenState !== state) {
    // Menyesuaikan state saat render, pola yang memang dianjurkan React untuk
    // "nilai turunan yang berubah saat masukan berubah". Bukan di dalam
    // useEffect: itu akan merender dua kali dan sempat memperlihatkan pilihan
    // yang salah.
    setSeenState(state);
    setSelectEpoch(selectEpoch + 1);
  }

  const formRef = useRef<HTMLFormElement>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    product: null,
    sales: null,
  });

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

  /**
   * Galat tidak boleh tersembunyi di balik kontrol yang menyembunyikannya.
   * Tiga penanda menutup ketiga cara isian bisa hilang dari pandangan: tab
   * yang tidak aktif, bahasa yang tidak aktif, dan grup yang terlipat.
   */
  const errorKeys = Object.keys(state.fieldErrors ?? {});
  const tabHasError = (id: Tab) =>
    id === "sales"
      ? errorKeys.some((key) => key.startsWith("blocks."))
      : errorKeys.some((key) => !key.startsWith("blocks."));
  const langHasError = (code: Lang) =>
    errorKeys.some(
      (key) =>
        key.startsWith(`translations.${code}.`) || key.endsWith(`.${code}`),
    );
  const advancedHasError = ADVANCED_FIELDS.some((field) =>
    errorKeys.includes(field),
  );

  const other: Lang = lang === "en" ? "id" : "en";
  const otherLegend = LANGS.find((entry) => entry.code === other)!.legend;

  /**
   * Mengisi bahasa yang satunya dari bahasa yang sedang aktif — untuk kedua tab
   * sekaligus. Field tingkat atas disalin lewat DOM karena memang tak
   * terkendali; body dan blok lewat state, karena keduanya dikendalikan React.
   */
  const copyToOtherLanguage = () => {
    const form = formRef.current;
    if (form) {
      for (const field of COPYABLE_TRANSLATION_FIELDS) {
        const from = form.elements.namedItem(`translations.${lang}.${field}`);
        const to = form.elements.namedItem(`translations.${other}.${field}`);
        const readable =
          from instanceof HTMLInputElement ||
          from instanceof HTMLTextAreaElement;
        const writable =
          to instanceof HTMLInputElement || to instanceof HTMLTextAreaElement;
        if (readable && writable) to.value = from.value;
      }
    }
    setBodies((current) => ({ ...current, [other]: current[lang] }));
    setBlocks((current) => copyBlockLanguage(current, lang, other));
  };

  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(index + delta + TABS.length) % TABS.length].id;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const switchClass = (active: boolean, marked: boolean) =>
    cn(
      "r-tag ink-border lift-chip cursor-pointer px-4 py-2 text-[11px] font-bold tracking-[0.1em] uppercase",
      active ? "flat-3 bg-(--wash)" : "bg-(--paper) text-(--soft)",
      marked && "border-(--accent-ink) text-(--accent-ink)",
    );

  return (
    <form
      ref={formRef}
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

      {/* Pengalih bahasa duduk di atas tab, bukan di dalamnya: pemilik memilih
          bahasa sekali lalu mengisi seluruh produk dalam bahasa itu. */}
      <div className="ink-border r-card flex flex-wrap items-center justify-between gap-3 bg-(--paper) px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="micro text-(--soft)">Language</span>
          {LANGS.map((entry) => (
            <button
              key={entry.code}
              type="button"
              onClick={() => setLang(entry.code)}
              aria-pressed={lang === entry.code}
              aria-label={`Edit in ${entry.legend}${
                langHasError(entry.code) ? " — has an error" : ""
              }`}
              className={switchClass(
                lang === entry.code,
                langHasError(entry.code),
              )}
            >
              {entry.label}
              {langHasError(entry.code) && " !"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={copyToOtherLanguage}
          className="r-tag ink-border lift-chip cursor-pointer bg-(--wash) px-4 py-2 text-[11px] font-bold tracking-[0.1em] uppercase"
        >
          Copy to {otherLegend}
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Product form sections"
        className="flex gap-2"
      >
        {TABS.map((entry, index) => (
          <button
            key={entry.id}
            ref={(node) => {
              tabRefs.current[entry.id] = node;
            }}
            type="button"
            role="tab"
            id={`product-tab-${entry.id}`}
            aria-selected={tab === entry.id}
            aria-controls={`product-panel-${entry.id}`}
            // Roving tabindex: hanya tab terpilih yang ikut urutan Tab; panah
            // kiri/kanan yang berpindah, sesuai pola tab yang lazim.
            tabIndex={tab === entry.id ? 0 : -1}
            onClick={() => setTab(entry.id)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            className={switchClass(tab === entry.id, tabHasError(entry.id))}
          >
            {entry.label}
            {tabHasError(entry.id) && " !"}
          </button>
        ))}
      </div>

      {/* --- Tab 1: Product --- */}
      <div
        id="product-panel-product"
        role="tabpanel"
        aria-labelledby="product-tab-product"
        hidden={tab !== "product"}
      >
        <div className="flex flex-col gap-5">
          <AdminFieldset legend="Status & price">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <AdminSelect
                key={`status-${selectEpoch}`}
                name="status"
                label="Status"
                required
                options={STATUS_OPTIONS}
                defaultValue={v("status", values.status)}
                error={err("status")}
              />
              <AdminField
                name="price"
                label="Price"
                hint='Empty means "not set" — 0 means genuinely free.'
                placeholder="19.99"
                defaultValue={v("price", values.price)}
                error={err("price")}
              />
              <AdminField
                name="tags"
                label="Tags"
                hint="Comma separated."
                placeholder="OJS, Template"
                defaultValue={v("tags", values.tags)}
                error={err("tags")}
              />
            </div>
            <AdminCheckbox
              name="featured"
              label="Featured"
              // Checkbox yang tidak dicentang tidak ada di FormData, jadi
              // keadaan pulihnya datang dari `state.values`, bukan dari record.
              defaultChecked={
                state.values ? state.values.featured === "on" : values.featured
              }
            />
            {err("translations") && (
              <p
                role="alert"
                className="m-0 text-[12px] font-bold text-(--accent-ink)"
              >
                {err("translations")}
              </p>
            )}
          </AdminFieldset>

          <AdminFieldset legend="Checkout">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <AdminField
                name="polarProductId"
                label="Polar product ID"
                hint="Fill this in and the buy button opens checkout on the page itself."
                defaultValue={v("polarProductId", values.polarProductId)}
                error={err("polarProductId")}
              />
              <AdminField
                name="pwywMinAmount"
                label="Minimum amount (cents)"
                type="number"
                hint="0 lets people take it for free. Polar still has the final say."
                defaultValue={v("pwywMinAmount", values.pwywMinAmount)}
                error={err("pwywMinAmount")}
              />
            </div>
            <AdminCheckbox
              name="pwywEnabled"
              label="Pay what you want"
              defaultChecked={
                state.values
                  ? state.values.pwywEnabled === "on"
                  : values.pwywEnabled
              }
            />
          </AdminFieldset>

          <AdminFieldset legend="Images">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <AdminField
                name="coverImage"
                label="Cover image URL"
                required
                hint="Leave empty and upload below. Uploads and site paths only."
                defaultValue={v("coverImage", values.coverImage)}
                error={err("coverImage")}
              />
              <AdminFile name="coverImageFile" label="Upload cover" />
            </div>
            <AdminTextarea
              name="gallery"
              label="Gallery URLs"
              rows={3}
              hint="One URL per line. Uploads below are appended."
              defaultValue={v("gallery", values.gallery)}
              error={err("gallery")}
            />
            <AdminFile
              name="galleryFiles"
              label="Upload gallery images"
              multiple
            />
          </AdminFieldset>

          <AdminFieldset legend="Links">
            <AdminField
              name="demoUrl"
              label="Demo URL"
              hint="Empty renders no demo button at all, rather than a dead link."
              placeholder="https://…"
              defaultValue={v("demoUrl", values.demoUrl)}
              error={err("demoUrl")}
            />
          </AdminFieldset>

          {LANGS.map(({ code, legend }) => (
            <div key={code} hidden={code !== lang}>
              <AdminFieldset legend={legend}>
                <p className="m-0 text-[11px] text-(--soft)">
                  Leave every field here empty to skip this language — the
                  product then does not exist on the {legend} side of the site.
                </p>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <AdminField
                    name={`translations.${code}.slug`}
                    label="Slug"
                    hint="Lowercase, digits and hyphens. Slugs are per language."
                    placeholder="a-product-name"
                    defaultValue={v(
                      `translations.${code}.slug`,
                      values.translations[code].slug,
                    )}
                    error={err(`translations.${code}.slug`)}
                  />
                  <AdminField
                    name={`translations.${code}.title`}
                    label="Title"
                    defaultValue={v(
                      `translations.${code}.title`,
                      values.translations[code].title,
                    )}
                    error={err(`translations.${code}.title`)}
                  />
                </div>

                <AdminField
                  name={`translations.${code}.summary`}
                  label="Summary"
                  hint="Shown on the index cards and used as the meta description."
                  defaultValue={v(
                    `translations.${code}.summary`,
                    values.translations[code].summary,
                  )}
                  error={err(`translations.${code}.summary`)}
                />

                <AdminTextarea
                  name={`translations.${code}.deliverables`}
                  label="What you get"
                  rows={4}
                  hint="One item per line. This is the list on the buy card."
                  defaultValue={v(
                    `translations.${code}.deliverables`,
                    values.translations[code].deliverables,
                  )}
                  error={err(`translations.${code}.deliverables`)}
                />

                <MarkdownEditor
                  name={`translations.${code}.body`}
                  label="Body"
                  context={legend}
                  required={false}
                  value={bodies[code]}
                  onValueChange={(next) =>
                    setBodies((current) => ({ ...current, [code]: next }))
                  }
                  error={err(`translations.${code}.body`)}
                />
              </AdminFieldset>
            </div>
          ))}

          {/* Terlipat, tapi tetap terpasang: penjadwalan, urutan katalog, mata
              uang yang selalu USD, dan URL toko luar warisan. */}
          <details
            open={advancedOpen || advancedHasError}
            onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
            className="ink-border r-card bg-(--paper) px-4 py-3"
          >
            <summary className="micro cursor-pointer">
              Advanced{advancedHasError && " !"}
            </summary>
            <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <AdminField
                name="publishedAt"
                label="Publish date (UTC)"
                type="datetime-local"
                hint="UTC, not local time. Empty publishes now; a future time schedules it."
                defaultValue={v("publishedAt", values.publishedAt)}
                error={err("publishedAt")}
              />
              <AdminField
                name="order"
                label="Order"
                hint="Lower shows first in the catalog."
                defaultValue={v("order", values.order)}
                error={err("order")}
              />
              <AdminField
                name="currency"
                label="Currency"
                required
                placeholder="USD"
                defaultValue={v("currency", values.currency)}
                error={err("currency")}
              />
              <AdminField
                name="buyUrl"
                label="External store URL"
                hint="Only for products sold elsewhere. Leave empty when Polar handles it."
                placeholder="https://gumroad.com/l/…"
                defaultValue={v("buyUrl", values.buyUrl)}
                error={err("buyUrl")}
              />
            </div>
          </details>
        </div>
      </div>

      {/* --- Tab 2: Sales page --- */}
      <div
        id="product-panel-sales"
        role="tabpanel"
        aria-labelledby="product-tab-sales"
        hidden={tab !== "sales"}
      >
        <AdminFieldset legend="Blocks">
          <BlockEditor
            blocks={blocks}
            lang={lang}
            fieldErrors={state.fieldErrors}
            resetKey={selectEpoch}
            onChange={setBlocks}
          />
        </AdminFieldset>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href={`/${locale}/dashboard/products`}
          className="r-tag ink-border lift-chip px-4 py-2.5 text-[12px] font-bold"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
