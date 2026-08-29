const API_BASE_URL = 'https://api.frankfurter.dev/v2';
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getRate(from, to) {
  if (from === to) {
    return {
      rate: 1,
      date: new Date().toISOString().slice(0, 10)
    };
  }

  const cacheKey = `rate:${from}:${to}`;
  const cached = await chrome.storage.local.get(cacheKey);
  const cachedRate = cached[cacheKey];

  if (
    cachedRate &&
    Date.now() - cachedRate.fetchedAt < CACHE_TTL_MS
  ) {
    return cachedRate.data;
  }

  const response = await fetch(
    `${API_BASE_URL}/rate/${from}/${to}`
  );

  if (!response.ok) {
    throw new Error(
      `Exchange rate request failed: ${response.status}`
    );
  }

  const data = await response.json();
  const result = {
    rate: data.rate,
    date: data.date
  };

  await chrome.storage.local.set({
    [cacheKey]: {
      fetchedAt: Date.now(),
      data: result
    }
  });

  return result;
}
