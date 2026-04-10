import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Plus, Filter } from 'lucide-react';
import TradeCard from './TradeCard';
import AddTradeModal from './AddTradeModal';
import CloseTradeModal from './CloseTradeModal';

export default function TradeJournal() {
  const { user, getToken } = useAuth();
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL | OPEN | WIN | LOSE | MY
  const [showAdd, setShowAdd] = useState(false);
  const [closing, setClosing] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'trades'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setTrades(list);
    });
    return unsub;
  }, []);

  const filtered = trades.filter((t) => {
    if (filter === 'MY') return t.userId === user?.uid;
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const handleAdd = async (data) => {
    await api.addTrade(data, getToken);
    setShowAdd(false);
  };

  const handleClose = async (id, data) => {
    await api.closeTrade(id, data, getToken);
    setClosing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await api.deleteTrade(id, getToken);
  };

  const stats = {
    total: trades.length,
    open: trades.filter((t) => t.status === 'OPEN').length,
    win: trades.filter((t) => t.status === 'WIN').length,
    lose: trades.filter((t) => t.status === 'LOSE').length,
  };
  const winRate = stats.win + stats.lose > 0
    ? ((stats.win / (stats.win + stats.lose)) * 100).toFixed(1)
    : '-';
  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">매매일지</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          기록 추가
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '전체 거래', value: stats.total },
          { label: '승률', value: `${winRate}%`, color: 'text-success' },
          { label: '진행중', value: stats.open, color: 'text-blue-400' },
          {
            label: '총 손익',
            value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`,
            color: totalPnl >= 0 ? 'text-success' : 'text-danger',
          },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color || 'text-white'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-500" />
        {['ALL', 'MY', 'OPEN', 'WIN', 'LOSE'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-brand-500 text-black'
                : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            {f === 'ALL' ? '전체' : f === 'MY' ? '내 거래' : f === 'OPEN' ? '진행중' : f === 'WIN' ? '익절' : '손절'}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>표시할 매매 기록이 없습니다.</p>
          <p className="text-xs mt-1">첫 번째 매매를 기록해보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TradeCard
              key={t.id}
              trade={t}
              isOwner={t.userId === user?.uid}
              onClose={() => setClosing(t)}
              onDelete={() => handleDelete(t.id)}
            />
          ))}
        </div>
      )}

      {showAdd && <AddTradeModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}
      {closing && (
        <CloseTradeModal
          trade={closing}
          onClose={() => setClosing(null)}
          onSubmit={(data) => handleClose(closing.id, data)}
        />
      )}
    </div>
  );
}
