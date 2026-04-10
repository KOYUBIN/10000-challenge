import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function BinanceSyncModal({ onClose, onSync }) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSync(apiKey, apiSecret);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">바이낸스 API 연동</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
          <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-400">
            API 키는 반드시 <strong>읽기 전용(Read-Only)</strong>으로 발급하고,
            <strong>IP 화이트리스트</strong>와 <strong>출금 비활성화</strong>를 설정하세요.
            키는 서버에 저장되지 않습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">API Key</label>
            <input
              className="input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="바이낸스 API Key"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">API Secret</label>
            <input
              className="input"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="바이낸스 API Secret"
              required
            />
          </div>
          {error && <p className="text-danger text-xs">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">취소</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? '동기화 중...' : '동기화'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
