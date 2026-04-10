import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import RoRSimulator from './RoRSimulator';
import KellyOptimizer from './KellyOptimizer';
import TradeDistribution from './TradeDistribution';
import { BarChart2 } from 'lucide-react';

export default function Analytics() {
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [tab, setTab] = useState('ror');

  useEffect(() => {
    const q = query(collection(db, 'trades'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setTrades(list);
    });
    return unsub;
  }, []);

  const myTrades = trades.filter((t) => t.userId === user?.uid && t.status !== 'OPEN');
  const wins = myTrades.filter((t) => t.status === 'WIN');
  const loses = myTrades.filter((t) => t.status === 'LOSE');
  const winRate = myTrades.length > 0 ? wins.length / myTrades.length : 0.5;

  const avgWin = wins.length > 0
    ? wins.reduce((s, t) => s + (t.pnl || 0), 0) / wins.length
    : 0;
  const avgLose = loses.length > 0
    ? Math.abs(loses.reduce((s, t) => s + (t.pnl || 0), 0) / loses.length)
    : 0;
  const rr = avgLose > 0 ? avgWin / avgLose : 2;

  const tabs = [
    { id: 'ror', label: '파산 확률 시뮬레이터' },
    { id: 'kelly', label: '켈리 최적화' },
    { id: 'dist', label: '코인별 분석' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <BarChart2 size={20} className="text-brand-500" />
        분석
      </h1>

      {/* 내 실제 통계 */}
      {myTrades.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">내 실제 통계</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '총 거래', value: myTrades.length },
              { label: '승률', value: `${(winRate * 100).toFixed(1)}%`, color: 'text-success' },
              { label: '평균 수익', value: `$${avgWin.toFixed(2)}`, color: 'text-success' },
              { label: '평균 손실', value: `$${avgLose.toFixed(2)}`, color: 'text-danger' },
            ].map((s) => (
              <div key={s.label} className="bg-dark-700 rounded-lg p-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-lg font-bold mt-1 ${s.color || 'text-white'}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 bg-dark-700 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-sm px-4 py-2 rounded-md transition-colors ${
              tab === t.id ? 'bg-dark-800 text-white font-medium' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ror' && <RoRSimulator defaultWinRate={winRate * 100} defaultRR={rr} />}
      {tab === 'kelly' && <KellyOptimizer defaultWinRate={winRate * 100} defaultRR={rr} />}
      {tab === 'dist' && <TradeDistribution trades={trades} myUid={user?.uid} />}
    </div>
  );
}
