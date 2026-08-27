'use client';

import React from 'react';
import { ArrowRight, UserPlus, LogIn, Lock } from 'lucide-react';

interface WelcomeScreenProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGoToLogin,
  onGoToRegister,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 sm:py-12 flex flex-col items-center text-center animate-fade-in relative">
      {/* Top Right Dark Mode Toggle */}
      {onToggleDarkMode && (
        <div className="w-full flex justify-end mb-4">
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span>{isDarkMode ? '☀️' : '🌙'}</span>
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      )}

      {/* Brand Icon */}
      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xl mb-6 ring-4 ring-slate-100 dark:ring-slate-800 border border-slate-800">
        <span className="font-black text-xl tracking-wider">CVR</span>
      </div>

      {/* Eyebrow Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold tracking-wide shadow-xs mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 brand-dot-pulse" />
        <span>Enterprise Mobile Portal</span>
      </div>

      {/* Headline ("WELCOME TO" and "AGENCIES" are black ONLY in both light & dark mode) */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-900 leading-[1.15]">
        WELCOME TO <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 bg-clip-text text-transparent font-black">CVR</span> AGENCIES
      </h1>
      <p className="text-xs sm:text-sm font-bold tracking-widest text-slate-400 dark:text-slate-400 uppercase mt-1">
        Private Limited
      </p>

      {/* Subline */}
      <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md font-normal leading-relaxed">
        A high-precision mobile workspace engineered for confidential business accounts, inventory, and operations.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col items-center gap-3 w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onGoToLogin}
            className="w-full sm:w-44 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <LogIn size={16} />
            <span>Login</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={onGoToRegister}
            className="w-full sm:w-44 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <UserPlus size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Register</span>
          </button>
        </div>

        {/* 📲 Direct APK Download Button */}
        <a
          href="/api/download-apk"
          download="CVR_Agencies.apk"
          className="w-full sm:w-88 py-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <span>📲</span>
          <span>Download Android App (.apk)</span>
        </a>
      </div>

      <div className="mt-12 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400">
        <Lock size={12} />
        <span>CVR Agencies Pvt. Ltd. • Authorized Access</span>
      </div>
    </div>
  );
};
