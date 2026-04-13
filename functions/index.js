const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Binance = require('binance-api-node').default;

admin.initializeApp();
const db = admin.firestore();

// ─────────────────────────────────────────────
// 바이낸스 잔고 동기화 (사이트에서 버튼 클릭 시)
// ─────────────────────────────────────────────
exports.syncBinanceBalance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const { apiKey, apiSecret, saveKey = false } = data;
  if (!apiKey || !apiSecret) {
    throw new functions.https.HttpsError('invalid-argument', 'API Key와 Secret을 입력해주세요.');
  }

  try {
    const client = Binance({ apiKey, apiSecret });
    const info = await client.futuresAccountInfo();
    const usdt = info.assets.find((a) => a.asset === 'USDT');

    const walletBalance = parseFloat(usdt?.walletBalance || 0);
    const unrealizedProfit = parseFloat(usdt?.unrealizedProfit || 0);
    const total = walletBalance + unrealizedProfit;

    const userUpdate = {
      bankroll: total,
      walletBalance,
      unrealizedProfit,
      availableBalance: parseFloat(info.availableBalance || 0),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 자동 동기화를 위해 키 저장 옵션
    if (saveKey) {
      userUpdate.binanceApiKey = apiKey;
      userUpdate.binanceApiSecret = apiSecret;
    }

    await db.collection('users').doc(context.auth.uid).set(userUpdate, { merge: true });

    await db.collection('bankrollHistory').add({
      userId: context.auth.uid,
      bankroll: total,
      source: 'manual_sync',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, balance: total, walletBalance, unrealizedProfit };
  } catch (err) {
    throw new functions.https.HttpsError('internal', `바이낸스 연동 실패: ${err.message}`);
  }
});

// ─────────────────────────────────────────────
// 열린 포지션 조회
// ─────────────────────────────────────────────
exports.getOpenPositions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const { apiKey, apiSecret } = data;
  if (!apiKey || !apiSecret) {
    throw new functions.https.HttpsError('invalid-argument', 'API Key와 Secret을 입력해주세요.');
  }

  try {
    const client = Binance({ apiKey, apiSecret });
    const positions = await client.futuresPositionRisk();
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
  } catch (err) {
    throw new functions.https.HttpsError('internal', `포지션 조회 실패: ${err.message}`);
  }
});

// ─────────────────────────────────────────────
// 캔들 차트 데이터 (공개 API - 인증 불필요)
// ─────────────────────────────────────────────
exports.getKlines = functions.https.onCall(async (data) => {
  const { symbol = 'BTCUSDT', interval = '1h', limit = 200 } = data;

  try {
    const client = Binance({});
    const candles = await client.futuresCandles({ symbol, interval, limit });
    return candles.map((c) => ({
      time: c.openTime / 1000,
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close),
      volume: parseFloat(c.volume),
    }));
  } catch (err) {
    throw new functions.https.HttpsError('internal', `차트 데이터 로드 실패: ${err.message}`);
  }
});

// ─────────────────────────────────────────────
// 자동 동기화 - 10분마다 실행 (Cron)
// API 키를 저장한 유저들의 뱅크롤 자동 업데이트
// ─────────────────────────────────────────────
exports.scheduledBankrollSync = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async () => {
    const snapshot = await db
      .collection('users')
      .where('binanceApiKey', '!=', null)
      .get();

    const updates = snapshot.docs.map(async (docSnap) => {
      const user = docSnap.data();
      if (!user.binanceApiKey || !user.binanceApiSecret) return;

      try {
        const client = Binance({
          apiKey: user.binanceApiKey,
          apiSecret: user.binanceApiSecret,
        });
        const info = await client.futuresAccountInfo();
        const usdt = info.assets.find((a) => a.asset === 'USDT');
        const total =
          parseFloat(usdt?.walletBalance || 0) +
          parseFloat(usdt?.unrealizedProfit || 0);

        await db.collection('users').doc(docSnap.id).update({
          bankroll: total,
          walletBalance: parseFloat(usdt?.walletBalance || 0),
          unrealizedProfit: parseFloat(usdt?.unrealizedProfit || 0),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await db.collection('bankrollHistory').add({
          userId: docSnap.id,
          bankroll: total,
          source: 'auto_sync',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[AutoSync] ${docSnap.id}: $${total}`);
      } catch (e) {
        console.error(`[AutoSync] ${docSnap.id} 실패:`, e.message);
      }
    });

    await Promise.allSettled(updates);
    return null;
  });
