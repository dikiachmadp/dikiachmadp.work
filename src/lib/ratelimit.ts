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

let contactLimiter: Ratelimit | undefined;
let loginLimiter: Ratelimit | undefined;

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
