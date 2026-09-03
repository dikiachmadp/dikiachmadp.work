"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import Markdown from "@/components/logbook/Markdown";
import { MAX_BODY_BYTES } from "@/schemas/admin";
import { cn } from "@/lib/utils";

/**
 * Textarea Markdown dengan toolbar penyisip sintaks dan panel pratinjau.
 *
 * Pratinjaunya merender lewat `<Markdown>` yang sama persis dengan halaman
 * publik. Jalur render kedua yang "mirip" adalah cara paling mudah membuat
 * pratinjau berbohong tentang hasil akhirnya.
 */

type Tool =
  | { label: string; title: string; wrap: [string, string]; sample: string }
  | { label: string; title: string; linePrefix: string; sample: string };

const TOOLS: Tool[] = [
  { label: "B", title: "Bold", wrap: ["**", "**"], sample: "bold text" },
  { label: "H2", title: "Heading", linePrefix: "## ", sample: "Heading" },
  { label: "•—", title: "Bullet list", linePrefix: "- ", sample: "List item" },
  { label: "1—", title: "Numbered list", linePrefix: "1. ", sample: "First" },
  { label: "❝", title: "Quote", linePrefix: "> ", sample: "Quoted line" },
  { label: "</>", title: "Inline code", wrap: ["`", "`"], sample: "code" },
  {
    label: "Link",
    title: "Link",
    wrap: ["[", "](https://example.com)"],
    sample: "link text",
  },
];

type Edit = { value: string; start: number; end: number };

/** Perluas seleksi ke batas baris penuh, supaya prefix per-baris rapi. */
function lineRange(
  value: string,
  start: number,
  end: number,
): [number, number] {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  return [from, lineEnd === -1 ? value.length : lineEnd];
}

function applyTool(
  tool: Tool,
  value: string,
  start: number,
  end: number,
): Edit {
  if ("linePrefix" in tool) {
    const [from, to] = lineRange(value, start, end);
    const target = value.slice(from, to) || tool.sample;
    const prefixed = target
      .split("\n")
      .map((line) => `${tool.linePrefix}${line}`)
      .join("\n");
    return {
      value: value.slice(0, from) + prefixed + value.slice(to),
      start: from + tool.linePrefix.length,
      end: from + prefixed.length,
    };
  }

  const [open, close] = tool.wrap;
  const target = value.slice(start, end) || tool.sample;
  return {
    value: value.slice(0, start) + open + target + close + value.slice(end),
    start: start + open.length,
    end: start + open.length + target.length,
  };
}

const controlClass =
  "r-chip ink-border w-full bg-(--wash) px-[15px] py-3 text-[14px] outline-none placeholder:text-(--soft)";

export default function MarkdownEditor({
  name,
  label,
  context,
  defaultValue,
  value: controlledValue,
  onValueChange,
  required = true,
  error,
  rows = 14,
}: {
  name: string;
  label: string;
  /**
   * Bahasa yang sedang disunting. Form ini memuat dua editor sekaligus, jadi
   * "Body" saja membuat dua textarea, dua toolbar, dan dua tombol pratinjau
   * bernama sama persis — pembaca layar tidak punya cara membedakannya.
   */
  context: string;
  /** Jalur tak terkendali: nilai awal dipegang komponen ini sendiri. */
  defaultValue?: string;
  /**
   * Jalur terkendali. Dipakai form yang perlu menulis isi textarea ini dari
   * luar — tombol "salin ke bahasa lain" di ProductForm tidak bisa melakukan
   * itu lewat DOM, karena React akan menimpanya lagi di render berikutnya.
   */
  value?: string;
  onValueChange?: (next: string) => void;
  /** Body produk boleh kosong; body logbook tidak. */
  required?: boolean;
  error?: string;
  rows?: number;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const value = controlledValue ?? internalValue;
  const setValue = (next: string) => {
    if (onValueChange) onValueChange(next);
    else setInternalValue(next);
  };
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<[number, number] | null>(null);
  const previewId = useId();
  const fieldId = useId();

  // Seleksi dipulihkan setelah React menulis ulang nilai textarea; tanpa ini
  // kursor melompat ke ujung tiap kali tombol toolbar ditekan.
  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    if (!selection || !textareaRef.current) return;
    pendingSelection.current = null;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(selection[0], selection[1]);
  }, [value]);

  const runTool = (tool: Tool) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const edit = applyTool(
      tool,
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
    );
    pendingSelection.current = [edit.start, edit.end];
    setValue(edit.value);
  };

  const bytes = new TextEncoder().encode(value).length;
  const overLimit = bytes > MAX_BODY_BYTES;
  const hasInlineImage = value.includes("![");

  return (
    <div className="flex flex-col gap-[7px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={fieldId} className="micro">
          {label}
          {required && <span className="text-(--accent-ink)"> *</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowPreview((open) => !open)}
          aria-expanded={showPreview}
          aria-controls={previewId}
          aria-label={`${showPreview ? "Hide preview of" : "Preview"} ${context} ${label.toLowerCase()}`}
          className="r-tag ink-border lift-chip cursor-pointer px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase"
        >
          {showPreview ? "Hide preview" : "Preview"}
        </button>
      </div>

      <div
        role="toolbar"
        aria-label={`${context} ${label.toLowerCase()} formatting`}
        className="flex flex-wrap gap-1.5"
      >
        {TOOLS.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            aria-label={tool.title}
            onClick={() => runTool(tool)}
            className="r-tag ink-border lift-chip font-tech min-w-[34px] cursor-pointer bg-(--wash) px-2 py-1.5 text-[11px] font-bold"
          >
            {tool.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        id={fieldId}
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={Boolean(error)}
        className={cn(
          controlClass,
          "font-tech resize-y text-[13px] leading-[1.6]",
          error && "border-(--accent-ink)",
        )}
      />

      <div className="flex flex-wrap justify-between gap-2 text-[11px] text-(--soft)">
        <span>
          Markdown (GFM). Images go in the gallery below, not in the body.
        </span>
        <span
          className={cn(
            "font-tech",
            overLimit && "font-bold text-(--accent-ink)",
          )}
        >
          {(bytes / 1024).toFixed(1)} / {MAX_BODY_BYTES / 1024} kB
        </span>
      </div>

      {/* Dua aturan yang ditolak server, ditunjukkan sebelum submit supaya
          admin tidak kehilangan satu putaran penuh untuk mengetahuinya. */}
      {hasInlineImage && (
        <span
          role="alert"
          className="text-[11px] font-bold text-(--accent-ink)"
        >
          Inline Markdown images (`![…]`) are not supported — use the gallery.
        </span>
      )}
      {error && (
        <span
          role="alert"
          className="text-[11px] font-bold text-(--accent-ink)"
        >
          {error}
        </span>
      )}

      <div id={previewId} hidden={!showPreview}>
        {showPreview && (
          <div className="r-card ink-border mt-1.5 bg-(--paper) p-5">
            <p className="micro m-0 mb-3 text-(--soft)">Preview</p>
            {value.trim() ? (
              <Markdown>{value}</Markdown>
            ) : (
              <p className="m-0 text-[14px] text-(--soft)">
                Nothing to preview yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
