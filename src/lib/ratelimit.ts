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

let contactLimiter: Ratelimit | undefined;
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
