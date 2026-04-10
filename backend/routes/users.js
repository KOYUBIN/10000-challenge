const express = require('express');
const router = express.Router();
const { getDb, admin } = require('../services/firebaseService');
const { verifyToken } = require('../middleware/auth');

// 유저 프로필 등록/업데이트 (로그인 후 최초 호출)
router.post('/profile', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { displayName, photoURL, initialBankroll, target } = req.body;

    const userRef = db.collection('users').doc(req.user.uid);
    const doc = await userRef.get();

    const data = {
      displayName: displayName || req.user.name || req.user.email,
      photoURL: photoURL || req.user.picture || null,
      email: req.user.email,
      target: parseFloat(target) || 10000,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!doc.exists) {
      data.bankroll = parseFloat(initialBankroll) || 100;
      data.initialBankroll = parseFloat(initialBankroll) || 100;
      data.createdAt = admin.firestore.FieldValue.serverTimestamp();

      // 첫 뱅크롤 히스토리 기록
      await db.collection('bankrollHistory').add({
        userId: req.user.uid,
        bankroll: data.bankroll,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await userRef.set(data, { merge: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 유저 프로필 조회
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    res.json({ uid: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
