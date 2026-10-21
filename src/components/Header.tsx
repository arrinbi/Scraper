import React from 'react';
import { BookOpen, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { AuthUser } from '../services/tappytoonAuth';

interface HeaderProps {
  isLoggedIn: boolean;
  user?: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  user,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 py-4 px-4 sm:px-6 shadow-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-rose-600 text-white p-2 rounded-lg shadow">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Tappytoon Scraper</h1>
            <p className="text-xs text-slate-400">Web App for Android & Desktop</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isLoggedIn ? (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-200 font-medium max-w-[120px] sm:max-w-[180px] truncate">
                {user?.nickname || user?.email || 'Logged In'}
              </span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 ml-1 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium px-3 py-1.5 rounded-xl text-xs transition-colors shadow"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
