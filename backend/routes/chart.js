const express = require('express');
const router = express.Router();
const { getKlines, getPrice } = require('../services/binanceService');

// K라인 캔들 데이터
router.get('/klines', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', interval = '1h', limit = 200 } = req.query;
    const data = await getKlines(symbol, interval, parseInt(limit));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 현재가
router.get('/price/:symbol', async (req, res) => {
  try {
    const price = await getPrice(req.params.symbol.toUpperCase());
    res.json({ symbol: req.params.symbol.toUpperCase(), price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
