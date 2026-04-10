import React from 'react';
import { Link } from 'react-router-dom';

function statusBadge(status) {
  const map = { OPEN: 'badge-open', WIN: 'badge-win', LOSE: 'badge-lose' };
  const labelMap = { OPEN: '진행중', WIN: '익절', LOSE: '손절' };
  return <span className={map[status] || 'badge-open'}>{labelMap[status] || status}</span>;
}

export default function RecentTrades({ trades }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">최근 매매</h2>
        <Link to="/trades" className="text-xs text-brand-500 hover:text-brand-400">
          전체보기 →
        </Link>
      </div>
      {trades.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">아직 매매 기록이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {trades.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className={t.side === 'LONG' ? 'badge-long' : 'badge-short'}>
                  {t.side}
                </span>
                <span className="font-medium text-sm">{t.symbol}</span>
                <span className="text-xs text-gray-500">@${t.entryPrice?.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                {t.pnl !== null && t.pnl !== undefined && (
                  <span className={`text-sm font-medium ${t.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                    {t.pnl >= 0 ? '+' : ''}{t.pnl?.toFixed(2)}$
                  </span>
                )}
                {statusBadge(t.status)}
                <span className="text-xs text-gray-500">{t.userName}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
