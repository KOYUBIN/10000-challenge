import React, { useState } from 'react';
import { X } from 'lucide-react';
import { calcPositionSize, calcRR } from '../../utils/kelly';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function AddTradeModal({ onClose, onSubmit }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    symbol: 'BTCUSDT',
    side: 'LONG',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    riskAmount: '',
    leverage: '10',
    strategy: '',
    note: '',
    imageUrl: '',
  });
  const [bankroll, setBankroll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 사용자 뱅크롤 로드
  React.useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid))).then((snap) => {
      snap.forEach((d) => setBankroll(d.data().bankroll));
    });
  }, [user]);

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const ep = parseFloat(form.entryPrice);
  const sl = parseFloat(form.stopLoss);
  const tp = parseFloat(form.takeProfit);
  const risk = parseFloat(form.riskAmount);

  const qty = ep && sl && risk && ep !== sl
    ? (risk / Math.abs(ep - sl)).toFixed(6)
    : null;

  const rr = ep && sl && tp
    ? calcRR(ep, sl, tp, form.side).toFixed(2)
    : null;

  const effectiveLeverage = bankroll && qty && ep
    ? ((parseFloat(qty) * ep) / bankroll).toFixed(2)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({ ...form });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 overflow-auto">
      <div className="card w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">매매 기록 추가</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">심볼</label>
              <input className="input" value={form.symbol} onChange={f('symbol')} placeholder="BTCUSDT" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">방향</label>
              <select className="input" value={form.side} onChange={f('side')}>
                <option value="LONG">LONG (매수)</option>
                <option value="SHORT">SHORT (매도)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">진입가</label>
              <input className="input" type="number" step="any" value={form.entryPrice} onChange={f('entryPrice')} placeholder="60000" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">손절가 (SL)</label>
              <input className="input" type="number" step="any" value={form.stopLoss} onChange={f('stopLoss')} placeholder="58000" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">익절가 (TP)</label>
              <input className="input" type="number" step="any" value={form.takeProfit} onChange={f('takeProfit')} placeholder="64000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">리스크 금액 ($)</label>
              <input className="input" type="number" step="any" value={form.riskAmount} onChange={f('riskAmount')} placeholder="5" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">레버리지</label>
              <input className="input" type="number" value={form.leverage} onChange={f('leverage')} placeholder="10" />
            </div>
          </div>

          {/* 자동 계산 */}
          {(qty || rr || effectiveLeverage) && (
            <div className="flex gap-4 p-3 bg-dark-700 rounded-lg text-sm">
              {qty && <div><p className="text-xs text-gray-500">주문 수량</p><p className="font-medium">{qty}</p></div>}
              {rr && <div><p className="text-xs text-gray-500">손익비</p><p className="font-medium text-success">1:{rr}</p></div>}
              {effectiveLeverage && (
                <div>
                  <p className="text-xs text-gray-500">유효 레버리지</p>
                  <p className={`font-medium ${parseFloat(effectiveLeverage) > 10 ? 'text-danger' : 'text-success'}`}>
                    {effectiveLeverage}x
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">전략 / 진입 근거</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.strategy}
              onChange={f('strategy')}
              placeholder="왜 들어갔는지 적어보세요..."
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">메모</label>
            <input className="input" value={form.note} onChange={f('note')} placeholder="추가 메모" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">차트 이미지 URL (선택)</label>
            <input className="input" value={form.imageUrl} onChange={f('imageUrl')} placeholder="https://..." />
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">취소</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
