import axios from 'axios';

const cache = new Map();
const TTL = 1000 * 60 * 30; // 30 minutes

const key = (from, to) => `${from}->${to}`.toUpperCase();

// Primary free source: frankfurter.app (no key). Falls back to 1:1 on failure.
export const convert = async (amount, from = 'INR', to = 'INR') => {
  const fromCode = (from || 'INR').toUpperCase();
  const toCode = (to || 'INR').toUpperCase();
  if (fromCode === toCode) return Number(amount);
  const cacheKey = key(fromCode, toCode);
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > now) {
    return Number(amount) * cached.rate;
  }

  try {
    // Frankfurter supports limited currencies but covers majors; amount=1 to get direct rate.
    const url = `https://api.frankfurter.app/latest?amount=1&from=${fromCode}&to=${toCode}`;
    const res = await axios.get(url, { timeout: 5000 });
    const rate = Number(res.data?.rates?.[toCode]);
    if (Number.isFinite(rate) && rate > 0) {
      cache.set(cacheKey, { rate, expires: now + TTL });
      return Number(amount) * rate;
    }
  } catch (err) {
    console.warn('FX convert failed, falling back to 1:1', err?.message || err);
  }

  // Fallback to 1:1 to avoid crashing flows.
  return Number(amount);
};
