"use client";

import PendingFileInput from "./PendingFileInput";
import { cn } from "@/lib/utils";
import {
  BLOCK_KINDS,
  BLOCK_KIND_SPECS,
  MAX_BLOCKS_PER_PRODUCT,
  MAX_ITEMS_PER_SECTION,
  type BlockFieldSpec,
  type BlockKind,
  type BlockKindSpec,
  type ListStyle,
  type ProductBlocks,
} from "@/schemas/product-blocks";

/**
 * Penyusun blok halaman jualan.
 *
 * Pendahulunya (`LandingSectionEditor`) merender delapan seksi bernama yang
 * urutannya dikunci kode; yang bisa diurutkan cuma item di dalamnya. Di sini
 * bloknya sendiri yang ditambah, diurutkan, dan dihapus — itulah inti rombakan
 * ini. Mesin per-item-nya diwarisi apa adanya: nama field berindeks, tombol
 * naik/turun, field gambar dengan URL tersimpan plus berkas tertunda.
 *
 * Daftar field tiap jenis tidak ditulis di sini: dibaca dari
 * `BLOCK_KIND_SPECS`, tabel yang sama yang dipakai parser FormData di
 * schemas/admin.ts, pengunggah gambar di actions.ts, dan pembersih bucket di
 * product-blocks.ts.
 *
 * Nama field berindeks (`blocks.2.items.0.label.id`) supaya urutan di layar
 * adalah urutan yang terkirim dan path galat Zod langsung cocok dengan nama
 * input; tombol naik/turun selain seret, karena menyeret hanya bisa dilakukan
 * dengan tetikus.
 */

export type Lang = "en" | "id";
export type LocalizedValue = { en: string; id: string };
export type BlockItemValues = Record<string, string | boolean | LocalizedValue>;

export type BlockItemState = {
  key: string;
  values: BlockItemValues;
  /** Berkas gambar yang dipilih tapi belum diunggah, per nama field. */
  files: Record<string, File>;
  /** Sumber pratinjau: URL bucket tersimpan, atau object URL berkas lokal. */
  previews: Record<string, string>;
};

export type BlockState = {
  /** Kunci React saja; tidak pernah dikirim. */
  key: string;
  /** uuid yang benar-benar disimpan, dicetak sekali dan bertahan selamanya. */
  id: string;
  kind: BlockKind;
  style?: ListStyle;
  heading: LocalizedValue;
  intro: LocalizedValue;
  items: BlockItemState[];
};

const emptyLocalized = (): LocalizedValue => ({ en: "", id: "" });

function newItem(spec: BlockKindSpec): BlockItemState {
  const values: BlockItemValues = {};
  for (const field of spec.fields) {
    if (field.kind === "flag") values[field.name] = false;
    else if (field.localized) values[field.name] = emptyLocalized();
    else values[field.name] = "";
  }
  // Kunci acak, bukan turunan indeks: menambah dua item beruntun harus
  // menghasilkan dua baris, bukan satu baris yang berkedip.
  return { key: crypto.randomUUID(), values, files: {}, previews: {} };
}

export function newBlock(kind: BlockKind): BlockState {
  const spec = BLOCK_KIND_SPECS[kind];
  return {
    key: crypto.randomUUID(),
    // uuid tanpa tanda hubung pun sah, tapi bentuk penuhnya sudah lolos
    // `blockIdSchema` dan enak dibaca saat menengok kolom jsonb-nya.
    id: crypto.randomUUID(),
    kind,
    style: spec.styles ? spec.styles[0] : undefined,
    heading: emptyLocalized(),
    intro: emptyLocalized(),
    items: [newItem(spec)],
  };
}

function savedValues(
  spec: BlockKindSpec,
  item: Record<string, unknown>,
): BlockItemValues {
  const values: BlockItemValues = {};
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

/** Blok tersimpan dari database menjadi state penyunting. */
export function blockStatesFromValue(blocks: ProductBlocks): BlockState[] {
  return blocks.map((block, blockIndex) => {
    const spec = BLOCK_KIND_SPECS[block.kind];
    return {
      key: `saved-${blockIndex}-${block.id}`,
      id: block.id,
      kind: block.kind,
      style: "style" in block ? block.style : undefined,
      heading: block.heading,
      intro: block.intro,
      items: (block.items as Record<string, unknown>[]).map((item, index) => {
        const previews: Record<string, string> = {};
        for (const field of spec.fields) {
          if (field.kind !== "image") continue;
          const url = item[field.name];
          if (typeof url === "string" && url) previews[field.name] = url;
        }
        return {
          key: `saved-${blockIndex}-${index}`,
          values: savedValues(spec, item),
          files: {},
          previews,
        };
      }),
    };
  });
}

/**
 * Menyalin satu bahasa ke bahasa lain di seluruh blok. Dipanggil tombol
 * "salin ke …" di ProductForm; blok ikut karena kalau tidak, menyalin bahasa
 * hanya mengisi separuh produk.
 */
export function copyBlockLanguage(
  blocks: BlockState[],
  from: Lang,
  to: Lang,
): BlockState[] {
  const copyPair = (pair: LocalizedValue): LocalizedValue => ({
    ...pair,
    [to]: pair[from],
  });

  return blocks.map((block) => ({
    ...block,
    heading: copyPair(block.heading),
    intro: copyPair(block.intro),
    items: block.items.map((item) => ({
      ...item,
      values: Object.fromEntries(
        Object.entries(item.values).map(([name, value]) => [
          name,
          value !== null && typeof value === "object"
            ? copyPair(value as LocalizedValue)
            : value,
        ]),
      ),
    })),
  }));
}

// --- Kelas bersama ---

const controlClass =
  "r-chip ink-border w-full bg-(--wash) px-3 py-2 text-[13px] outline-none placeholder:text-(--soft)";

const iconButtonClass =
  "r-tag ink-border lift-chip cursor-pointer bg-(--paper) px-2.5 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase disabled:cursor-not-allowed disabled:opacity-40";

const LANGS: { code: Lang; label: string }[] = [
  { code: "id", label: "ID" },
  { code: "en", label: "EN" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span role="alert" className="text-[11px] font-bold text-(--accent-ink)">
      {message}
    </span>
  );
}

/**
 * Sepasang input ID/EN untuk satu field dwibahasa, yang tidak aktif disembunyi
 * lewat atribut `hidden`.
 *
 * **Disembunyikan, bukan dilepas.** Input yang tidak ada di DOM juga tidak ada
 * di `FormData`; melepas bahasa yang tidak aktif berarti tiap simpan diam-diam
 * mengosongkan separuh produk. Aturan yang sama berlaku untuk tab dan bahasa
 * di ProductForm.
 */
function LocalizedInputs({
  name,
  label,
  hint,
  rows,
  lang,
  value,
  onChange,
  fieldErrors,
}: {
  name: string;
  label: string;
  hint?: string;
  /** Diisi untuk textarea; kosong berarti input satu baris. */
  rows?: number;
  lang: Lang;
  value: LocalizedValue;
  onChange: (next: LocalizedValue) => void;
  fieldErrors?: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="micro">{label}</span>
      {LANGS.map(({ code, label: langLabel }) => {
        const inputName = `${name}.${code}`;
        const error = fieldErrors?.[inputName];
        const shared = {
          name: inputName,
          value: value[code],
          "aria-label": `${label} (${langLabel})`,
          "aria-invalid": Boolean(error),
          className: cn(controlClass, error && "border-(--accent-ink)"),
          onChange: (
            event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => onChange({ ...value, [code]: event.target.value }),
        };
        return (
          // Kelas tata letak tidak boleh duduk di elemen yang sama dengan
          // `hidden`: `display:flex` mengalahkan `[hidden]{display:none}`.
          <div key={code} hidden={code !== lang}>
            <div className="flex flex-col gap-1">
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
          </div>
        );
      })}
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

// --- Satu blok ---

const STYLE_LABELS: Record<ListStyle, string> = {
  points: "Poin bernomor",
  cards: "Kisi kartu",
  specs: "Tabel label/nilai",
};

function BlockCard({
  block,
  index,
  total,
  lang,
  fieldErrors,
  resetKey,
  onChange,
  onMove,
  onRemove,
}: {
  block: BlockState;
  index: number;
  total: number;
  lang: Lang;
  fieldErrors?: Record<string, string>;
  /** Lihat catatan `selectEpoch` di ProductForm. */
  resetKey: number;
  onChange: (next: BlockState) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const spec = BLOCK_KIND_SPECS[block.kind];
  const prefix = `blocks.${index}`;

  const patchItem = (itemIndex: number, next: Partial<BlockItemState>) => {
    onChange({
      ...block,
      items: block.items.map((item, i) =>
        i === itemIndex ? { ...item, ...next } : item,
      ),
    });
  };

  const patchValue = (
    itemIndex: number,
    field: string,
    value: string | boolean | LocalizedValue,
  ) => {
    const item = block.items[itemIndex];
    patchItem(itemIndex, { values: { ...item.values, [field]: value } });
  };

  const removeItem = (itemIndex: number) => {
    const item = block.items[itemIndex];
    // Object URL berkas lokal harus dilepas; URL bucket tidak.
    for (const [field, preview] of Object.entries(item.previews)) {
      if (item.files[field]) URL.revokeObjectURL(preview);
    }
    onChange({
      ...block,
      items: block.items.filter((_, i) => i !== itemIndex),
    });
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= block.items.length || from === to) return;
    const items = [...block.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    onChange({ ...block, items });
  };

  const pickImage = (itemIndex: number, field: string, file: File) => {
    const item = block.items[itemIndex];
    if (item.files[field]) URL.revokeObjectURL(item.previews[field]);
    patchItem(itemIndex, {
      // URL lama dikosongkan: berkas baru menggantikannya setelah diunggah.
      values: { ...item.values, [field]: "" },
      files: { ...item.files, [field]: file },
      previews: { ...item.previews, [field]: URL.createObjectURL(file) },
    });
  };

  const clearImage = (itemIndex: number, field: string) => {
    const item = block.items[itemIndex];
    if (item.files[field]) URL.revokeObjectURL(item.previews[field]);
    const files = { ...item.files };
    const previews = { ...item.previews };
    delete files[field];
    delete previews[field];
    patchItem(itemIndex, {
      values: { ...item.values, [field]: "" },
      files,
      previews,
    });
  };

  const renderField = (
    field: BlockFieldSpec,
    item: BlockItemState,
    itemIndex: number,
  ) => {
    const name = `${prefix}.items.${itemIndex}.${field.name}`;
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
          onPick={(file) => pickImage(itemIndex, field.name, file)}
          onClear={() => clearImage(itemIndex, field.name)}
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
              patchValue(itemIndex, field.name, event.target.checked)
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
                patchValue(itemIndex, field.name, event.target.value)
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
                patchValue(itemIndex, field.name, event.target.value)
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
              patchValue(itemIndex, field.name, event.target.value)
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
        lang={lang}
        value={(value as LocalizedValue) ?? emptyLocalized()}
        onChange={(next) => patchValue(itemIndex, field.name, next)}
        fieldErrors={fieldErrors}
      />
    );
  };

  return (
    <li className="r-card ink-border flat-3 flex flex-col gap-3.5 bg-(--wash) p-4">
      {/* Tiga penanda yang membawa apa yang tidak lagi disebut kuncinya:
          indeks ini terpakai, jenis apa, dan uuid mana. */}
      <input type="hidden" name={`${prefix}.present`} value="1" />
      <input type="hidden" name={`${prefix}.kind`} value={block.kind} />
      <input type="hidden" name={`${prefix}.id`} value={block.id} />

      <div className="flex items-center justify-between gap-2">
        <span className="micro">
          {index + 1} · {spec.label}
        </span>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => onMove(index - 1)}
            disabled={index === 0}
            aria-label={`Naikkan blok ${index + 1}`}
            className={iconButtonClass}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(index + 1)}
            disabled={index === total - 1}
            aria-label={`Turunkan blok ${index + 1}`}
            className={iconButtonClass}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Hapus blok ${index + 1}`}
            className={cn(iconButtonClass, "text-(--soft)")}
          >
            ✕
          </button>
        </div>
      </div>

      <p className="m-0 text-[11px] text-(--soft)">{spec.hint}</p>

      {spec.styles && (
        <div className="flex flex-col gap-1.5">
          <span className="micro">Tata letak</span>
          <select
            /**
             * Tak terkendali, dan dipasang ulang tiap kali action menjawab.
             * Keduanya perlu. `form.reset()` milik React memulihkan `<select>`
             * ke opsi yang beratribut `selected`, dan atribut itu hanya ditulis
             * oleh `defaultValue` — select terkendali cuma menyetel propertinya,
             * jadi reset melemparnya balik ke opsi pertama. Kuncinya yang
             * memastikan atribut itu selalu ditulis ulang dari pilihan terakhir
             * pemilik, bukan dari pilihan saat blok ini pertama dipasang.
             */
            key={`style-${resetKey}-${block.style ?? spec.styles[0]}`}
            name={`${prefix}.style`}
            defaultValue={block.style ?? spec.styles[0]}
            onChange={(event) =>
              onChange({ ...block, style: event.target.value as ListStyle })
            }
            className={cn(controlClass, "cursor-pointer")}
          >
            {spec.styles.map((style) => (
              <option key={style} value={style}>
                {STYLE_LABELS[style]}
              </option>
            ))}
          </select>
        </div>
      )}

      <LocalizedInputs
        name={`${prefix}.heading`}
        label="Judul blok"
        hint="Kosongkan untuk menyembunyikan blok ini di bahasa yang aktif."
        lang={lang}
        value={block.heading}
        onChange={(heading) => onChange({ ...block, heading })}
        fieldErrors={fieldErrors}
      />
      <LocalizedInputs
        name={`${prefix}.intro`}
        label="Pengantar"
        hint="Opsional. Mendukung Markdown, jadi boleh memuat tautan."
        rows={2}
        lang={lang}
        value={block.intro}
        onChange={(intro) => onChange({ ...block, intro })}
        fieldErrors={fieldErrors}
      />

      {block.items.length === 0 ? (
        <p className="m-0 text-[12px] text-(--soft)">
          Belum ada {spec.itemLabel.toLowerCase()}.
        </p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {block.items.map((item, itemIndex) => (
            <li
              key={item.key}
              className="r-card ink-border flex flex-col gap-3 bg-(--paper) p-3"
            >
              {/* Penanda yang selalu terkirim: parser memakainya untuk tahu
                  di mana daftar item berakhir. */}
              <input
                type="hidden"
                name={`${prefix}.items.${itemIndex}.present`}
                value="1"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="micro text-(--soft)">
                  {spec.itemLabel} {itemIndex + 1}
                </span>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveItem(itemIndex, itemIndex - 1)}
                    disabled={itemIndex === 0}
                    aria-label={`Naikkan ${spec.itemLabel} ${itemIndex + 1}`}
                    className={iconButtonClass}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(itemIndex, itemIndex + 1)}
                    disabled={itemIndex === block.items.length - 1}
                    aria-label={`Turunkan ${spec.itemLabel} ${itemIndex + 1}`}
                    className={iconButtonClass}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(itemIndex)}
                    aria-label={`Hapus ${spec.itemLabel} ${itemIndex + 1}`}
                    className={cn(iconButtonClass, "text-(--soft)")}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {spec.fields.map((field) => renderField(field, item, itemIndex))}
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        onClick={() =>
          onChange({ ...block, items: [...block.items, newItem(spec)] })
        }
        disabled={block.items.length >= MAX_ITEMS_PER_SECTION}
        className="r-tag ink-border lift-chip w-fit cursor-pointer bg-(--paper) px-4 py-2 text-[11px] font-bold tracking-[0.1em] uppercase disabled:cursor-not-allowed disabled:opacity-40"
      >
        + {spec.itemLabel}
      </button>
    </li>
  );
}

// --- Daftar blok ---

export default function BlockEditor({
  blocks,
  lang,
  fieldErrors,
  resetKey,
  onChange,
}: {
  blocks: BlockState[];
  lang: Lang;
  fieldErrors?: Record<string, string>;
  /** Lihat catatan `selectEpoch` di ProductForm. */
  resetKey: number;
  onChange: (next: BlockState[]) => void;
}) {
  const full = blocks.length >= MAX_BLOCKS_PER_PRODUCT;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length || from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[12px] text-(--soft)">
        Blok tampil di halaman produk dalam urutan ini. Produk sederhana tidak
        butuh satu pun — sampul, harga, dan daftar &ldquo;what you get&rdquo;
        sudah ada di tab Product.
      </p>

      {blocks.length === 0 ? (
        <p className="ink-border-dashed r-card m-0 bg-(--wash) px-5 py-7 text-center text-[13px] text-(--soft)">
          Belum ada blok.
        </p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
          {blocks.map((block, index) => (
            <BlockCard
              key={block.key}
              block={block}
              index={index}
              total={blocks.length}
              lang={lang}
              fieldErrors={fieldErrors}
              resetKey={resetKey}
              onChange={(next) =>
                onChange(blocks.map((b, i) => (i === index ? next : b)))
              }
              onMove={(to) => move(index, to)}
              onRemove={() => onChange(blocks.filter((_, i) => i !== index))}
            />
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-2">
        <span className="micro text-(--soft)">
          Tambah blok {full && `— batasnya ${MAX_BLOCKS_PER_PRODUCT}`}
        </span>
        <div className="flex flex-wrap gap-2">
          {BLOCK_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              disabled={full}
              onClick={() => onChange([...blocks, newBlock(kind)])}
              className="r-tag ink-border lift-chip cursor-pointer bg-(--paper) px-3.5 py-2 text-[11px] font-bold tracking-[0.1em] uppercase disabled:cursor-not-allowed disabled:opacity-40"
            >
              + {BLOCK_KIND_SPECS[kind].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
