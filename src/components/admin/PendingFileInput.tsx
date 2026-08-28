"use client";

import { useEffect, useRef } from "react";

/**
 * Berkas tidak bisa ditaruh di state form biasa, jadi tiap berkas tertunda
 * punya input file tersembunyi yang isinya ditulis lewat DataTransfer.
 *
 * Penugasannya dijalankan setiap render, bukan sekali saja: React me-reset form
 * setelah server action selesai, yang mengosongkan `input.files` — dan tanpa
 * penugasan ulang, mencoba kirim lagi setelah validasi gagal akan mengirim
 * barisnya tanpa berkasnya.
 */
export default function PendingFileInput({
  name,
  file,
}: {
  name: string;
  file: File;
}) {
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
