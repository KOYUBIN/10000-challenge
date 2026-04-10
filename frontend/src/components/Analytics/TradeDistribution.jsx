import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

export default function TradeDistribution({ trades, myUid }) {
  const myTrades = trades.filter((t) => t.userId === myUid);

  // 코인별 집계
  const bySymbol = useMemo(() => {
    const map = {};
    myTrades.forEach((t) => {
      if (!map[t.symbol]) map[t.symbol] = { symbol: t.symbol, total: 0, win: 0, lose: 0, pnl: 0 };
      map[t.symbol].total++;
      if (t.status === 'WIN') map[t.symbol].win++;
      if (t.status === 'LOSE') map[t.symbol].lose++;
      map[t.symbol].pnl += t.pnl || 0;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [myTrades]);

  // 요일별 집계
  const byDay = useMemo(() => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const map = {};
    days.forEach((d) => (map[d] = { day: d, win: 0, lose: 0, pnl: 0 }));
    myTrades.forEach((t) => {
      if (!t.createdAt) return;
      const d = t.createdAt.toDate
        ? t.createdAt.toDate()
        : new Date(t.createdAt.seconds * 1000);
      const day = days[d.getDay()];
      if (t.status === 'WIN') map[day].win++;
      if (t.status === 'LOSE') map[day].lose++;
      map[day].pnl += t.pnl || 0;
    });
    return days.map((d) => map[d]);
  }, [myTrades]);

  // 손익 분포 (히스토그램)
  const pnlDist = useMemo(() => {
    const closed = myTrades.filter((t) => t.pnl !== null && t.pnl !== undefined);
    if (!closed.length) return [];
    const buckets = {};
    closed.forEach((t) => {
      const bucket = Math.round(t.pnl / 5) * 5;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    return Object.entries(buckets)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([pnl, count]) => ({ pnl: `$${pnl}`, count }));
  }, [myTrades]);

  if (myTrades.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-500">
        분석할 매매 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 코인별 */}
      <div className="card">
        <h3 className="font-semibold mb-4">코인별 거래 현황</h3>
        <div className="space-y-3">
          {bySymbol.map((s) => {
            const wr = s.win + s.lose > 0 ? (s.win / (s.win + s.lose) * 100).toFixed(0) : '-';
            return (
              <div key={s.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-medium text-sm w-20">{s.symbol}</span>
                  <div className="flex-1 bg-dark-600 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 bg-success rounded-full"
                      style={{ width: `${s.win + s.lose > 0 ? (s.win / (s.win + s.lose) * 100) : 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-3 text-sm shrink-0">
                  <span className="text-gray-400">{s.total}회</span>
                  <span className="text-success">{wr}%</span>
                  <span className={s.pnl >= 0 ? 'text-success' : 'text-danger'}>
                    {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 요일별 */}
        <div className="card">
          <h3 className="font-semibold mb-4">요일별 손익</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                formatter={(v) => [`$${v?.toFixed(2)}`, '손익']}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {byDay.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PNL 분포 */}
        {pnlDist.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-4">손익 분포</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pnlDist} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="pnl" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  formatter={(v) => [v, '거래 수']}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
