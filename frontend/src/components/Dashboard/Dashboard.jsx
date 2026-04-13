import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { cachedCall } from '../../utils/cache';
import { RefreshCw } from 'lucide-react';
import BankrollCard from './BankrollCard';
import BankrollChart from './BankrollChart';
import Leaderboard from '../Leaderboard/Leaderboard';
import RecentTrades from './RecentTrades';
import BinanceSyncModal from './BinanceSyncModal';

const PROFILE_TTL  = 5  * 60_000; // 5분
const HISTORY_TTL  = 10 * 60_000; // 10분
const LEADER_TTL   = 10 * 60_000; // 10분

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile]       = useState(null);
  const [history, setHistory]       = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [showSync, setShowSync]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadData(false); // 최초 로드 - 캐시 우선

    // 매매일지는 Firestore 실시간 구독 (무료 읽기 범위)
    const q = query(collection(db, 'trades'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const trades = [];
      snap.forEach((d) => trades.push({ id: d.id, ...d.data() }));
      setRecentTrades(trades.slice(0, 5));
    });
    return unsub;
  }, [user]);

  async function loadData(forceRefresh = false) {
    forceRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [prof, hist, lb] = await Promise.all([
        cachedCall('dashboard_profile',  () => api.getProfile(),           PROFILE_TTL,  forceRefresh).catch(() => null),
        cachedCall('dashboard_history',  () => api.getBankrollHistory(),   HISTORY_TTL,  forceRefresh).catch(() => []),
        cachedCall('dashboard_leader',   () => api.getBankrollSummary(),   LEADER_TTL,   forceRefresh).catch(() => []),
      ]);
      setProfile(prof);
      setHistory(hist);
      setLeaderboard(lb);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">데이터 로딩 중...</div>;
  }

  const bankroll       = profile?.bankroll      || 100;
  const target         = profile?.target        || 10000;
  const initialBankroll = profile?.initialBankroll || 100;
  const progress       = Math.min((bankroll / target) * 100, 100);
  const roi            = (((bankroll - initialBankroll) / initialBankroll) * 100).toFixed(2);
  const fmtTime        = (d) => d ? `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')} 기준` : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">대시보드</h1>
          {lastUpdated && (
            <span className="text-xs text-gray-600">{fmtTime(lastUpdated)}</span>
          )}
          {/* 새로고침 버튼 - 누를 때만 Firestore 재호출 */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="데이터 새로고침"
            className="text-gray-500 hover:text-brand-500 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <button onClick={() => setShowSync(true)} className="btn-ghost text-sm">
          바이낸스 동기화
        </button>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <BankrollChart history={history} bankroll={bankroll} target={target} />
        </div>
        <div>
          <Leaderboard data={leaderboard} myUid={user?.uid} />
        </div>
      </div>

      <RecentTrades trades={recentTrades} />

      {showSync && (
        <BinanceSyncModal
          onClose={() => setShowSync(false)}
          onSync={async (apiKey, apiSecret, saveKey) => {
            await api.syncBinance(apiKey, apiSecret, saveKey);
            setShowSync(false);
            loadData(true); // 동기화 후 강제 새로고침
          }}
        />
      )}
    </div>
  );
}

function ProgressBar({ pct }) {
  return (
    <div className="w-full bg-dark-600 rounded-full h-1.5 mt-1">
      <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
