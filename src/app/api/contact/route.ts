// src/app/api/contact/route.ts
// Backend endpoint untuk menangani pengiriman form kontak

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Membaca data JSON yang dikirim dari ContactForm.tsx
    const body = await request.json();
    
    // Logika pengiriman email atau penyimpanan database akan diletakkan di sini.
    // Contoh untuk melihat data di terminal server:
    console.log('📬 Pesan baru diterima:', body);

    // Simulasi delay jaringan (opsional, untuk melihat state loading di UI)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mengembalikan response sukses ke frontend
    return NextResponse.json(
      { message: 'Pesan berhasil dikirim!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error memproses form kontak:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}