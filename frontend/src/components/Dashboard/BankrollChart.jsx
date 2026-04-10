import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts';

function fmt(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function BankrollChart({ history, bankroll, target }) {
  const data = history.map((h) => ({
    date: fmt(h.createdAt),
    bankroll: parseFloat(h.bankroll?.toFixed(2) || 0),
  }));

  if (data.length === 0) {
    data.push({ date: '시작', bankroll: 100 });
    data.push({ date: '현재', bankroll: bankroll });
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">뱅크롤 성장 추이</h2>
        <span className="text-xs text-gray-500">목표: ${target.toLocaleString()}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bankrollGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#f9fafb' }}
            formatter={(v) => [`$${v.toLocaleString()}`, '뱅크롤']}
          />
          <ReferenceLine y={target} stroke="#10b981" strokeDasharray="4 4" label={{ value: '목표', fill: '#10b981', fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="bankroll"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#bankrollGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
