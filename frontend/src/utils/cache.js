// localStorage 기반 캐시 유틸리티
// Cloud Functions 호출 비용 절감용

const DEFAULT_TTL = 5 * 60 * 1000; // 5분

export const cache = {
  get(key) {
    try {
      const raw = localStorage.getItem(`cache_${key}`);
      if (!raw) return null;
      const { data, expiry } = JSON.parse(raw);
      if (Date.now() > expiry) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  set(key, data, ttl = DEFAULT_TTL) {
    try {
      localStorage.setItem(
        `cache_${key}`,
        JSON.stringify({ data, expiry: Date.now() + ttl })
      );
    } catch {
      // localStorage 용량 초과 시 무시
    }
  },

  clear(key) {
    localStorage.removeItem(`cache_${key}`);
  },

  clearAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('cache_'))
      .forEach((k) => localStorage.removeItem(k));
  },
};

// 캐시를 사용하는 fetch 래퍼
// forceRefresh=true 이면 캐시 무시하고 새로 호출
export async function cachedCall(key, fn, ttl = DEFAULT_TTL, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cache.get(key);
    if (cached !== null) return cached;
  }
  const data = await fn();
  cache.set(key, data, ttl);
  return data;
}
