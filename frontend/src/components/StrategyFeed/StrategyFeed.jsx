import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import TradingChart from '../Chart/TradingChart';
import { Search } from 'lucide-react';

export default function StrategyFeed() {
  const [trades, setTrades] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [chartInterval, setChartInterval] = useState('1h');

  useEffect(() => {
    const q = query(collection(db, 'trades'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = { id: d.id, ...d.data() };
        if (data.strategy) list.push(data); // 전략 있는 것만 피드에 표시
      });
      setTrades(list);
    });
    return unsub;
  }, []);

  const filtered = trades.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.strategy?.toLowerCase().includes(search.toLowerCase()) ||
      t.userName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">전략 피드</h1>

      {/* 차트 */}
      <TradingChart
        symbol={selectedSymbol}
        interval={chartInterval}
        onSymbolChange={setSelectedSymbol}
        onIntervalChange={setChartInterval}
      />

      {/* 검색 */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input pl-9"
          placeholder="심볼, 전략, 작성자 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 전략 카드 목록 */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          전략을 공유한 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((t) => (
            <StrategyCard key={t.id} trade={t} onViewChart={() => setSelectedSymbol(t.symbol)} />
          ))}
        </div>
      )}
    </div>
  );
}

function fmtTs(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StrategyCard({ trade: t, onViewChart }) {
  const rr = t.stopLoss && t.takeProfit
    ? (Math.abs(t.takeProfit - t.entryPrice) / Math.abs(t.entryPrice - t.stopLoss)).toFixed(2)
    : null;

  return (
    <div className="card space-y-3">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={t.side === 'LONG' ? 'badge-long' : 'badge-short'}>{t.side}</span>
          <button
            onClick={onViewChart}
            className="font-semibold text-brand-500 hover:text-brand-400 transition-colors"
          >
            {t.symbol}
          </button>
          <span className="text-sm text-gray-400">
            진입 ${t.entryPrice?.toLocaleString()}
          </span>
          {rr && (
            <span className="text-xs bg-dark-700 px-2 py-0.5 rounded text-gray-400">
              RR 1:{rr}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs ${
            t.status === 'OPEN' ? 'text-blue-400' : t.status === 'WIN' ? 'text-success' : 'text-danger'
          }`}>
            {t.status === 'OPEN' ? '진행중' : t.status === 'WIN' ? '✅ 익절' : '❌ 손절'}
          </span>
          {t.pnl !== null && t.pnl !== undefined && (
            <p className={`text-sm font-bold ${t.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
              {t.pnl >= 0 ? '+' : ''}${t.pnl?.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* 전략 */}
      <div className="bg-dark-700 rounded-lg p-3">
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{t.strategy}</p>
      </div>

      {/* 가격 정보 */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {t.stopLoss && <span className="text-danger">SL ${t.stopLoss?.toLocaleString()}</span>}
        {t.takeProfit && <span className="text-success">TP ${t.takeProfit?.toLocaleString()}</span>}
        {t.riskAmount > 0 && <span>리스크 ${t.riskAmount?.toFixed(2)}</span>}
        <span>{t.leverage}x</span>
      </div>

      {t.imageUrl && (
        <img src={t.imageUrl} alt="차트" className="w-full rounded-lg border border-dark-600" />
      )}

      {/* 작성자 & 시간 */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-dark-700">
        <span>{t.userName || '익명'}</span>
        <span>{fmtTs(t.createdAt)}</span>
      </div>
    </div>
  );
}
