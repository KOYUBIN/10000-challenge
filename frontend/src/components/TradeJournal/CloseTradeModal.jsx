import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function CloseTradeModal({ trade, onClose, onSubmit }) {
  const [status, setStatus] = useState('WIN');
  const [closePrice, setClosePrice] = useState('');
  const [pnl, setPnl] = useState('');
  const [loading, setLoading] = useState(false);

  // 자동 PNL 계산
  const autoPnl = () => {
    const cp = parseFloat(closePrice);
    const ep = parseFloat(trade.entryPrice);
    if (!cp || !ep || !trade.riskAmount) return;
    const priceDiff = Math.abs(cp - ep);
    const slDiff = Math.abs(ep - trade.stopLoss);
    if (slDiff === 0) return;
    const qty = trade.riskAmount / slDiff;
    const rawPnl = trade.side === 'LONG' ? (cp - ep) * qty : (ep - cp) * qty;
    setPnl(rawPnl.toFixed(2));
    setStatus(rawPnl >= 0 ? 'WIN' : 'LOSE');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ status, closePrice, pnl: parseFloat(pnl) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">결과 입력 - {trade.symbol}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            {['WIN', 'LOSE'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  status === s
                    ? s === 'WIN' ? 'bg-success text-white' : 'bg-danger text-white'
                    : 'bg-dark-700 text-gray-400'
                }`}
              >
                {s === 'WIN' ? '익절' : '손절'}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">청산가</label>
            <input
              className="input"
              type="number"
              step="any"
              value={closePrice}
              onChange={(e) => setClosePrice(e.target.value)}
              onBlur={autoPnl}
              placeholder="청산 가격"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">실현 손익 ($)</label>
            <input
              className="input"
              type="number"
              step="any"
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              placeholder="자동 계산 또는 직접 입력"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">취소</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? '저장...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
