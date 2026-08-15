"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Galeri gambar per bahasa. Gambar pertama adalah cover — tidak ada kolom cover
 * terpisah yang bisa tidak sinkron dengan galerinya.
 *
 * Urutan di layar adalah urutan yang dikirim: setiap baris merender field
 * berindeks (`…images.<i>.alt`), jadi `order` di database tidak pernah
 * bergantung pada nilai tersembunyi yang bisa meleset dari tampilannya.
 *
 * Menyeret hanya bisa dilakukan dengan tetikus, jadi tombol naik/turun bukan
 * pelengkap — tanpa keduanya urutan galeri tidak bisa diubah lewat papan ketik.
 */

export type GalleryEntry = {
  key: string;
  /** Kosong untuk gambar yang baru dipilih dan belum diunggah. */
  url: string;
  alt: string;
  caption: string;
  file: File | null;
  /** URL untuk pratinjau: URL bucket, atau object URL berkas lokal. */
  preview: string;
};

export function entriesFromImages(
  images: { url: string; alt: string; caption?: string }[],
): GalleryEntry[] {
  return images.map((image, index) => ({
    key: `saved-${index}-${image.url}`,
    url: image.url,
    alt: image.alt,
    caption: image.caption ?? "",
    file: null,
    preview: image.url,
  }));
}

/**
 * Berkas tidak bisa ditaruh di state form biasa, jadi tiap berkas tertunda
 * punya input file tersembunyi yang isinya ditulis lewat DataTransfer.
 *
 * Penugasannya dijalankan setiap render, bukan sekali saja: React me-reset form
 * setelah server action selesai, yang mengosongkan `input.files` — dan tanpa
 * penugasan ulang, mencoba kirim lagi setelah validasi gagal akan mengirim
 * baris galeri tanpa berkasnya.
 */
function PendingFileInput({ name, file }: { name: string; file: File }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
  });

  return (
    <input
      ref={ref}
      type="file"
      name={name}
      className="hidden"
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}

const controlClass =
  "r-chip ink-border w-full bg-(--wash) px-3 py-2 text-[13px] outline-none placeholder:text-(--soft)";

const iconButtonClass =
  "r-tag ink-border lift-chip cursor-pointer bg-(--paper) px-2.5 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase disabled:cursor-not-allowed disabled:opacity-40";

export default function GalleryEditor({
  prefix,
  legend,
  entries,
  onChange,
  fieldErrors,
}: {
  /** Awalan nama field, mis. `translations.en.images`. */
  prefix: string;
  legend: string;
  entries: GalleryEntry[];
  onChange: (entries: GalleryEntry[]) => void;
  fieldErrors?: Record<string, string>;
}) {
  const [dropActive, setDropActive] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const addFiles = (files: FileList | File[]) => {
    const additions = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        // Kunci acak, bukan turunan nama/indeks: menambahkan berkas yang sama
        // dua kali harus menghasilkan dua baris, bukan satu baris yang berkedip.
        key: crypto.randomUUID(),
        url: "",
        alt: "",
        caption: "",
        file,
        preview: URL.createObjectURL(file),
      }));
    if (additions.length > 0) onChange([...entries, ...additions]);
  };

  const patch = (index: number, changes: Partial<GalleryEntry>) => {
    onChange(
      entries.map((entry, i) =>
        i === index ? { ...entry, ...changes } : entry,
      ),
    );
  };

  const remove = (index: number) => {
    const entry = entries[index];
    // Object URL milik berkas lokal harus dilepas; URL bucket tidak.
    if (entry.file) URL.revokeObjectURL(entry.preview);
    onChange(entries.filter((_, i) => i !== index));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= entries.length || from === to) return;
    const next = [...entries];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <span className="micro">{legend}</span>

      <div
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={(event) => {
          if (event.dataTransfer.files.length === 0) return;
          event.preventDefault();
          setDropActive(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "ink-border-dashed r-card flex flex-col items-center gap-2 bg-(--wash) px-4 py-5 text-center",
          dropActive && "border-(--accent-ink)",
        )}
      >
        <span className="text-[12px] text-(--soft)">
          Drop images here, or pick them below. The first image is the cover.
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            // Dikosongkan supaya memilih berkas yang sama dua kali tetap
            // memicu change, dan supaya input ini tidak ikut terkirim.
            event.target.value = "";
          }}
          aria-label={`Add images to ${legend}`}
          className="r-chip ink-border max-w-full cursor-pointer bg-(--paper) px-3 py-2 text-[12px] text-(--soft) file:mr-3 file:cursor-pointer file:border-0 file:bg-transparent file:text-[12px] file:font-bold file:text-(--ink)"
        />
      </div>

      {entries.length === 0 ? (
        <p className="m-0 text-[12px] text-(--soft)">
          No images. Posts without images render without a gallery.
        </p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {entries.map((entry, index) => (
            <li
              key={entry.key}
              onDragOver={(event) => {
                if (dragIndex.current === null) return;
                event.preventDefault();
              }}
              onDrop={(event) => {
                if (dragIndex.current === null) return;
                event.preventDefault();
                move(dragIndex.current, index);
                dragIndex.current = null;
              }}
              className="r-card ink-border flex flex-col gap-2.5 bg-(--paper) p-3 sm:flex-row sm:items-start"
            >
              <input
                type="hidden"
                name={`${prefix}.${index}.url`}
                value={entry.url}
              />
              {entry.file && (
                <PendingFileInput
                  name={`${prefix}.${index}.file`}
                  file={entry.file}
                />
              )}

              <div className="flex items-center gap-2.5 sm:flex-col">
                <span
                  draggable
                  onDragStart={(event) => {
                    dragIndex.current = index;
                    // Firefox mengabaikan drag tanpa payload.
                    event.dataTransfer.setData("text/plain", String(index));
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    dragIndex.current = null;
                  }}
                  aria-hidden="true"
                  title="Drag to reorder"
                  className="font-tech cursor-grab px-1 text-[15px] leading-none text-(--soft) select-none"
                >
                  ⠿
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element --
                    pratinjau admin: sumbernya bisa blob: dari berkas yang baru
                    dipilih, yang tidak bisa dilalui pipeline next/image. */}
                <img
                  src={entry.preview}
                  alt=""
                  className="ink-border r-chip h-[64px] w-[64px] shrink-0 object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="micro text-(--soft)">
                    {index === 0 ? "Cover" : `Image ${index + 1}`}
                  </span>
                  {entry.file && (
                    <span className="font-tech text-[10px] text-(--soft)">
                      new upload
                    </span>
                  )}
                </div>

                <label className="flex flex-col gap-1">
                  <span className="sr-only">
                    Alt text for image {index + 1} of {legend}
                  </span>
                  <input
                    name={`${prefix}.${index}.alt`}
                    value={entry.alt}
                    onChange={(event) =>
                      patch(index, { alt: event.target.value })
                    }
                    placeholder="Alt text (required)"
                    aria-invalid={Boolean(
                      fieldErrors?.[`${prefix}.${index}.alt`],
                    )}
                    className={cn(
                      controlClass,
                      fieldErrors?.[`${prefix}.${index}.alt`] &&
                        "border-(--accent-ink)",
                    )}
                  />
                </label>
                {fieldErrors?.[`${prefix}.${index}.alt`] && (
                  <span
                    role="alert"
                    className="text-[11px] font-bold text-(--accent-ink)"
                  >
                    {fieldErrors[`${prefix}.${index}.alt`]}
                  </span>
                )}

                <label className="flex flex-col gap-1">
                  <span className="sr-only">
                    Caption for image {index + 1} of {legend}
                  </span>
                  <input
                    name={`${prefix}.${index}.caption`}
                    value={entry.caption}
                    onChange={(event) =>
                      patch(index, { caption: event.target.value })
                    }
                    placeholder="Caption (optional)"
                    className={controlClass}
                  />
                </label>
              </div>

              <div className="flex shrink-0 gap-1.5 sm:flex-col">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  aria-label={`Move image ${index + 1} up`}
                  className={iconButtonClass}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === entries.length - 1}
                  aria-label={`Move image ${index + 1} down`}
                  className={iconButtonClass}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove image ${index + 1}`}
                  className={cn(iconButtonClass, "text-(--soft)")}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
