'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  LogIn, 
  UserPlus, 
  ArrowLeft,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface AuthScreenProps {
  initialTab?: 'login' | 'register';
  onBack: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialTab = 'login',
  onBack,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const { login, signup, isLoading, authError, clearError } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // Login Form
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // After successful registration, show pending approval screen
  const [registrationPending, setRegistrationPending] = useState(false);
  const [pendingName, setPendingName] = useState('');

  const [localError, setLocalError] = useState('');

  const switchTab = (newTab: 'login' | 'register') => {
    setTab(newTab);
    setLocalError('');
    clearError();
    setRegistrationPending(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!loginName.trim()) {
      setLocalError('Please enter your name.');
      return;
    }
    if (!loginPassword) {
      setLocalError('Please enter your password.');
      return;
    }

    const res = await login(loginName.trim(), loginPassword);
    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!regName.trim()) {
      setLocalError('Please enter your name.');
      return;
    }
    if (regName.trim().length < 2) {
      setLocalError('Name must be at least 2 characters long.');
      return;
    }
    if (!regPassword) {
      setLocalError('Please enter a password.');
      return;
    }
    if (regPassword.length < 4) {
      setLocalError('Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    const res = await signup({
      name: regName.trim(),
      password: regPassword,
    });

    // If registration was submitted as PENDING (waiting admin approval)
    if (res.success && res.pending) {
      setPendingName(regName.trim());
      setRegistrationPending(true);
      return;
    }

    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  };

  const displayedError = localError || authError;

  // ─── PENDING APPROVAL SCREEN ──────────────────────────────────────────────
  if (registrationPending) {
    return (
      <div className="w-full max-w-md mx-auto px-4 animate-fade-in">
        <div className="bg-white rounded-3xl border border-amber-200 shadow-modal-clean overflow-hidden">
          {/* Amber Header */}
          <div className="bg-amber-50 border-b border-amber-100 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Clock size={24} />
            </div>
            <h2 className="text-lg font-black text-slate-900">Registration Submitted</h2>
            <p className="text-xs text-amber-700 font-semibold mt-0.5">Pending Admin Approval</p>
          </div>

          <div className="p-8 text-center">
            {/* Pending Icon */}
            <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center mx-auto mb-5">
              <Clock size={36} className="text-amber-500" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              Request Sent! 🎉
            </h3>

            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl mb-4">
              <User size={14} className="text-amber-600 shrink-0" />
              <span className="text-sm font-black text-amber-800">{pendingName}</span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              Your account registration request has been sent to the
            </p>
            <p className="text-base font-black text-slate-900 mb-4">
              Master Admin for approval.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 text-left space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>Your account has been created successfully.</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-500 shrink-0" />
                <span>Please wait for Admin to approve your account.</span>
              </div>
              <div className="flex items-center gap-2">
                <LogIn size={14} className="text-blue-500 shrink-0" />
                <span>Once approved, you can login with your credentials.</span>
              </div>
            </div>

            <button
              onClick={() => switchTab('login')}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <LogIn size={16} />
              <span>Go to Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LOGIN & REGISTER FORM ────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto px-4 animate-fade-in">
      {/* Top Header Row: Back to Welcome on left, Dark Mode on right */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Welcome</span>
        </button>

        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span>{isDarkMode ? '☀️' : '🌙'}</span>
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        )}
      </div>

      {/* Auth Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-modal-clean overflow-hidden">
        {/* Brand Header Inside Card */}
        <div className="pt-6 px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md">
            <span className="font-black text-sm">CVR</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-lg font-black tracking-tight text-slate-900">CVR AGENCIES</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500 brand-dot-pulse" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Pvt. Limited</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-100 mx-6 mt-4 p-1 bg-slate-50 rounded-xl">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn size={14} />
            <span>Login</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus size={14} />
            <span>Register</span>
          </button>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {displayedError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs font-medium">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{displayedError}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => {
                      setLoginName(e.target.value);
                      if (displayedError) clearError();
                    }}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (displayedError) clearError();
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-start gap-2">
                <Clock size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <span>After registering, your account must be approved by Admin before you can login.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (displayedError) clearError();
                    }}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (displayedError) clearError();
                    }}
                    placeholder="Create password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (displayedError) clearError();
                    }}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Send Registration Request</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
