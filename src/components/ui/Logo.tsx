"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function Logo() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  return (
    <Link 
      href={`/${locale}`} 
      aria-label="Back to home" 
      className="group inline-block outline-none"
    >
      {/* LAPISAN BAWAH (Warna Aksen / Bayangan Solid) */}
      <div className="
        relative
        bg-(--accent) 
        rounded-(--button-radius)
        p-0
      ">
        {/* LAPISAN ATAS (Kontainer Logo Utama) */}
        <div className="
          flex items-center justify-center
          bg-(--background)
          border-2 border-(--foreground)
          rounded-(--button-radius)
          p-2
          
          /* KONDISI AWAL: Flat (Posisi 0, menutupi bayangan sepenuhnya) */
          translate-x-0
          translate-y-0
          
          /* Transisi untuk pergerakan halus saat hover */
          transition-transform duration-200 ease-out
          
          /* HOVER: Terangkat ke kiri-atas agar bayangan muncul di kanan-bawah */
          group-hover:-translate-x-1
          group-hover:-translate-y-1
        ">
          <div className="relative w-10 h-10">
            <Image
              src="/logo.webp"
              alt="Kid Studio Logo"
              fill
              priority
              sizes="32px"
              /* Logo orisinil (tanpa invert) */
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}