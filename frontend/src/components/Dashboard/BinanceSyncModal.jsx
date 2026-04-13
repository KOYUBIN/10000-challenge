import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function BinanceSyncModal({ onClose, onSync }) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saveKey, setSaveKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSync(apiKey, apiSecret, saveKey);
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
            API 키는 반드시 <strong>읽기 전용(Read-Only)</strong>으로 발급하고
            <strong> 출금을 비활성화</strong>하세요.
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

          {/* 자동 동기화를 위한 키 저장 옵션 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-brand-500"
              checked={saveKey}
              onChange={(e) => setSaveKey(e.target.checked)}
            />
            <span className="text-sm text-gray-300">
              키 저장 (10분마다 자동 동기화)
            </span>
          </label>
          {saveKey && (
            <p className="text-xs text-gray-500 pl-6">
              키가 Firebase에 저장되어 자동으로 잔고가 업데이트됩니다.
            </p>
          )}

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
