import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export default function Login() {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="w-full max-w-sm p-8 card flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center">
            <TrendingUp size={32} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold">$10,000 챌린지</h1>
          <p className="text-gray-400 text-sm text-center">
            100불에서 1만 불까지<br />친구와 함께하는 뱅크롤 챌린지
          </p>
        </div>

        <div className="w-full space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-success" />
            실시간 뱅크롤 동기화 (바이낸스 API)
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-success" />
            매매일지 &amp; 전략 공유
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-success" />
            켈리 공식 · 파산확률 시뮬레이터
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-success" />
            TradingView 차트 연동
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full btn-primary flex items-center justify-center gap-3 py-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 시작하기
        </button>
      </div>
    </div>
  );
}
