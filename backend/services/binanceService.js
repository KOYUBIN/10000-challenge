const Binance = require('binance-api-node').default;

let client;

function getBinanceClient(apiKey, apiSecret) {
  if (!client) {
    client = Binance({
      apiKey: apiKey || process.env.BINANCE_API_KEY,
      apiSecret: apiSecret || process.env.BINANCE_API_SECRET,
    });
  }
  return client;
}

// 선물 지갑 잔고 (USDT)
async function getFuturesBalance(apiKey, apiSecret) {
  const c = getBinanceClient(apiKey, apiSecret);
  const info = await c.futuresAccountInfo();
  const usdt = info.assets.find((a) => a.asset === 'USDT');
  return {
    walletBalance: parseFloat(usdt?.walletBalance || 0),
    unrealizedProfit: parseFloat(usdt?.unrealizedProfit || 0),
    availableBalance: parseFloat(info.availableBalance || 0),
  };
}

// 현재 열린 포지션
async function getOpenPositions(apiKey, apiSecret) {
  const c = getBinanceClient(apiKey, apiSecret);
  const positions = await c.futuresPositionRisk();
  return positions
    .filter((p) => parseFloat(p.positionAmt) !== 0)
    .map((p) => ({
      symbol: p.symbol,
      positionAmt: parseFloat(p.positionAmt),
      entryPrice: parseFloat(p.entryPrice),
      markPrice: parseFloat(p.markPrice),
      unRealizedProfit: parseFloat(p.unRealizedProfit),
      liquidationPrice: parseFloat(p.liquidationPrice),
      leverage: parseInt(p.leverage),
      side: parseFloat(p.positionAmt) > 0 ? 'LONG' : 'SHORT',
    }));
}

// K라인 (캔들) 데이터
async function getKlines(symbol = 'BTCUSDT', interval = '1h', limit = 200) {
  const c = getBinanceClient();
  const candles = await c.futuresCandles({ symbol, interval, limit });
  return candles.map((c) => ({
    time: c.openTime / 1000,
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close),
    volume: parseFloat(c.volume),
  }));
}

// 심볼 현재가
async function getPrice(symbol = 'BTCUSDT') {
  const c = getBinanceClient();
  const ticker = await c.futuresPrices();
  return parseFloat(ticker[symbol] || 0);
}

module.exports = { getFuturesBalance, getOpenPositions, getKlines, getPrice };
