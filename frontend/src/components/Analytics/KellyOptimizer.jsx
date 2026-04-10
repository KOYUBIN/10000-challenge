import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { kellyFraction } from '../../utils/kelly';

export default function KellyOptimizer({ defaultWinRate = 50, defaultRR = 2 }) {
  const [winRate, setWinRate] = useState(String(defaultWinRate.toFixed(1)));
  const [rr, setRr] = useState(String(defaultRR.toFixed(2)));
  const [bankroll, setBankroll] = useState('100');
  const [numTrades, setNumTrades] = useState('50');

  const wr = parseFloat(winRate) / 100 || 0.5;
  const r = parseFloat(rr) || 2;
  const br = parseFloat(bankroll) || 100;
  const n = parseInt(numTrades) || 50;

  const kelly = useMemo(() => kellyFraction(wr, r), [wr, r]);

  // 다양한 베팅 비율에 따른 기대 성장률 비교
  const growthData = useMemo(() => {
    const fractions = [
      { label: '1%', f: 0.01 },
      { label: '풀 켈리', f: kelly.full },
      { label: '하프 켈리', f: kelly.half },
      { label: '쿼터 켈리', f: kelly.quarter },
    ].filter((d) => d.f > 0);

    return Array.from({ length: n + 1 }, (_, t) => {
      const obj = { trade: t };
      fractions.forEach(({ label, f }) => {
        // 기대 성장: G = (1 + f*rr)^p * (1 - f)^q
        const growthPerTrade = Math.pow(1 + f * r, wr) * Math.pow(1 - f, 1 - wr);
        obj[label] = parseFloat((br * Math.pow(growthPerTrade, t)).toFixed(2));
      });
      return obj;
    });
  }, [wr, r, br, n, kelly]);

  const colors = ['#6366f1', '#f59e0b', '#10b981', '#9ca3af'];
  const labels = ['1%', '풀 켈리', '하프 켈리', '쿼터 켈리'].filter(
    (l) => l === '1%' || kelly.full > 0
  );

  return (
    <div className="card space-y-6">
      <h2 className="font-semibold">켈리 공식 최적화</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '승률 (%)', val: winRate, set: setWinRate },
          { label: '손익비', val: rr, set: setRr, step: '0.1' },
          { label: '뱅크롤 ($)', val: bankroll, set: setBankroll },
          { label: '거래 횟수', val: numTrades, set: setNumTrades },
        ].map(({ label, val, set, step }) => (
          <div key={label}>
            <label className="text-xs text-gray-400 mb-1 block">{label}</label>
            <input className="input" type="number" step={step || '1'} value={val} onChange={(e) => set(e.target.value)} />
          </div>
        ))}
      </div>

      {kelly.full > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '풀 켈리', f: kelly.full, color: 'text-brand-500' },
              { label: '하프 켈리 (권장)', f: kelly.half, color: 'text-success' },
              { label: '쿼터 켈리 (보수적)', f: kelly.quarter, color: 'text-blue-400' },
            ].map(({ label, f, color }) => (
              <div key={label} className="bg-dark-700 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{(f * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">${(br * f).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">베팅 전략별 기대 자산 성장 ({n}회 거래)</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={growthData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="trade" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  formatter={(v) => [`$${v?.toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {labels.map((label, i) => (
                  <Line
                    key={label}
                    type="monotone"
                    dataKey={label}
                    stroke={colors[i]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-gray-500 bg-dark-700 p-3 rounded-lg">
            💡 <strong className="text-white">하프 켈리</strong>를 권장합니다.
            풀 켈리 대비 성장률은 낮지만, 변동성이 크게 줄어 심리적 안정성과 장기 생존률이 향상됩니다.
            현재 조건: 승률 {winRate}% · 손익비 1:{r.toFixed(2)} → 권장 리스크 <strong className="text-brand-500">{(kelly.half * 100).toFixed(1)}%</strong>
            (<strong className="text-white">${(br * kelly.half).toFixed(2)}</strong>)
          </p>
        </>
      ) : (
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg">
          <p className="text-danger text-sm font-medium">기대값 마이너스</p>
          <p className="text-xs text-gray-400 mt-1">
            현재 승률({winRate}%)과 손익비(1:{r.toFixed(2)}) 조건에서는 장기적으로 손실이 발생합니다.
            승률 또는 손익비를 개선해야 합니다.
          </p>
        </div>
      )}
    </div>
  );
}
