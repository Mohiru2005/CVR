'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, LogOut, Lock, Key } from 'lucide-react';

export const AdminWelcomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-modal-clean p-6 sm:p-8 text-center animate-fade-in">
      {/* Admin Icon Badge */}
      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-slate-800 shadow-md">
        <ShieldCheck size={32} />
      </div>

      {/* Main Admin Greeting */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 brand-dot-pulse" />
        <span>Administrator Portal</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-1">
        Welcome Admin
      </h1>

      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
        CVR AGENCIES PVT. LIMITED
      </p>

      {/* Session Details */}
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 mb-6 space-y-2 text-left">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Account Type:</span>
          <span className="font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded text-[11px]">
            Master Admin
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Username:</span>
          <span className="font-semibold text-slate-800 font-mono">admin</span>
        </div>
        {user?.lastLogin && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Session Started:</span>
            <span className="font-semibold text-slate-800">{user.lastLogin}</span>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="w-full py-3 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 font-bold text-sm rounded-xl border border-slate-200 hover:border-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogOut size={16} />
        <span>Log Out</span>
      </button>
    </div>
  );
};
