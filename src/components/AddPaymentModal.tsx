'use client';

import React, { useState } from 'react';
import { X, Check, AlertCircle, User, IndianRupee, Calendar, Building2 } from 'lucide-react';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
  currentUserName: string;
}

const BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Canara Bank',
  'Axis Bank',
  'Indian Bank',
  'Karnataka Bank',
  'Cash',
];

const PRESETS = [500, 1000, 2000, 5000, 10000, 25000, 50000];

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentAdded,
  currentUserName,
}) => {
  const todayDate = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayDate);
  const [amount, setAmount] = useState<string>('');
  const [targetBank, setTargetBank] = useState<string>('State Bank of India (SBI)');
  const [remarks, setRemarks] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleQuickAdd = (val: number) => {
    const curr = parseFloat(amount) || 0;
    setAmount((curr + val).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg('Please enter the payment amount.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date || todayDate,
          senderName: currentUserName,
          amount: parseFloat(amount),
          targetBank,
          remarks: remarks.trim() || null,
          createdByName: currentUserName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to add money.');
        setIsLoading(false);
        return;
      }

      // Reset and close
      setAmount('');
      setDate(todayDate);
      setRemarks('');
      setIsLoading(false);
      onPaymentAdded();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error saving. Please check your internet connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Simple Friendly Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-base">
              ₹
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Add Money Entry</h2>
              <p className="text-[11px] text-slate-300">CVR Agencies Pvt. Ltd.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-700 text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User Auto-Tag Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <User size={15} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged In User</div>
                <div className="text-xs font-black text-slate-900">{currentUserName}</div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
              Sender Name
            </span>
          </div>

          {/* 1. Date */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-emerald-600" />
              <span>Payment Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* 2. Amount with Quick Presets */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <IndianRupee size={14} className="text-emerald-600" />
              <span>Payment Amount (₹)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-black text-xl">
                ₹
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                autoFocus
              />
            </div>

            {/* Quick 1-Tap Preset Buttons for Easy Mobile Typing */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-0.5">Quick Add:</span>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleQuickAdd(p)}
                  className="px-2.5 py-1 text-xs font-extrabold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer active:scale-95"
                >
                  +₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Bank Account */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 size={14} className="text-emerald-600" />
              <span>Bank Account to be Delivered</span>
            </label>
            <select
              value={targetBank}
              onChange={(e) => setTargetBank(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
            >
              {BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Remarks (Optional) */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <span>💬</span>
              <span>Remarks <span className="text-slate-400 font-normal">(Optional)</span></span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Commission payment, advance, adjustment..."
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Big High-Contrast Add Money Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-base rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={20} />
                  <span>Save Money Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
