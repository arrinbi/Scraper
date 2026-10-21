import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 py-4 px-4 sm:px-6 shadow-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <div className="bg-rose-600 text-white p-2 rounded-lg shadow">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Tappytoon Scraper</h1>
            <p className="text-xs text-slate-400">Web App for Android & Desktop</p>
          </div>
        </div>
        <div className="flex items-center text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          <span>Session Auth Compliant</span>
        </div>
      </div>
    </header>
  );
};
