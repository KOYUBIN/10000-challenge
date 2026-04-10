import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, CheckCircle } from 'lucide-react';

function fmtTs(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  return d.toLocaleDateString('ko-KR');
}

export default function TradeCard({ trade: t, isOwner, onClose, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const rr = t.stopLoss && t.takeProfit
    ? (Math.abs(t.takeProfit - t.entryPrice) / Math.abs(t.entryPrice - t.stopLoss)).toFixed(2)
    : null;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={t.side === 'LONG' ? 'badge-long' : 'badge-short'}>{t.side}</span>
          <span className="font-semibold">{t.symbol}</span>
          <span className="text-sm text-gray-400">진입 ${t.entryPrice?.toLocaleString()}</span>
          {t.stopLoss && <span className="text-xs text-danger">SL ${t.stopLoss?.toLocaleString()}</span>}
          {t.takeProfit && <span className="text-xs text-success">TP ${t.takeProfit?.toLocaleString()}</span>}
          {rr && <span className="text-xs text-gray-500">RR 1:{rr}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {t.pnl !== null && t.pnl !== undefined ? (
              <p className={`font-bold ${t.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                {t.pnl >= 0 ? '+' : ''}${t.pnl?.toFixed(2)}
              </p>
            ) : (
              t.riskAmount > 0 && (
                <p className="text-xs text-gray-500">리스크 ${t.riskAmount?.toFixed(2)}</p>
              )
            )}
            <span className={`text-xs ${
              t.status === 'OPEN' ? 'text-blue-400' : t.status === 'WIN' ? 'text-success' : 'text-danger'
            }`}>
              {t.status === 'OPEN' ? '진행중' : t.status === 'WIN' ? '익절' : '손절'}
            </span>
          </div>
          {isOwner && t.status === 'OPEN' && (
            <button
              onClick={onClose}
              title="결과 입력"
              className="text-gray-400 hover:text-success transition-colors"
            >
              <CheckCircle size={18} />
            </button>
          )}
          {isOwner && (
            <button onClick={onDelete} title="삭제" className="text-gray-400 hover:text-danger transition-colors">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-white">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-dark-600 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <InfoItem label="작성자" value={t.userName || '-'} />
            <InfoItem label="레버리지" value={`${t.leverage || '-'}x`} />
            <InfoItem label="리스크 금액" value={t.riskAmount ? `$${t.riskAmount?.toFixed(2)}` : '-'} />
            <InfoItem label="날짜" value={fmtTs(t.createdAt)} />
          </div>
          {t.strategy && (
            <div>
              <p className="text-xs text-gray-500 mb-1">전략</p>
              <p className="text-sm text-gray-300 bg-dark-700 rounded-lg p-3">{t.strategy}</p>
            </div>
          )}
          {t.note && (
            <div>
              <p className="text-xs text-gray-500 mb-1">메모</p>
              <p className="text-sm text-gray-300 bg-dark-700 rounded-lg p-3">{t.note}</p>
            </div>
          )}
          {t.imageUrl && (
            <img
              src={t.imageUrl}
              alt="차트 스크린샷"
              className="w-full rounded-lg border border-dark-600"
            />
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-200 mt-0.5">{value}</p>
    </div>
  );
}
