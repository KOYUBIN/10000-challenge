import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import BankrollCard from './BankrollCard';
import BankrollChart from './BankrollChart';
import Leaderboard from '../Leaderboard/Leaderboard';
import RecentTrades from './RecentTrades';
import BinanceSyncModal from './BinanceSyncModal';

export default function Dashboard() {
  const { user, getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [showSync, setShowSync] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();

    // 실시간 매매일지 구독
    const q = query(collection(db, 'trades'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const trades = [];
      snap.forEach((d) => trades.push({ id: d.id, ...d.data() }));
      setRecentTrades(trades.slice(0, 5));
    });
    return unsub;
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [prof, hist, lb] = await Promise.all([
        api.getProfile(getToken).catch(() => null),
        api.getBankrollHistory(getToken).catch(() => []),
        api.getBankrollSummary(getToken).catch(() => []),
      ]);
      setProfile(prof);
      setHistory(hist);
      setLeaderboard(lb);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        데이터 로딩 중...
      </div>
    );
  }

  const bankroll = profile?.bankroll || 100;
  const target = profile?.target || 10000;
  const initialBankroll = profile?.initialBankroll || 100;
  const progress = Math.min((bankroll / target) * 100, 100);
  const roi = (((bankroll - initialBankroll) / initialBankroll) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">대시보드</h1>
        <button onClick={() => setShowSync(true)} className="btn-ghost text-sm">
          바이낸스 동기화
        </button>
      </div>

      {/* 뱅크롤 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BankrollCard
          label="현재 뱅크롤"
          value={`$${bankroll.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`목표: $${target.toLocaleString()}`}
          color="brand"
        />
        <BankrollCard
          label="수익률 (ROI)"
          value={`${roi}%`}
          sub={`초기: $${initialBankroll}`}
          color={parseFloat(roi) >= 0 ? 'success' : 'danger'}
        />
        <BankrollCard
          label="챌린지 달성률"
          value={`${progress.toFixed(1)}%`}
          sub={<ProgressBar pct={progress} />}
          color="blue"
        />
        <BankrollCard
          label="목표까지"
          value={`$${Math.max(0, target - bankroll).toLocaleString('en', { maximumFractionDigits: 0 })}`}
          sub="남은 금액"
          color="gray"
        />
      </div>

      {/* 차트 + 리더보드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <BankrollChart history={history} bankroll={bankroll} target={target} />
        </div>
        <div>
          <Leaderboard data={leaderboard} myUid={user?.uid} />
        </div>
      </div>

      {/* 최근 매매 */}
      <RecentTrades trades={recentTrades} />

      {showSync && (
        <BinanceSyncModal
          onClose={() => setShowSync(false)}
          onSync={async (apiKey, apiSecret) => {
            await api.syncBinance(apiKey, apiSecret, getToken);
            setShowSync(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function ProgressBar({ pct }) {
  return (
    <div className="w-full bg-dark-600 rounded-full h-1.5 mt-1">
      <div
        className="bg-brand-500 h-1.5 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
