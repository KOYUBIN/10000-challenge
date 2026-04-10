import React from 'react';
import { Trophy } from 'lucide-react';

const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
const rankIcons = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ data, myUid }) {
  return (
    <div className="card h-full">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-brand-500" />
        <h2 className="font-semibold">리더보드</h2>
      </div>
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">참여자가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {data.map((u, i) => {
            const isMe = u.uid === myUid;
            const progress = Math.min((u.bankroll / u.target) * 100, 100);
            return (
              <div
                key={u.uid}
                className={`p-3 rounded-lg border transition-colors ${
                  isMe
                    ? 'border-brand-500/50 bg-brand-500/5'
                    : 'border-dark-600 bg-dark-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{rankIcons[i] || `#${i + 1}`}</span>
                    <span className={`text-sm font-medium ${isMe ? 'text-brand-500' : 'text-white'}`}>
                      {u.displayName || '익명'} {isMe && '(나)'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      ${u.bankroll?.toLocaleString('en', { maximumFractionDigits: 0 })}
                    </p>
                    <p className={`text-xs ${parseFloat(u.roi) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {parseFloat(u.roi) >= 0 ? '+' : ''}{u.roi}%
                    </p>
                  </div>
                </div>
                {/* 진행 바 */}
                <div className="w-full bg-dark-600 rounded-full h-1">
                  <div
                    className="bg-brand-500 h-1 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% 달성</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
