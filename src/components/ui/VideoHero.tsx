/**
 * Komponen VideoHero dasar.
 * Berfungsi untuk menampilkan video hero sebagai elemen visual utama.
 */
export default function VideoHero() {
  return (
    <div className="relative w-full overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
        {/* Pesan fallback jika browser tidak mendukung elemen video */}
        Your browser does not support the video tag.
      </video>
    </div>
  );
}