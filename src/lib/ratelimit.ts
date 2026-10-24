import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

// Dibuat malas (lazy) dan dipakai ulang. Mengonstruksi Redis di module scope
// membuat modul ini melempar saat di-import, bukan saat dipanggil — error yang
// muncul jauh dari penyebabnya dan bisa menggagalkan build.
let redis: Redis | undefined;

function getRedis(): Redis {
  redis ??= new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
    // Default-nya 5 percobaan ulang dengan backoff eksponensial — sekitar 4,3
    // detik tidur sebelum menyerah. Untuk host yang memang sudah tidak ada,
    // itu empat detik yang dihabiskan di depan orang yang sedang menekan
    // tombol Login. Satu percobaan ulang tetap disisakan untuk gangguan
    // sekejap yang nyata.
    retry: { retries: 2, backoff: (attempt) => attempt * 100 },
  });
  return redis;
}

/**
 * Kunci rate limit dari IP klien.
 *
 * `x-forwarded-for` berformat daftar (`klien, proxy1, proxy2`); memakainya utuh
 * berarti satu klien bisa menempati bucket berbeda-beda dan jatah tidak pernah
 * habis. Yang dihitung hanya entri pertama — IP klien asli.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Keputusan limiter. `degraded` menandai limiternya yang tidak bisa dihubungi,
 * bukan jatah yang habis — dua hal yang jawabannya ke klien seharusnya beda.
 */
export type LimitDecision = { allowed: boolean; degraded: boolean };

/**
 * Menanyakan satu keputusan rate limit tanpa bisa menjatuhkan pemanggilnya.
 *
 * `limit()` menembak Upstash lewat jaringan dan sebelum ini tidak ada yang
 * menangkapnya. Satu host Upstash yang hilang sudah cukup membuat server action
 * login melempar 500: login mati total, dan Supabase tidak pernah tersentuh
 * sama sekali. Opsi `timeout` bawaan @upstash/ratelimit tidak menolong di kasus
 * itu — `limit()` me-race panggilan asli melawan timer fail-open, dan sebuah
 * reject menang dalam race itu. Jadi yang dilindungi timeout cuma request yang
 * menggantung, sedangkan ENOTFOUND, 404, dan 401 gagal seketika.
 *
 * `failOpen` default-nya benar karena mayoritas pemanggil di sini memakai rate
 * limit sebagai pertahanan *kedua*: di belakang login masih ada rate limit sisi
 * server Supabase Auth dan `ADMIN_EMAILS` yang dicek di tiga tempat. Untuk
 * situs satu orang, login yang mati total jauh lebih buruk daripada jatah yang
 * bolong selama gangguan. Pengecualiannya form kontak — di sana limiter ini
 * satu-satunya penjaga, jadi pemanggilnya mematikan `failOpen` sendiri.
 *
 * Yang dimaafkan hanya kegagalan infrastruktur. Keputusan `success: false` yang
 * asli — jatah yang benar-benar habis — diteruskan utuh dan tidak pernah
 * ditandai `degraded`.
 */
export async function allowRequest(
  limiter: Pick<Ratelimit, "limit">,
  key: string,
  { failOpen = true }: { failOpen?: boolean } = {},
): Promise<LimitDecision> {
  try {
    const { success } = await limiter.limit(key);
    return { allowed: success, degraded: false };
  } catch (error) {
    // `key` sengaja tidak dicatat: untuk limiter per-akun isinya alamat email.
    console.error(
      `Rate limit tidak bisa dihubungi, fail-${failOpen ? "open" : "closed"}:`,
      error,
    );
    return { allowed: failOpen, degraded: true };
  }
}

let contactLimiter: Ratelimit | undefined;
let checkoutLimiter: Ratelimit | undefined;
let loginLimiter: Ratelimit | undefined;
let loginEmailLimiter: Ratelimit | undefined;

/** Form kontak publik: 3 kiriman per jam per IP. */
export function getContactLimiter(): Ratelimit {
  contactLimiter ??= new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "ratelimit:contact",
  });
  return contactLimiter;
}

/**
 * Pembuatan sesi checkout: 10 per 10 menit per IP.
 *
 * Jauh lebih longgar dari form kontak karena mencoba beberapa nominal sebelum
 * benar-benar jadi itu perilaku yang wajar, bukan penyalahgunaan. Yang
 * dijaga di sini kuota API Polar, bukan spam — uangnya sendiri sudah dilindungi
 * Polar.
 */
export function getCheckoutLimiter(): Ratelimit {
  checkoutLimiter ??= new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, "10 m"),
    prefix: "ratelimit:checkout",
  });
  return checkoutLimiter;
}

/** Login admin: 5 percobaan per 15 menit per IP. */
export function getLoginLimiter(): Ratelimit {
  loginLimiter ??= new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "ratelimit:login",
  });
  return loginLimiter;
}

/**
 * Login admin: 10 percobaan per 15 menit per email.
 *
 * Batas per-IP saja tidak menahan penebak password yang berpindah-pindah IP —
 * dan IP itu murah. Kunci per akun membuat serangan tetap terhenti berapa pun
 * jumlah sumber yang dipakai. Jatahnya lebih longgar dari batas IP supaya admin
 * yang lupa password dari satu jaringan tidak terkunci lebih cepat dari
 * sebelumnya.
 */
export function getLoginEmailLimiter(): Ratelimit {
  loginEmailLimiter ??= new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    prefix: "ratelimit:login-email",
  });
  return loginEmailLimiter;
}
