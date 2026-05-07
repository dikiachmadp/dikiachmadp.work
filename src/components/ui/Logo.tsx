import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

/**
 * Komponen Logo dasar.
 * Menampilkan gambar logo yang dibungkus dengan Link untuk kembali ke halaman utama.
 */
export default function Logo() {
  const params = useParams();
  const locale = params?.locale as string || "en";

  return (
    <Link href={`/${locale}`} aria-label="Back to home">
      <div className="relative w-12 h-12">
        <Image
          src="/logo.webp"
          alt="Kid Studio Logo"
          fill
          priority
          sizes="48px"
          className="object-contain"
        />
      </div>
    </Link>
  );
}