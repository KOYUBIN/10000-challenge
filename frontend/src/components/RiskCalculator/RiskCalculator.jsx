import React, { useState } from 'react';
import { calcPositionSize, calcRR, kellyFraction } from '../../utils/kelly';
import { Calculator, AlertTriangle } from 'lucide-react';

export default function RiskCalculator() {
  const [bankroll, setBankroll] = useState('100');
  const [riskPct, setRiskPct] = useState('2');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [side, setSide] = useState('LONG');
  const [winRate, setWinRate] = useState('50');
  const [leverage, setLeverage] = useState('10');

  const ep = parseFloat(entryPrice);
  const sl = parseFloat(stopLoss);
  const tp = parseFloat(takeProfit);
  const br = parseFloat(bankroll) || 100;
  const rp = parseFloat(riskPct) / 100 || 0.02;
  const wr = parseFloat(winRate) / 100 || 0.5;

  const position = ep && sl ? calcPositionSize(br, rp, ep, sl) : null;
  const rr = ep && sl && tp ? calcRR(ep, sl, tp, side) : null;
  const kelly = rr ? kellyFraction(wr, rr) : null;

  const slPct = ep && sl ? (Math.abs(ep - sl) / ep * 100).toFixed(2) : null;
  const tpPct = ep && tp ? (Math.abs(tp - ep) / ep * 100).toFixed(2) : null;

  const effectiveLev = position ? position.effectiveLeverage.toFixed(2) : null;
  const isHighLev = effectiveLev && parseFloat(effectiveLev) > 10;

  const marginRequired = position && leverage
    ? ((position.qty * ep) / parseFloat(leverage)).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Calculator size={20} className="text-brand-500" />
        리스크 계산기
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">입력값</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">뱅크롤 ($)</label>
              <input className="input" type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">리스크 비율 (%)</label>
              <input className="input" type="number" step="0.5" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">방향</label>
            <div className="flex gap-2">
              {['LONG', 'SHORT'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    side === s
                      ? s === 'LONG' ? 'bg-success text-white' : 'bg-danger text-white'
                      : 'bg-dark-700 text-gray-400'
                  }`}
                >
                  {s === 'LONG' ? 'LONG (매수)' : 'SHORT (매도)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">진입가</label>
              <input className="input" type="number" step="any" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="60000" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">손절가 (SL)</label>
              <input className="input" type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="58000" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">익절가 (TP)</label>
              <input className="input" type="number" step="any" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="64000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">레버리지</label>
              <input className="input" type="number" value={leverage} onChange={(e) => setLeverage(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">승률 (%)</label>
              <input className="input" type="number" value={winRate} onChange={(e) => setWinRate(e.target.value)} />
            </div>
          </div>

          {/* 빠른 리스크 금액 */}
          <div>
            <p className="text-xs text-gray-500 mb-2">빠른 선택 (리스크 비율)</p>
            <div className="flex gap-2">
              {['1', '2', '3', '5', '10'].map((p) => (
                <button
                  key={p}
                  onClick={() => setRiskPct(p)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    riskPct === p ? 'bg-brand-500 text-black font-bold' : 'bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 결과 */}
        <div className="space-y-4">
          {position && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">포지션 계산 결과</h2>

              <div className="grid grid-cols-2 gap-3">
                <ResultItem label="리스크 금액" value={`$${position.riskAmount.toFixed(2)}`} color="danger" />
                <ResultItem label="주문 수량" value={position.qty.toFixed(6)} />
                {marginRequired && <ResultItem label="필요 증거금" value={`$${marginRequired}`} />}
                <ResultItem
                  label="유효 레버리지"
                  value={`${effectiveLev}x`}
                  color={isHighLev ? 'danger' : 'success'}
                />
              </div>

              {slPct && (
                <div className="flex gap-4 text-sm">
                  <span className="text-danger">SL: -{slPct}%</span>
                  {tpPct && <span className="text-success">TP: +{tpPct}%</span>}
                </div>
              )}

              {isHighLev && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-400">
                    유효 레버리지가 10배를 초과합니다. 포지션 규모를 줄이거나 손절가를 조정하세요.
                  </p>
                </div>
              )}
            </div>
          )}

          {rr !== null && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">손익비 분석</h2>
              <div className="grid grid-cols-2 gap-3">
                <ResultItem
                  label="손익비 (RR)"
                  value={`1:${rr.toFixed(2)}`}
                  color={rr >= 1.5 ? 'success' : rr >= 1 ? 'brand' : 'danger'}
                />
                {position && (
                  <ResultItem
                    label="기대 수익"
                    value={`$${(position.riskAmount * rr).toFixed(2)}`}
                    color="success"
                  />
                )}
              </div>
              {rr < 1.5 && (
                <p className="text-xs text-gray-500">
                  권장 손익비는 최소 1:1.5 이상입니다. 익절가를 조정해보세요.
                </p>
              )}
            </div>
          )}

          {kelly && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">켈리 공식 최적 비중</h2>
              <div className="grid grid-cols-3 gap-3">
                <ResultItem label="풀 켈리" value={`${(kelly.full * 100).toFixed(1)}%`} color={kelly.full > 0.2 ? 'danger' : 'success'} />
                <ResultItem label="하프 켈리 (권장)" value={`${(kelly.half * 100).toFixed(1)}%`} color="brand" />
                <ResultItem label="쿼터 켈리" value={`${(kelly.quarter * 100).toFixed(1)}%`} />
              </div>
              {kelly.full > 0 ? (
                <p className="text-xs text-gray-500">
                  현재 승률({winRate}%)과 손익비(1:{rr?.toFixed(2)}) 기준으로,
                  뱅크롤의 <strong className="text-brand-500">{(kelly.half * 100).toFixed(1)}%</strong>를 리스크로 잡는 것이 적정합니다.
                  = <strong className="text-white">${(br * kelly.half).toFixed(2)}</strong>
                </p>
              ) : (
                <p className="text-xs text-danger">현재 조건에서는 기대값이 마이너스입니다. 진입하지 마세요.</p>
              )}
            </div>
          )}

          {/* 연속 손실 시나리오 */}
          {position && (
            <div className="card">
              <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-3">연속 손실 시나리오</h2>
              <div className="space-y-2">
                {[3, 5, 10, 20].map((n) => {
                  let remaining = br;
                  for (let i = 0; i < n; i++) remaining -= remaining * rp;
                  const loss = ((1 - remaining / br) * 100).toFixed(1);
                  return (
                    <div key={n} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{n}연속 손절</span>
                      <div className="text-right">
                        <span className={parseFloat(loss) > 50 ? 'text-danger' : 'text-gray-300'}>
                          ${remaining.toFixed(2)} 남음 (-{loss}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultItem({ label, value, color }) {
  const colorMap = {
    success: 'text-success',
    danger: 'text-danger',
    brand: 'text-brand-500',
  };
  return (
    <div className="bg-dark-700 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${colorMap[color] || 'text-white'}`}>{value}</p>
    </div>
  );
}
