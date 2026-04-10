require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const { initFirebase, getDb, admin } = require('./services/firebaseService');
const { getFuturesBalance } = require('./services/binanceService');

const app = express();
const PORT = process.env.PORT || 4000;

// Firebase 초기화
initFirebase();

// 미들웨어
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// 라우트
app.use('/api/trades', require('./routes/trades'));
app.use('/api/bankroll', require('./routes/bankroll'));
app.use('/api/chart', require('./routes/chart'));
app.use('/api/users', require('./routes/users'));

// 헬스체크
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Cron: 10분마다 바이낸스 API 키가 등록된 유저들의 뱅크롤 자동 업데이트
cron.schedule('*/10 * * * *', async () => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('users')
      .where('binanceApiKey', '!=', null)
      .get();

    for (const doc of snapshot.docs) {
      const user = doc.data();
      if (!user.binanceApiKey || !user.binanceApiSecret) continue;

      try {
        const balance = await getFuturesBalance(user.binanceApiKey, user.binanceApiSecret);
        const total = balance.walletBalance + balance.unrealizedProfit;

        await db.collection('users').doc(doc.id).update({
          bankroll: total,
          walletBalance: balance.walletBalance,
          unrealizedProfit: balance.unrealizedProfit,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await db.collection('bankrollHistory').add({
          userId: doc.id,
          bankroll: total,
          source: 'cron',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        console.error(`[Cron] 유저 ${doc.id} 업데이트 실패:`, e.message);
      }
    }
    console.log('[Cron] 뱅크롤 자동 업데이트 완료');
  } catch (err) {
    console.error('[Cron] 오류:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
