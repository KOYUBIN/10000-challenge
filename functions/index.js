const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// ─────────────────────────────────────────────
// 바이낸스 REST API 직접 호출 헬퍼
// ─────────────────────────────────────────────
function binanceRequest(path, params, apiKey, apiSecret) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams({
      ...params,
      timestamp: Date.now(),
    }).toString();

    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    const url = `/fapi/v2/${path}?${queryString}&signature=${signature}`;

    const options = {
      hostname: 'fapi.binance.com',
      path: url,
      method: 'GET',
      headers: { 'X-MBX-APIKEY': apiKey },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.code && parsed.code < 0) {
            reject(new Error(`바이낸스 오류 ${parsed.code}: ${parsed.msg}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error('응답 파싱 실패: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('바이낸스 요청 타임아웃'));
    });
    req.end();
  });
}

// 공개 API (서명 불필요)
function binancePublicRequest(path, params) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const options = {
      hostname: 'fapi.binance.com',
      path: `/fapi/v1/${path}?${queryString}`,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('응답 파싱 실패'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('타임아웃'));
    });
    req.end();
  });
}

// ─────────────────────────────────────────────
// 바이낸스 잔고 동기화
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
    const account = await binanceRequest('account', {}, apiKey, apiSecret);

    const usdt = (account.assets || []).find((a) => a.asset === 'USDT');
    const walletBalance = parseFloat(usdt?.walletBalance || 0);
    const unrealizedProfit = parseFloat(usdt?.unrealizedProfit || 0);
    const total = walletBalance + unrealizedProfit;

    const userUpdate = {
      bankroll: total,
      walletBalance,
      unrealizedProfit,
      availableBalance: parseFloat(account.availableBalance || 0),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

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
    console.error('[syncBinanceBalance] 오류:', err.message);
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
    const positions = await binanceRequest('positionRisk', {}, apiKey, apiSecret);
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
    console.error('[getOpenPositions] 오류:', err.message);
    throw new functions.https.HttpsError('internal', `포지션 조회 실패: ${err.message}`);
  }
});

// ─────────────────────────────────────────────
// 캔들 차트 데이터 (공개 API)
// ─────────────────────────────────────────────
exports.getKlines = functions.https.onCall(async (data) => {
  const { symbol = 'BTCUSDT', interval = '1h', limit = 200 } = data;

  try {
    const candles = await binancePublicRequest('klines', { symbol, interval, limit });
    return candles.map((c) => ({
      time: c[0] / 1000,
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
  } catch (err) {
    console.error('[getKlines] 오류:', err.message);
    throw new functions.https.HttpsError('internal', `차트 데이터 로드 실패: ${err.message}`);
  }
});

// ─────────────────────────────────────────────
// 자동 동기화 Cron (10분마다)
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
        const account = await binanceRequest('account', {}, user.binanceApiKey, user.binanceApiSecret);
        const usdt = (account.assets || []).find((a) => a.asset === 'USDT');
        const total =
          parseFloat(usdt?.walletBalance || 0) + parseFloat(usdt?.unrealizedProfit || 0);

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
