"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Bilah beli yang menempel saat kartu beli tidak lagi terlihat.
 *
 * Ini satu-satunya penambahan yang paling terasa mengubah halaman ini dari
 * artikel jadi toko: di halaman jualan sepanjang ini, pembaca menghabiskan
 * sebagian besar waktunya di wilayah yang dulu sama sekali tidak punya harga
 * maupun tombol di layar.
 *
 * Tombolnya berupa tautan jangkar ke `#buy`, bukan pemicu checkout kedua. Dua
 * `BuyPanel` di satu halaman berarti dua kemungkinan sesi checkout terbuka
 * bersamaan, dan panel tip yang satu tidak tahu isi panel yang lain. Sebagai
 * bonus, tautan jangkar tetap berfungsi tanpa JavaScript.
 *
 * Di ponsel bilahnya berlabuh di bawah, bukan di atas: ibu jari ada di sana,
 * dan ruang di bawah navbar terlalu sempit untuk dipakai berdua.
 *
 * Dipasang di <body> lewat portal, dan itu bukan kemewahan. `PageWrapper`
 * memakai `.anim-rise`, yang animasinya ber-`fill-mode: both` sehingga
 * meninggalkan `transform: matrix(1,0,0,1,0,0)` — matriks identitas, tapi tetap
 * bukan `none`. Nilai transform apa pun selain `none` menjadikan elemennya
 * containing block bagi keturunan `position: fixed`, jadi bilah ini akan
 * berlabuh ke pembungkus halaman dan ikut tergulir alih-alih menempel di layar.
 * Alasan yang sejenis dengan portal pada dialog zoom.
 */
export default function StickyBuyBar({
  title,
  price,
  image,
  label,
}: {
  title: string;
  price: string | null;
  image: string | null;
  label: string;
}) {
  const [visible, setVisible] = useState(false);
  // Penjaga hidrasi yang sama dengan DarkModeToggle: menyimpulkan "sudah di
  // peramban" tanpa menulis state dari dalam effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const target = document.getElementById("buy");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      // Ambang nol: bilahnya muncul begitu piksel terakhir kartu beli lewat,
      // bukan saat kartunya sudah lama hilang.
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // `createPortal` menyentuh `document`, jadi render pertama (di server dan saat
  // hidrasi) harus menghasilkan hal yang sama: tidak ada apa-apa.
  if (!mounted) return null;

  return createPortal(
    <div
      id="sticky-buy"
      // `aria-hidden` saat tersembunyi: bilahnya tetap ada di DOM supaya
      // transisinya mulus, tapi pembaca layar tidak boleh menemukan tombol
      // yang tidak terlihat.
      aria-hidden={!visible}
      className={cn(
        "ink-border fixed right-0 left-0 z-40 bg-(--paper) print:hidden",
        "bottom-0 border-x-0 border-b-0 md:top-(--nav-h) md:bottom-auto md:border-x-0 md:border-t-0 md:border-b-2",
        "transition-transform duration-300 ease-out",
        visible
          ? "translate-y-0"
          : // Digeser keluar layar sepenuhnya, bukan sekadar ke balik navbar.
            // Karena bilah ini anak <body> lewat portal, ia berada di konteks
            // penumpukan yang berbeda dari navbar dan tetap tergambar di
            // atasnya betapa pun rendah z-index-nya — jadi "tersembunyi" harus
            // benar-benar berarti di luar layar. Di ponsel `bottom-0` +
            // `translate-y-full` sudah memenuhi itu dengan sendirinya.
            "pointer-events-none translate-y-full md:-translate-y-[calc(100%+var(--nav-h))]",
      )}
    >
      <div className="main-container flex items-center gap-3.5 py-2.5">
        {image && (
          <div className="r-chip ink-border relative hidden aspect-square w-11 shrink-0 overflow-hidden bg-(--wash) sm:block">
            <Image
              src={image}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="font-hand truncate text-[17px] leading-[1.15]">
            {title}
          </div>
          {price && (
            <div className="font-tech text-[11px] tracking-[0.12em] text-(--soft)">
              {price}
            </div>
          )}
        </div>

        <a
          href="#buy"
          tabIndex={visible ? undefined : -1}
          className="r-btn ink-border flat-3 lift-btn inline-flex shrink-0 cursor-pointer items-center justify-center bg-(--accent) px-5 py-2.5 text-[13px] font-bold tracking-[0.03em] whitespace-nowrap text-white"
        >
          {label}
        </a>
      </div>
    </div>,
    document.body,
  );
}
