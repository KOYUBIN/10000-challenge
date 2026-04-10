const express = require('express');
const router = express.Router();
const { getDb, admin } = require('../services/firebaseService');
const { verifyToken } = require('../middleware/auth');

// 매매일지 전체 조회 (그룹 내 공유)
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('trades')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    const trades = [];
    snapshot.forEach((doc) => trades.push({ id: doc.id, ...doc.data() }));
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 내 매매일지만 조회
router.get('/my', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('trades')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    const trades = [];
    snapshot.forEach((doc) => trades.push({ id: doc.id, ...doc.data() }));
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 매매일지 등록
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const {
      symbol,
      side,
      strategy,
      riskAmount,
      entryPrice,
      stopLoss,
      takeProfit,
      leverage,
      note,
      imageUrl,
    } = req.body;

    if (!symbol || !side || !entryPrice || !stopLoss) {
      return res.status(400).json({ error: '필수 항목을 입력해주세요.' });
    }

    const trade = {
      userId: req.user.uid,
      userName: req.user.name || req.user.email,
      symbol: symbol.toUpperCase(),
      side, // LONG | SHORT
      strategy: strategy || '',
      riskAmount: parseFloat(riskAmount) || 0,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      leverage: parseInt(leverage) || 10,
      note: note || '',
      imageUrl: imageUrl || null,
      status: 'OPEN', // OPEN | WIN | LOSE
      pnl: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      closedAt: null,
    };

    const docRef = await db.collection('trades').add(trade);
    res.status(201).json({ id: docRef.id, ...trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 매매 결과 업데이트 (WIN/LOSE)
router.patch('/:id/close', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { status, closePrice, pnl } = req.body;
    const doc = await db.collection('trades').doc(req.params.id).get();

    if (!doc.exists) return res.status(404).json({ error: '거래를 찾을 수 없습니다.' });
    if (doc.data().userId !== req.user.uid)
      return res.status(403).json({ error: '권한이 없습니다.' });

    await db.collection('trades').doc(req.params.id).update({
      status,
      closePrice: parseFloat(closePrice) || null,
      pnl: parseFloat(pnl) || null,
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 매매일지 삭제
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('trades').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: '거래를 찾을 수 없습니다.' });
    if (doc.data().userId !== req.user.uid)
      return res.status(403).json({ error: '권한이 없습니다.' });

    await db.collection('trades').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
