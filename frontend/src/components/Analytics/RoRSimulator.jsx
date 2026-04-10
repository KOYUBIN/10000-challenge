import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { simulateRoR } from '../../utils/ror';

export default function RoRSimulator({ defaultWinRate = 50, defaultRR = 2 }) {
  const [winRate, setWinRate] = useState(String(defaultWinRate.toFixed(1)));
  const [rr, setRr] = useState(String(defaultRR.toFixed(2)));
  const [riskPct, setRiskPct] = useState('2');
  const [trades, setTrades] = useState('100');

  const result = useMemo(() => {
    const wr = parseFloat(winRate) / 100;
    const r = parseFloat(rr);
    const rp = parseFloat(riskPct) / 100;
    const t = parseInt(trades);
    if (!wr || !r || !rp || !t) return null;
    return simulateRoR(wr, r, rp, t, 500);
  }, [winRate, rr, riskPct, trades]);

  // 패스 데이터를 recharts 형식으로 변환
  const chartData = useMemo(() => {
    if (!result) return [];
    const maxLen = Math.max(...result.paths.map((p) => p.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const obj = { trade: i };
      result.paths.forEach((path, pi) => {
        obj[`path${pi}`] = path[i] ?? null;
      });
      return obj;
    });
  }, [result]);

  const rorColor = result
    ? result.ror > 50 ? '#ef4444' : result.ror > 20 ? '#f59e0b' : '#10b981'
    : '#10b981';

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-semibold mb-4">파산 확률 (Risk of Ruin) 시뮬레이터</h2>
        <p className="text-xs text-gray-500 mb-4">
          몬테카를로 시뮬레이션 500회 기준으로 파산 확률을 계산합니다.
          파산 기준은 초기 자산의 90% 손실입니다.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: '승률 (%)', val: winRate, set: setWinRate, step: '1' },
            { label: '손익비', val: rr, set: setRr, step: '0.1' },
            { label: '리스크 비율 (%)', val: riskPct, set: setRiskPct, step: '0.5' },
            { label: '거래 횟수', val: trades, set: setTrades, step: '10' },
          ].map(({ label, val, set, step }) => (
            <div key={label}>
              <label className="text-xs text-gray-400 mb-1 block">{label}</label>
              <input
                className="input"
                type="number"
                step={step}
                value={val}
                onChange={(e) => set(e.target.value)}
              />
            </div>
          ))}
        </div>

        {result && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-dark-700 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">파산 확률</p>
                <p className="text-2xl font-bold" style={{ color: rorColor }}>
                  {result.ror.toFixed(1)}%
                </p>
              </div>
              <div className="bg-dark-700 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">중간값 최종 자산</p>
                <p className="text-lg font-bold text-white">
                  {(result.medianFinal * 100).toFixed(0)}%
                </p>
              </div>
              <div className="bg-dark-700 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">평균 최종 자산</p>
                <p className="text-lg font-bold text-white">
                  {(result.avgFinal * 100).toFixed(0)}%
                </p>
              </div>
              <div className="bg-dark-700 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">위험도</p>
                <p className={`text-lg font-bold ${rorColor === '#ef4444' ? 'text-danger' : rorColor === '#f59e0b' ? 'text-yellow-400' : 'text-success'}`}>
                  {result.ror > 50 ? '매우 위험' : result.ror > 20 ? '위험' : result.ror > 5 ? '보통' : '안전'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">뱅크롤 시뮬레이션 경로 (20개 샘플)</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="trade" tick={{ fill: '#9ca3af', fontSize: 10 }} label={{ value: '거래', fill: '#9ca3af', position: 'insideBottom', offset: -2 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    formatter={(v) => [`${(v * 100).toFixed(1)}%`, '자산 비율']}
                  />
                  <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="4 4" />
                  <ReferenceLine y={0.1} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '파산선', fill: '#ef4444', fontSize: 10 }} />
                  {result.paths.map((_, i) => (
                    <Line
                      key={i}
                      type="monotone"
                      dataKey={`path${i}`}
                      stroke={`hsl(${(i * 17) % 360}, 60%, 55%)`}
                      dot={false}
                      strokeWidth={1}
                      opacity={0.6}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
