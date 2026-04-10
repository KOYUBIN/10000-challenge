const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}, getToken) {
  const token = getToken ? await getToken() : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '요청 실패');
  return data;
}

export const api = {
  // 유저
  saveProfile: (body, getToken) =>
    request('/api/users/profile', { method: 'POST', body: JSON.stringify(body) }, getToken),
  getProfile: (getToken) => request('/api/users/profile', {}, getToken),

  // 매매일지
  getTrades: (getToken) => request('/api/trades', {}, getToken),
  addTrade: (body, getToken) =>
    request('/api/trades', { method: 'POST', body: JSON.stringify(body) }, getToken),
  closeTrade: (id, body, getToken) =>
    request(`/api/trades/${id}/close`, { method: 'PATCH', body: JSON.stringify(body) }, getToken),
  deleteTrade: (id, getToken) =>
    request(`/api/trades/${id}`, { method: 'DELETE' }, getToken),

  // 뱅크롤
  getBankrollSummary: (getToken) => request('/api/bankroll/summary', {}, getToken),
  getBankrollHistory: (getToken) => request('/api/bankroll/history', {}, getToken),
  updateBankroll: (bankroll, getToken) =>
    request('/api/bankroll/update', { method: 'POST', body: JSON.stringify({ bankroll }) }, getToken),
  syncBinance: (apiKey, apiSecret, getToken) =>
    request(
      '/api/bankroll/sync-binance',
      { method: 'POST', body: JSON.stringify({ apiKey, apiSecret }) },
      getToken
    ),

  // 차트
  getKlines: (symbol, interval, limit) =>
    request(`/api/chart/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`),
  getPrice: (symbol) => request(`/api/chart/price/${symbol}`),
};
