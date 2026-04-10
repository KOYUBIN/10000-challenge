const express = require('express');
const router = express.Router();
const { getDb, admin } = require('../services/firebaseService');
const { verifyToken } = require('../middleware/auth');
const { getFuturesBalance, getOpenPositions } = require('../services/binanceService');

// 전체 유저 뱅크롤 요약 (리더보드)
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('users').get();
    const summary = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      summary.push({
        uid: doc.id,
        displayName: data.displayName,
        photoURL: data.photoURL,
        bankroll: data.bankroll || 0,
        initialBankroll: data.initialBankroll || 100,
        target: data.target || 10000,
        roi: data.bankroll
          ? (((data.bankroll - data.initialBankroll) / data.initialBankroll) * 100).toFixed(2)
          : '0.00',
        updatedAt: data.updatedAt,
      });
    });
    summary.sort((a, b) => b.bankroll - a.bankroll);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 내 뱅크롤 히스토리
router.get('/history', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('bankrollHistory')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'asc')
      .get();
    const history = [];
    snapshot.forEach((doc) => history.push({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 수동 뱅크롤 업데이트
router.post('/update', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { bankroll } = req.body;
    if (!bankroll || isNaN(bankroll))
      return res.status(400).json({ error: '유효한 금액을 입력해주세요.' });

    const amount = parseFloat(bankroll);

    // 유저 문서 업데이트
    await db.collection('users').doc(req.user.uid).set(
      {
        bankroll: amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 히스토리 기록
    await db.collection('bankrollHistory').add({
      userId: req.user.uid,
      bankroll: amount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, bankroll: amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 바이낸스 API로 자동 뱅크롤 동기화
router.post('/sync-binance', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { apiKey, apiSecret } = req.body;
    if (!apiKey || !apiSecret)
      return res.status(400).json({ error: 'API 키와 시크릿을 입력해주세요.' });

    const balance = await getFuturesBalance(apiKey, apiSecret);
    const positions = await getOpenPositions(apiKey, apiSecret);

    const totalBalance = balance.walletBalance + balance.unrealizedProfit;

    await db.collection('users').doc(req.user.uid).set(
      {
        bankroll: totalBalance,
        walletBalance: balance.walletBalance,
        unrealizedProfit: balance.unrealizedProfit,
        availableBalance: balance.availableBalance,
        openPositionsCount: positions.length,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await db.collection('bankrollHistory').add({
      userId: req.user.uid,
      bankroll: totalBalance,
      source: 'binance',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ balance, positions });
  } catch (err) {
    res.status(500).json({ error: `바이낸스 연동 실패: ${err.message}` });
  }
});

module.exports = router;
