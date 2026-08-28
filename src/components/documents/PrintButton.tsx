"use client";

import Button from "@/components/ui/Button";

/**
 * Jalan menuju PDF di sini adalah dialog cetak peramban, bukan penghasil PDF
 * di sisi peladen. Alasannya bukan sekadar hemat dependensi: setiap pustaka PDF
 * berarti menulis ulang seluruh tata letak dokumen dalam sistem gaya yang
 * berbeda, dan hasilnya cuma bisa *mendekati* tampilan situs. Dengan mencetak
 * halaman yang sama, PDF-nya dijamin tidak pernah melenceng dari dokumen yang
 * dilihat pembeli — dan aturan cetaknya hidup di globals.css bersama sisa tema.
 */
export default function PrintButton({ label }: { label: string }) {
  return (
    <Button
      onClick={() => window.print()}
      variant="secondary"
      size="sm"
      className="r-chip print:hidden"
    >
      {label}
    </Button>
  );
}
