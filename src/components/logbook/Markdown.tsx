import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renderer Markdown GFM untuk badan tulisan Logbook.
 *
 * **Tanpa `rehype-raw`, dan itu disengaja.** react-markdown merender ke elemen
 * React, bukan `dangerouslySetInnerHTML`; tanpa rehype-raw, HTML mentah di
 * dalam Markdown diperlakukan sebagai teks biasa. XSS lewat `<script>` atau
 * atribut `on*` tertutup secara desain, tanpa sanitizer yang harus dirawat.
 * `urlTransform` bawaan react-markdown menutup sisanya: `javascript:` dan
 * `data:` pada href/src dibuang.
 *
 * Komponen yang sama dipakai pratinjau di dasbor dan halaman publik — dua jalur
 * render yang bisa menyimpang adalah cara termudah membuat pratinjau berbohong.
 */

function isExternal(href: string | undefined): boolean {
  return Boolean(href && /^https?:\/\//i.test(href));
}

const components: Components = {
  h1: ({ children }) => (
    <h2 className="font-hand mt-9 mb-3 text-[clamp(1.5rem,4vw,1.875rem)] leading-tight first:mt-0">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="font-hand mt-9 mb-3 text-[clamp(1.375rem,3.5vw,1.625rem)] leading-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-hand mt-7 mb-2.5 text-[clamp(1.25rem,3vw,1.4375rem)] leading-tight first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-hand mt-6 mb-2 text-[1.1875rem] leading-tight first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="m-justify my-4 text-[15px] leading-[1.75] first:mt-0 last:mb-0">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      // rel wajib pada tautan yang membuka tab baru; target hanya untuk
      // tautan keluar supaya navigasi internal tidak menyebar tab.
      {...(isExternal(href)
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="font-semibold text-(--accent-ink) underline underline-offset-[3px]"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-4 flex list-disc flex-col gap-1.5 pl-6 text-[15px] leading-[1.7]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 flex list-decimal flex-col gap-1.5 pl-6 text-[15px] leading-[1.7]">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="r-card ink-border my-5 bg-(--wash) px-5 py-1 text-[15px] italic">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-8 border-0 border-t-2 border-dashed border-(--line)" />
  ),
  code: ({ className, children, ...props }) => {
    // react-markdown menandai blok kode dengan className `language-*`; tanpa
    // itu ini kode sebaris.
    const isBlock = typeof className === "string" && className.length > 0;
    return (
      <code
        {...props}
        className={cn(
          "font-tech text-[13px]",
          !isBlock && "r-tag ink-border bg-(--wash) px-1.5 py-0.5",
        )}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    // Blok kode panjang menggulir di dalam kotaknya sendiri — body tidak boleh
    // pernah menggulir horizontal.
    <pre className="r-card ink-border my-5 overflow-x-auto bg-(--wash) p-4 text-[13px] leading-[1.6]">
      {children}
    </pre>
  ),
  // Aturan yang sama untuk tabel: pembungkus yang menggulir, bukan halaman.
  table: ({ children }) => (
    <div className="ink-border r-card my-5 overflow-x-auto">
      <table className="w-full border-collapse text-[14px]">{children}</table>
    </div>
  ),
  th: ({ children, style }) => (
    <th
      style={style}
      className="border-b-2 border-(--line) px-3.5 py-2.5 text-left font-bold whitespace-nowrap"
    >
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td
      style={style}
      className="border-b border-dashed border-(--line) px-3.5 py-2.5 align-top"
    >
      {children}
    </td>
  ),
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
};

export default function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-[68ch]", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
