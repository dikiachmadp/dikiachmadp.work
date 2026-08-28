"use client";

import { useRef, useState } from "react";
import PendingFileInput from "./PendingFileInput";
import { cn } from "@/lib/utils";
import {
  LANDING_SLOTS,
  type LandingFieldSpec,
  type LandingSlot,
  type LandingSlotSpec,
  type ProductLanding,
} from "@/schemas/product-landing";

/**
 * Penyunting satu seksi halaman jualan.
 *
 * Delapan seksi bernama, urutannya tetap — tidak ada pemilih tipe dan tidak ada
 * penggeser seksi. Yang bisa diurutkan hanya item **di dalam** seksi, karena di
 * situlah urutan memang bermakna (urutan FAQ, fitur, dan paket).
 *
 * Daftar field-nya tidak ditulis di sini: dibaca dari `LANDING_SLOTS`, tabel
 * yang sama yang dipakai parser FormData di schemas/admin.ts dan komponen
 * render publik. Menambah field berarti menyunting satu tabel, bukan tiga
 * berkas.
 *
 * Polanya mengikuti GalleryEditor: field berindeks (`…items.2.title.id`) supaya
 * urutan di layar adalah urutan yang terkirim dan path galat Zod langsung cocok
 * dengan nama input; tombol naik/turun selain seret, karena menyeret hanya bisa
 * dilakukan dengan tetikus.
 */

export type LocalizedValue = { en: string; id: string };
export type LandingItemValues = Record<
  string,
  string | boolean | LocalizedValue
>;

export type LandingItemState = {
  key: string;
  values: LandingItemValues;
  /** Berkas gambar yang dipilih tapi belum diunggah, per nama field. */
  files: Record<string, File>;
  /** Sumber pratinjau: URL bucket tersimpan, atau object URL berkas lokal. */
  previews: Record<string, string>;
};

export type LandingSectionState = {
  heading: LocalizedValue;
  intro: LocalizedValue;
  items: LandingItemState[];
};

export type LandingState = Record<LandingSlot, LandingSectionState>;

const emptyLocalized = (): LocalizedValue => ({ en: "", id: "" });

function newItem(spec: LandingSlotSpec): LandingItemState {
  const values: LandingItemValues = {};
  for (const field of spec.fields) {
    if (field.kind === "flag") values[field.name] = false;
    else if (field.localized) values[field.name] = emptyLocalized();
    else values[field.name] = "";
  }
  // Kunci acak, bukan turunan indeks: menambah dua item beruntun harus
  // menghasilkan dua baris, bukan satu baris yang berkedip.
  return { key: crypto.randomUUID(), values, files: {}, previews: {} };
}

function savedValues(
  spec: LandingSlotSpec,
  item: Record<string, unknown>,
): LandingItemValues {
  const values: LandingItemValues = {};
  for (const field of spec.fields) {
    const raw = item[field.name];
    if (field.kind === "flag") {
      values[field.name] = raw === true;
    } else if (field.kind === "lines") {
      // Larik disunting sebagai textarea satu butir per baris; server
      // memecahnya lagi dengan splitLines.
      const lines = raw as { en?: string[]; id?: string[] } | undefined;
      values[field.name] = {
        en: (lines?.en ?? []).join("\n"),
        id: (lines?.id ?? []).join("\n"),
      };
    } else if (field.localized) {
      const pair = raw as LocalizedValue | undefined;
      values[field.name] = { en: pair?.en ?? "", id: pair?.id ?? "" };
    } else {
      values[field.name] = typeof raw === "string" ? raw : "";
    }
  }
  return values;
}

export function landingStateFromValue(landing: ProductLanding): LandingState {
  const state = {} as LandingState;

  for (const spec of LANDING_SLOTS) {
    const section = landing[spec.slot];
    state[spec.slot] = {
      heading: section?.heading ?? emptyLocalized(),
      intro: section?.intro ?? emptyLocalized(),
      items: (section?.items ?? []).map((raw, index) => {
        const item = raw as Record<string, unknown>;
        const previews: Record<string, string> = {};
        for (const field of spec.fields) {
          if (field.kind !== "image") continue;
          const url = item[field.name];
          if (typeof url === "string" && url) previews[field.name] = url;
        }
        return {
          key: `saved-${spec.slot}-${index}`,
          values: savedValues(spec, item),
          files: {},
          previews,
        };
      }),
    };
  }

  return state;
}

export const emptyLandingState = (): LandingState => landingStateFromValue({});

// --- Kelas bersama ---

const controlClass =
  "r-chip ink-border w-full bg-(--wash) px-3 py-2 text-[13px] outline-none placeholder:text-(--soft)";

const iconButtonClass =
  "r-tag ink-border lift-chip cursor-pointer bg-(--paper) px-2.5 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase disabled:cursor-not-allowed disabled:opacity-40";

const LANGS = [
  { code: "id", label: "ID" },
  { code: "en", label: "EN" },
] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span role="alert" className="text-[11px] font-bold text-(--accent-ink)">
      {message}
    </span>
  );
}

/** Sepasang input ID/EN untuk satu field dwibahasa. */
function LocalizedInputs({
  name,
  label,
  hint,
  rows,
  value,
  onChange,
  fieldErrors,
}: {
  name: string;
  label: string;
  hint?: string;
  /** Diisi untuk textarea; kosong berarti input satu baris. */
  rows?: number;
  value: LocalizedValue;
  onChange: (next: LocalizedValue) => void;
  fieldErrors?: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="micro">{label}</span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LANGS.map(({ code, label: lang }) => {
          const inputName = `${name}.${code}`;
          const error = fieldErrors?.[inputName];
          const shared = {
            name: inputName,
            value: value[code],
            "aria-label": `${label} (${lang})`,
            "aria-invalid": Boolean(error),
            className: cn(controlClass, error && "border-(--accent-ink)"),
            onChange: (
              event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
            ) => onChange({ ...value, [code]: event.target.value }),
          };
          return (
            <div key={code} className="flex flex-col gap-1">
              <span className="font-tech text-[10px] text-(--soft)">
                {lang}
              </span>
              {rows ? (
                <textarea
                  {...shared}
                  rows={rows}
                  className={cn(shared.className, "resize-y")}
                />
              ) : (
                <input {...shared} type="text" />
              )}
              <FieldError message={error} />
            </div>
          );
        })}
      </div>
      {hint && <span className="text-[11px] text-(--soft)">{hint}</span>}
    </div>
  );
}

/** Field gambar: pratinjau, pemilih berkas, dan URL tersimpan. */
function ImageField({
  name,
  label,
  url,
  file,
  preview,
  onPick,
  onClear,
  error,
}: {
  name: string;
  label: string;
  url: string;
  file?: File;
  preview?: string;
  onPick: (file: File) => void;
  onClear: () => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="micro">{label}</span>
      <div className="flex items-start gap-2.5">
        {/* URL tersimpan ikut terkirim; kosong untuk gambar yang baru dipilih. */}
        <input type="hidden" name={name} value={url} />
        {file && <PendingFileInput name={`${name}File`} file={file} />}

        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element --
             pratinjau admin: sumbernya bisa blob: dari berkas yang baru
             dipilih, yang tidak bisa dilalui pipeline next/image. */
          <img
            src={preview}
            alt=""
            className="ink-border r-chip h-[56px] w-[56px] shrink-0 object-cover"
          />
        ) : (
          <span className="ink-border-dashed r-chip flex h-[56px] w-[56px] shrink-0 items-center justify-center text-[10px] text-(--soft)">
            —
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <input
            type="file"
            accept="image/*"
            aria-label={`Pilih ${label}`}
            onChange={(event) => {
              const picked = event.target.files?.[0];
              if (picked) onPick(picked);
              // Dikosongkan supaya memilih berkas yang sama dua kali tetap
              // memicu change, dan supaya input ini tidak ikut terkirim.
              event.target.value = "";
            }}
            className="r-chip ink-border w-full cursor-pointer bg-(--paper) px-3 py-1.5 text-[12px] text-(--soft) file:mr-3 file:cursor-pointer file:border-0 file:bg-transparent file:text-[12px] file:font-bold file:text-(--ink)"
          />
          {(url || file) && (
            <button
              type="button"
              onClick={onClear}
              className="r-tag ink-border lift-chip w-fit cursor-pointer px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] text-(--soft) uppercase"
            >
              Kosongkan
            </button>
          )}
          <FieldError message={error} />
        </div>
      </div>
    </div>
  );
}

// --- Penyunting seksi ---

export default function LandingSectionEditor({
  spec,
  section,
  onChange,
  fieldErrors,
}: {
  spec: LandingSlotSpec;
  section: LandingSectionState;
  onChange: (next: LandingSectionState) => void;
  fieldErrors?: Record<string, string>;
}) {
  const dragIndex = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const prefix = `landing.${spec.slot}`;

  const patchItem = (index: number, next: Partial<LandingItemState>) => {
    onChange({
      ...section,
      items: section.items.map((item, i) =>
        i === index ? { ...item, ...next } : item,
      ),
    });
  };

  const patchValue = (
    index: number,
    field: string,
    value: string | boolean | LocalizedValue,
  ) => {
    const item = section.items[index];
    patchItem(index, { values: { ...item.values, [field]: value } });
  };

  const remove = (index: number) => {
    const item = section.items[index];
    // Object URL berkas lokal harus dilepas; URL bucket tidak.
    for (const [field, preview] of Object.entries(item.previews)) {
      if (item.files[field]) URL.revokeObjectURL(preview);
    }
    onChange({
      ...section,
      items: section.items.filter((_, i) => i !== index),
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= section.items.length || from === to) return;
    const items = [...section.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    onChange({ ...section, items });
  };

  const pickImage = (index: number, field: string, file: File) => {
    const item = section.items[index];
    if (item.files[field]) URL.revokeObjectURL(item.previews[field]);
    patchItem(index, {
      // URL lama dikosongkan: berkas baru menggantikannya setelah diunggah.
      values: { ...item.values, [field]: "" },
      files: { ...item.files, [field]: file },
      previews: { ...item.previews, [field]: URL.createObjectURL(file) },
    });
  };

  const clearImage = (index: number, field: string) => {
    const item = section.items[index];
    if (item.files[field]) URL.revokeObjectURL(item.previews[field]);
    const files = { ...item.files };
    const previews = { ...item.previews };
    delete files[field];
    delete previews[field];
    patchItem(index, {
      values: { ...item.values, [field]: "" },
      files,
      previews,
    });
  };

  const renderField = (
    field: LandingFieldSpec,
    item: LandingItemState,
    index: number,
  ) => {
    const name = `${prefix}.items.${index}.${field.name}`;
    const value = item.values[field.name];

    if (field.kind === "image") {
      return (
        <ImageField
          key={field.name}
          name={name}
          label={field.label}
          url={typeof value === "string" ? value : ""}
          file={item.files[field.name]}
          preview={item.previews[field.name]}
          onPick={(file) => pickImage(index, field.name, file)}
          onClear={() => clearImage(index, field.name)}
          error={fieldErrors?.[name]}
        />
      );
    }

    if (field.kind === "flag") {
      return (
        <label
          key={field.name}
          className="r-chip ink-border flex w-fit cursor-pointer items-center gap-2.5 bg-(--wash) px-3 py-2"
        >
          <input
            name={name}
            type="checkbox"
            checked={value === true}
            onChange={(event) =>
              patchValue(index, field.name, event.target.checked)
            }
            className="h-4 w-4 cursor-pointer accent-(--accent)"
          />
          <span className="text-[13px] font-semibold">{field.label}</span>
        </label>
      );
    }

    if (field.kind === "color") {
      const hex = typeof value === "string" ? value : "";
      return (
        <div key={field.name} className="flex flex-col gap-1.5">
          <span className="micro">{field.label}</span>
          <div className="flex items-center gap-2.5">
            <input
              type="color"
              aria-label={`${field.label} — pemilih warna`}
              value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000"}
              onChange={(event) =>
                patchValue(index, field.name, event.target.value)
              }
              className="ink-border r-chip h-9 w-12 cursor-pointer bg-(--wash) p-1"
            />
            <input
              name={name}
              type="text"
              value={hex}
              aria-label={field.label}
              placeholder="#1f4433"
              onChange={(event) =>
                patchValue(index, field.name, event.target.value)
              }
              aria-invalid={Boolean(fieldErrors?.[name])}
              className={cn(
                controlClass,
                fieldErrors?.[name] && "border-(--accent-ink)",
              )}
            />
          </div>
          {field.hint && !fieldErrors?.[name] && (
            <span className="text-[11px] text-(--soft)">{field.hint}</span>
          )}
          <FieldError message={fieldErrors?.[name]} />
        </div>
      );
    }

    if (field.kind === "url") {
      return (
        <div key={field.name} className="flex flex-col gap-1.5">
          <span className="micro">{field.label}</span>
          <input
            name={name}
            type="text"
            value={typeof value === "string" ? value : ""}
            aria-label={field.label}
            placeholder="https://…"
            onChange={(event) =>
              patchValue(index, field.name, event.target.value)
            }
            aria-invalid={Boolean(fieldErrors?.[name])}
            className={cn(
              controlClass,
              fieldErrors?.[name] && "border-(--accent-ink)",
            )}
          />
          {field.hint && !fieldErrors?.[name] && (
            <span className="text-[11px] text-(--soft)">{field.hint}</span>
          )}
          <FieldError message={fieldErrors?.[name]} />
        </div>
      );
    }

    return (
      <LocalizedInputs
        key={field.name}
        name={name}
        label={field.label}
        hint={field.hint}
        rows={field.kind === "text" ? undefined : 3}
        value={(value as LocalizedValue) ?? emptyLocalized()}
        onChange={(next) => patchValue(index, field.name, next)}
        fieldErrors={fieldErrors}
      />
    );
  };

  return (
    <div className="flex flex-col gap-3.5">
      <p className="m-0 text-[11px] text-(--soft)">
        {spec.hint} Kosongkan judul dan hapus semua{" "}
        {spec.itemLabel.toLowerCase()}
        -nya untuk menghilangkan seksi ini dari halaman.
      </p>

      <LocalizedInputs
        name={`${prefix}.heading`}
        label="Judul seksi"
        value={section.heading}
        onChange={(heading) => onChange({ ...section, heading })}
        fieldErrors={fieldErrors}
      />
      <LocalizedInputs
        name={`${prefix}.intro`}
        label="Pengantar"
        hint="Opsional. Mendukung Markdown, jadi boleh memuat tautan."
        rows={2}
        value={section.intro}
        onChange={(intro) => onChange({ ...section, intro })}
        fieldErrors={fieldErrors}
      />

      {section.items.length === 0 ? (
        <p className="m-0 text-[12px] text-(--soft)">
          Belum ada {spec.itemLabel.toLowerCase()}.
        </p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {section.items.map((item, index) => (
            <li
              key={item.key}
              onDragOver={(event) => {
                if (dragIndex.current === null) return;
                event.preventDefault();
              }}
              onDrop={(event) => {
                if (dragIndex.current === null) return;
                event.preventDefault();
                move(dragIndex.current, index);
                dragIndex.current = null;
                setDragging(false);
              }}
              className={cn(
                "r-card ink-border flex flex-col gap-3 bg-(--paper) p-3",
                dragging && "border-dashed",
              )}
            >
              {/* Penanda yang selalu terkirim: parser memakainya untuk tahu
                  di mana daftar item berakhir. */}
              <input
                type="hidden"
                name={`${prefix}.items.${index}.present`}
                value="1"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    draggable
                    onDragStart={(event) => {
                      dragIndex.current = index;
                      // Firefox mengabaikan drag tanpa payload.
                      event.dataTransfer.setData("text/plain", String(index));
                      event.dataTransfer.effectAllowed = "move";
                      setDragging(true);
                    }}
                    onDragEnd={() => {
                      dragIndex.current = null;
                      setDragging(false);
                    }}
                    aria-hidden="true"
                    title="Seret untuk mengurutkan"
                    className="font-tech cursor-grab px-1 text-[15px] leading-none text-(--soft) select-none"
                  >
                    ⠿
                  </span>
                  <span className="micro text-(--soft)">
                    {spec.itemLabel} {index + 1}
                  </span>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Naikkan ${spec.itemLabel} ${index + 1}`}
                    className={iconButtonClass}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === section.items.length - 1}
                    aria-label={`Turunkan ${spec.itemLabel} ${index + 1}`}
                    className={iconButtonClass}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Hapus ${spec.itemLabel} ${index + 1}`}
                    className={cn(iconButtonClass, "text-(--soft)")}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {spec.fields.map((field) => renderField(field, item, index))}
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        onClick={() =>
          onChange({ ...section, items: [...section.items, newItem(spec)] })
        }
        className="r-tag ink-border lift-chip w-fit cursor-pointer bg-(--paper) px-4 py-2 text-[11px] font-bold tracking-[0.1em] uppercase"
      >
        + {spec.itemLabel}
      </button>
    </div>
  );
}
