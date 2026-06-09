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
      <div
        className="
        relative
        bg-(--foreground)
        rounded-(--button-radius)
        p-0
      "
      >
        <div
          className="
          flex items-center justify-center
          bg-(--background)
          border-2 border-(--foreground)
          rounded-(--button-radius)
          p-2          
          translate-x-0
          translate-y-0
          transition-transform duration-200 ease-out
          group-hover:-translate-x-1
          group-hover:-translate-y-1
        "
        >
          <div className="relative w-10 h-10">
            <Image
              src="/logo.webp"
              alt="Kid Studio Logo"
              fill
              priority
              sizes="32px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
