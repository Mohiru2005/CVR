'use client';

import React from 'react';
import { ArrowRight, UserPlus, LogIn, Lock } from 'lucide-react';

interface WelcomeScreenProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGoToLogin,
  onGoToRegister,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 sm:py-12 flex flex-col items-center text-center animate-fade-in">
      {/* Brand Icon */}
      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl mb-6 ring-4 ring-slate-100">
        <span className="font-black text-xl tracking-wider">CVR</span>
      </div>

      {/* Eyebrow Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold tracking-wide shadow-xs mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 brand-dot-pulse" />
        <span>Enterprise Mobile Portal</span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
        WELCOME TO <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">CVR</span> AGENCIES
      </h1>
      <p className="text-xs sm:text-sm font-bold tracking-widest text-slate-400 uppercase mt-1">
        Private Limited
      </p>

      {/* Subline */}
      <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-md font-normal leading-relaxed">
        A high-precision mobile workspace engineered for confidential business accounts, inventory, and operations.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
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
          className="w-full sm:w-44 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <UserPlus size={16} className="text-emerald-600" />
          <span>Register</span>
        </button>
      </div>

      <div className="mt-12 flex items-center gap-1.5 text-xs text-slate-400">
        <Lock size={12} />
        <span>CVR Agencies Pvt. Ltd. • Authorized Access</span>
      </div>
    </div>
  );
};
