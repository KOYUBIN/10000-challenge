import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Lightbulb, Calculator,
  BarChart2, LogOut, TrendingUp, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/trades', icon: BookOpen, label: '매매일지' },
  { to: '/strategy', icon: Lightbulb, label: '전략 피드' },
  { to: '/calculator', icon: Calculator, label: '리스크 계산기' },
  { to: '/analytics', icon: BarChart2, label: '분석' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* 사이드바 (데스크탑) */}
      <aside className="hidden lg:flex flex-col w-60 bg-dark-800 border-r border-dark-600 p-4">
        <SidebarContent user={user} logout={logout} />
      </aside>

      {/* 모바일 사이드바 */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-60 bg-dark-800 border-r border-dark-600 p-4 flex flex-col">
            <button onClick={() => setOpen(false)} className="self-end mb-4 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent user={user} logout={logout} onNav={() => setOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* 메인 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 모바일 헤더 */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-dark-600">
          <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 text-brand-500 font-bold">
            <TrendingUp size={18} />
            $10K 챌린지
          </div>
          {user?.photoURL && (
            <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />
          )}
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ user, logout, onNav }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
          <TrendingUp size={18} className="text-black" />
        </div>
        <span className="font-bold text-brand-500">$10K 챌린지</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500/10 text-brand-500'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 pt-4 border-t border-dark-600">
        {user && (
          <div className="flex items-center gap-3 mb-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-black text-xs font-bold">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-danger transition-colors"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </div>
    </>
  );
}
