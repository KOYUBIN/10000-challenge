// 모든 API 호출은 Firebase SDK + Cloud Functions 사용
// 별도 백엔드 서버 불필요

import { auth, db, functions } from '../firebase';
import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  serverTimestamp, getDoc, getDocs, query,
  orderBy, where, setDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// ── 유저 프로필 ─────────────────────────────

export const api = {

  saveProfile: async ({ displayName, photoURL, initialBankroll, target } = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');

    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);

    const data = {
      displayName: displayName || user.displayName || user.email,
      photoURL: photoURL || user.photoURL || null,
      email: user.email,
      target: parseFloat(target) || 10000,
      updatedAt: serverTimestamp(),
    };

    if (!existing.exists()) {
      data.bankroll = parseFloat(initialBankroll) || 100;
      data.initialBankroll = parseFloat(initialBankroll) || 100;
      data.createdAt = serverTimestamp();

      await addDoc(collection(db, 'bankrollHistory'), {
        userId: user.uid,
        bankroll: data.bankroll,
        source: 'initial',
        createdAt: serverTimestamp(),
      });
    }

    await setDoc(userRef, data, { merge: true });
    return data;
  },

  getProfile: async () => {
    const user = auth.currentUser;
    if (!user) return null;
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
  },

  // ── 매매일지 ───────────────────────────────

  addTrade: async (tradeData) => {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');

    const ref = await addDoc(collection(db, 'trades'), {
      userId: user.uid,
      userName: user.displayName || user.email,
      symbol: (tradeData.symbol || '').toUpperCase(),
      side: tradeData.side,
      strategy: tradeData.strategy || '',
      riskAmount: parseFloat(tradeData.riskAmount) || 0,
      entryPrice: parseFloat(tradeData.entryPrice),
      stopLoss: parseFloat(tradeData.stopLoss),
      takeProfit: tradeData.takeProfit ? parseFloat(tradeData.takeProfit) : null,
      leverage: parseInt(tradeData.leverage) || 10,
      note: tradeData.note || '',
      imageUrl: tradeData.imageUrl || null,
      status: 'OPEN',
      pnl: null,
      closePrice: null,
      closedAt: null,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id };
  },

  closeTrade: async (id, { status, closePrice, pnl }) => {
    await updateDoc(doc(db, 'trades', id), {
      status,
      closePrice: parseFloat(closePrice) || null,
      pnl: parseFloat(pnl) || null,
      closedAt: serverTimestamp(),
    });
  },

  deleteTrade: async (id) => {
    await deleteDoc(doc(db, 'trades', id));
  },

  // ── 뱅크롤 ────────────────────────────────

  getBankrollSummary: async () => {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs
      .map((d) => {
        const data = d.data();
        const roi =
          data.bankroll && data.initialBankroll
            ? (((data.bankroll - data.initialBankroll) / data.initialBankroll) * 100).toFixed(2)
            : '0.00';
        return {
          uid: d.id,
          displayName: data.displayName,
          photoURL: data.photoURL,
          bankroll: data.bankroll || 0,
          initialBankroll: data.initialBankroll || 100,
          target: data.target || 10000,
          roi,
          updatedAt: data.updatedAt,
        };
      })
      .sort((a, b) => b.bankroll - a.bankroll);
  },

  getBankrollHistory: async () => {
    const user = auth.currentUser;
    if (!user) return [];
    const q = query(
      collection(db, 'bankrollHistory'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  updateBankroll: async (bankroll) => {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');
    const amount = parseFloat(bankroll);

    await updateDoc(doc(db, 'users', user.uid), {
      bankroll: amount,
      updatedAt: serverTimestamp(),
    });
    await addDoc(collection(db, 'bankrollHistory'), {
      userId: user.uid,
      bankroll: amount,
      source: 'manual',
      createdAt: serverTimestamp(),
    });
    return { bankroll: amount };
  },

  // ── 바이낸스 (Cloud Functions) ─────────────

  syncBinance: async (apiKey, apiSecret, saveKey = false) => {
    const fn = httpsCallable(functions, 'syncBinanceBalance');
    const result = await fn({ apiKey, apiSecret, saveKey });
    return result.data;
  },

  getOpenPositions: async (apiKey, apiSecret) => {
    const fn = httpsCallable(functions, 'getOpenPositions');
    const result = await fn({ apiKey, apiSecret });
    return result.data;
  },

  // ── 차트 (Cloud Functions) ─────────────────

  getKlines: async (symbol, interval, limit = 200) => {
    const fn = httpsCallable(functions, 'getKlines');
    const result = await fn({ symbol, interval, limit });
    return result.data;
  },
};
