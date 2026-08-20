'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthScreen } from '@/components/AuthScreen';
import { Sidebar } from '@/components/Sidebar';
import { AddPaymentModal } from '@/components/AddPaymentModal';
import * as XLSX from 'xlsx';
import { 
  Menu, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Database, 
  Settings, 
  Clock, 
  User, 
  Trash2, 
  CheckCircle2,
  RefreshCw,
  LogOut,
  PlusCircle,
  IndianRupee,
  Calendar,
  Building2,
  Search,
  FileSpreadsheet,
  Download,
  Filter,
  ArrowUpRight,
  RotateCcw,
  Bell,
  Check,
  X,
  Hourglass,
  HardDriveDownload,
  FolderArchive,
  Sparkles,
  Layers
} from 'lucide-react';

// Format YYYY-MM-DD -> DD/MM/YYYY
const formatDateDisplay = (dStr: string) => {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dStr;
};

export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const [mounted, setMounted] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [activeTab, setActiveTab] = useState<string>('data');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Users state (Admin only)
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  // Delete Requests State (Admin only)
  const [deleteRequests, setDeleteRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);

  // Backups & Data Recovery State (All Users)
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [backupFolder, setBackupFolder] = useState<string>('');
  const [loadingBackups, setLoadingBackups] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Payments State
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState({ totalAmount: 0, todayAmount: 0, totalCount: 0 });
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);

  // 3 Core Filters: Name, Date Range (From - To), Bank
  const [searchName, setSearchName] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('ALL');

  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always reset active tab to 'data' upon login
  useEffect(() => {
    if (user) {
      setActiveTab('data');
    }
  }, [user?.id]);

  const handleLogout = () => {
    setActiveTab('data');
    setCurrentView('welcome');
    logout();
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      let url = '/api/payments';
      const params = new URLSearchParams();
      if (searchName.trim()) params.append('q', searchName.trim());
      if (selectedBankFilter && selectedBankFilter !== 'ALL') params.append('bank', selectedBankFilter);
      if (fromDate) params.append('startDate', fromDate);
      if (toDate) params.append('endDate', toDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
        if (data.stats) {
          setPaymentStats(data.stats);
        }
      }
    } catch (e) {
      console.error('Failed to fetch payments:', e);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchDeleteRequests = async () => {
    if (!user?.isAdmin) return;
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem('cvr_auth_token') || user?.token;
      const res = await fetch('/api/delete-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.requests) {
        setDeleteRequests(data.requests);
      }
    } catch (e) {
      console.error('Failed to fetch delete requests:', e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      if (data.success) {
        setBackupsList(data.backups || []);
        setBackupFolder(data.backupFolder || '');
      }
    } catch (e) {
      console.error('Failed to fetch backups:', e);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateInstantBackup = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBackupsList(data.backups || []);
        alert('Fresh 10-day & weekly backup created in your device folder!');
      } else {
        alert(data.error || 'Failed to create backup');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating backup');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleRestoreFromSnapshot = async (fileName: string) => {
    if (confirm(`Restore data from "${fileName}"? Any missing rows will be safely recovered back to the system.`)) {
      setIsRestoring(true);
      try {
        const res = await fetch('/api/backup', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName }),
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          fetchPayments();
          fetchBackups();
        } else {
          alert(data.error || 'Failed to restore data');
        }
      } catch (e) {
        console.error(e);
        alert('Error restoring data.');
      } finally {
        setIsRestoring(false);
      }
    }
  };

  const fetchUsers = async () => {
    if (!user?.isAdmin) return;
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('cvr_auth_token') || user?.token;
      const res = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.users) {
        setDbUsers(data.users);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPayments();
      fetchBackups(); // Auto updates backup snapshots in device folder whenever app is opened
    }
    if (user?.isAdmin) {
      fetchDeleteRequests();
    }
    if (user?.isAdmin && activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'recovery') {
      fetchBackups();
    }
    if (!user?.isAdmin && (activeTab === 'users' || activeTab === 'requests')) {
      setActiveTab('dashboard');
    }
  }, [user, activeTab, selectedBankFilter, fromDate, toDate]);

  const handleResetFilters = () => {
    setSearchName('');
    setFromDate('');
    setToDate('');
    setSelectedBankFilter('ALL');
  };

  const isFilterActive = Boolean(searchName || fromDate || toDate || (selectedBankFilter && selectedBankFilter !== 'ALL'));

  // Admin Direct Delete
  const handleAdminDirectDelete = async (paymentId: string) => {
    if (!user?.isAdmin) return;
    if (confirm('Are you sure you want to permanently delete this payment row?')) {
      try {
        const token = localStorage.getItem('cvr_auth_token') || user?.token;
        const res = await fetch(`/api/payments?id=${paymentId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          fetchPayments();
          fetchDeleteRequests();
        } else {
          alert(data.error || 'Failed to delete row');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // User Request Deletion
  const handleUserRequestDelete = async (payment: any) => {
    if (confirm(`Send a delete request to Admin for payment of ₹${payment.amount.toLocaleString('en-IN')} (${payment.targetBank})?`)) {
      try {
        const res = await fetch('/api/delete-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: payment.id,
            requestedBy: user?.name || 'Staff Member',
            reason: `User ${user?.name} requested removal`,
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert('Delete request sent to Admin for approval.');
          fetchPayments();
        } else {
          alert(data.error || 'Failed to submit delete request');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Admin Action on Delete Request (Accept or Reject)
  const handleProcessDeleteRequest = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    if (!user?.isAdmin) return;
    const confirmMsg = action === 'ACCEPT'
      ? 'Accept request and delete this payment row?'
      : 'Reject request and keep this payment row?';
    
    if (confirm(confirmMsg)) {
      try {
        const token = localStorage.getItem('cvr_auth_token') || user?.token;
        const res = await fetch('/api/delete-requests', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ requestId, action }),
        });
        const data = await res.json();
        if (data.success) {
          fetchDeleteRequests();
          fetchPayments();
        } else {
          alert(data.error || 'Failed to process request');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteUser = async (userToDelete: { id: string; name: string }) => {
    if (!user?.isAdmin) return;
    if (confirm(`Remove user "${userToDelete.name}" from system?`)) {
      try {
        const token = localStorage.getItem('cvr_auth_token') || user?.token;
        const res = await fetch(`/api/users?id=${userToDelete.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          fetchUsers();
        } else {
          alert(data.error || 'Failed to delete user');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Export to 100% Genuine Binary Excel (.xlsx) file with DD/MM/YYYY date format
  const handleExportExcel = () => {
    if (payments.length === 0) {
      alert('No payment rows to export.');
      return;
    }

    const rows = payments.map((p, idx) => ({
      'S.No': idx + 1,
      'Date': formatDateDisplay(p.date),
      'Sender / User Name': p.senderName || user?.name || '',
      'Amount (INR)': Number(p.amount || 0),
      'Bank to be Delivered': p.targetBank || '',
      'Recorded By': p.createdByName || '',
    }));

    // Add Summary Row at bottom
    const totalAmt = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    rows.push({
      'S.No': 'TOTAL' as any,
      'Date': `${payments.length} Rows`,
      'Sender / User Name': 'Total Collection',
      'Amount (INR)': totalAmt,
      'Bank to be Delivered': '',
      'Recorded By': '',
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Column widths
    worksheet['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 16 }, // Date (DD/MM/YYYY)
      { wch: 26 }, // Sender Name
      { wch: 18 }, // Amount (INR)
      { wch: 32 }, // Bank to be Delivered
      { wch: 22 }, // Recorded By
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

    const todayStr = formatDateDisplay(new Date().toISOString().split('T')[0]).replace(/\//g, '-');
    XLSX.writeFile(workbook, `CVR_Agencies_Payments_${todayStr}.xlsx`);
  };

  // SSR Initial Render placeholder
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="w-14 h-14 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-2xl mb-4">
          <span className="font-black text-base tracking-wider">CVR</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-emerald-500 brand-dot-pulse" />
          <span>CVR Agencies Pvt. Ltd.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {user ? (
        /* LOGGED IN LAYOUT WITH LEFT SIDEBAR */
        <div className="min-h-screen flex">
          {/* Left Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            pendingRequestsCount={deleteRequests.length}
          />

          {/* Main Workspace Area */}
          <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
            {/* Top Bar with Top-Right Logout */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between">
              {/* Left Title & Mobile Menu Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
                  aria-label="Open sidebar"
                >
                  <Menu size={20} />
                </button>

                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-base sm:text-lg capitalize">
                    {activeTab === 'data' 
                      ? 'Payment Ledger (Excel Sheet)' 
                      : activeTab === 'requests' 
                      ? 'Delete Requests' 
                      : activeTab === 'recovery' 
                      ? 'Backup & Data Recovery' 
                      : 'Dashboard Overview'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 brand-dot-pulse" />
                </div>
              </div>

              {/* TOP RIGHT: Add Money + User Pill + Log Out Button */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsAddPaymentOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <PlusCircle size={15} />
                  <span>Add Money</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-full">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    user.isAdmin ? 'bg-slate-900 text-emerald-400' : 'bg-emerald-600 text-white'
                  }`}>
                    {user.isAdmin ? <ShieldCheck size={13} /> : user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto animate-fade-in">
              {/* DASHBOARD TAB (DATA SUMMARY & RECENT ENTRIES DIRECTLY ON TOP) */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top Greeting & Action Header */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 brand-dot-pulse" />
                          <span>{user.isAdmin ? 'MASTER ADMIN SESSION' : 'USER ACCOUNT SESSION'}</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                          {user.isAdmin ? 'Welcome Admin' : `Welcome, ${user.name}!`}
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                          CVR Agencies Pvt. Ltd. • Payment & Collection Management Portal.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsAddPaymentOpen(true)}
                        className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                      >
                        <PlusCircle size={20} />
                        <span>+ Add Money</span>
                      </button>
                    </div>
                  </div>

                  {/* 🔝 DATA COLLECTION SUMMARY (DIRECTLY ON TOP OF DASHBOARD) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-card-subtle">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                        <span>Total Money Collected</span>
                        <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          <IndianRupee size={15} />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                        ₹{paymentStats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1.5">Across all company bank accounts</div>
                    </div>

                    <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-card-subtle">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                        <span>Today's Collections</span>
                        <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                          <Calendar size={15} />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                        ₹{paymentStats.todayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1.5">Recorded today</div>
                    </div>

                    <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-card-subtle">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                        <span>Total Payment Entries</span>
                        <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                          <FileSpreadsheet size={15} />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                        {paymentStats.totalCount} Payments
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1.5">
                        <button
                          onClick={() => setActiveTab('data')}
                          className="text-emerald-600 hover:text-emerald-700 font-extrabold underline cursor-pointer"
                        >
                          Open Full Excel Sheet →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 🔝 RECENT DATA ENTRIES FEED (PROMINENT ON DASHBOARD) */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card-subtle">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-black text-slate-900">Recent Payment Records</h2>
                        <p className="text-xs text-slate-500">Latest money entries added by users and staff</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('data')}
                        className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <span>View All ({payments.length})</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {payments.slice(0, 6).map((p) => (
                        <div key={p.id} className="py-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-black text-base shrink-0">
                              ₹
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900">{p.senderName}</div>
                              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                <span className="font-semibold text-slate-700">📅 {formatDateDisplay(p.date)}</span>
                                <span>•</span>
                                <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md">🏦 {p.targetBank}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-base sm:text-lg font-black text-emerald-700">
                              +₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400">By: {p.createdByName}</div>
                          </div>
                        </div>
                      ))}

                      {payments.length === 0 && (
                        <div className="py-12 text-center text-xs text-slate-400">
                          <Building2 size={36} className="mx-auto mb-2 opacity-30 text-emerald-600" />
                          <p className="font-bold text-slate-700 text-sm mb-1">No payment entries recorded yet</p>
                          <p className="max-w-xs mx-auto mb-3">Click "+ Add Money" to add your first payment entry.</p>
                          <button
                            onClick={() => setIsAddPaymentOpen(true)}
                            className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                          >
                            + Add Money Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* DATA TAB (EXCEL STYLE DATA SHEET) */}
              {activeTab === 'data' && (
                <div className="space-y-4">
                  {/* Excel Sheet Top Action Header */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-card-subtle">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md">
                          <FileSpreadsheet size={22} />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-black text-slate-900">
                            Payments Excel Sheet
                          </h2>
                          <p className="text-xs text-slate-500">
                            Showing {payments.length} row{payments.length !== 1 ? 's' : ''} • Total Collections: ₹{paymentStats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Download True .xlsx Excel Button */}
                        <button
                          onClick={handleExportExcel}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Download genuine .xlsx spreadsheet"
                        >
                          <Download size={15} className="text-emerald-400" />
                          <span>Download Excel Sheet</span>
                        </button>

                        <button
                          onClick={() => setIsAddPaymentOpen(true)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <PlusCircle size={15} />
                          <span>+ Add Money</span>
                        </button>

                        <button
                          onClick={fetchPayments}
                          className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
                          title="Refresh Table"
                        >
                          <RefreshCw size={16} className={loadingPayments ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* 🎯 3 CORE FILTER CONTROLS: NAME, DATE RANGE (FROM - TO), BANK */}
                    <div className="pt-3.5 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                          <Filter size={14} className="text-emerald-600" />
                          <span>Filter Options</span>
                        </div>
                        {isFilterActive && (
                          <button
                            onClick={handleResetFilters}
                            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100 px-3 py-1 rounded-xl transition-colors"
                          >
                            <RotateCcw size={12} />
                            <span>Reset All Filters</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* 1. FILTER BY NAME */}
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-1">
                            1. Search Name / User
                          </label>
                          <div className="relative">
                            <Search size={14} className="absolute inset-y-0 left-3 my-auto text-slate-400" />
                            <input
                              type="text"
                              value={searchName}
                              onChange={(e) => setSearchName(e.target.value)}
                              placeholder="e.g. Admin, Ramesh..."
                              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* 2. FILTER FROM DATE */}
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-1">
                            2. From Date
                          </label>
                          <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                          />
                        </div>

                        {/* 3. FILTER TO DATE */}
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-1">
                            3. To Date
                          </label>
                          <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                          />
                        </div>

                        {/* 4. FILTER BY BANK */}
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-1">
                            4. Bank Account
                          </label>
                          <select
                            value={selectedBankFilter}
                            onChange={(e) => setSelectedBankFilter(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="ALL">All Banks</option>
                            <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                            <option value="HDFC Bank">HDFC Bank</option>
                            <option value="ICICI Bank">ICICI Bank</option>
                            <option value="Canara Bank">Canara Bank</option>
                            <option value="Axis Bank">Axis Bank</option>
                            <option value="Indian Bank">Indian Bank</option>
                            <option value="Cash">Cash</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXCEL SPREADSHEET TABLE */}
                  <div className="bg-white rounded-3xl border border-slate-300 shadow-card-subtle overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        {/* Table Header (Excel style) */}
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold tracking-wider uppercase text-[11px] border-b border-slate-800">
                            <th className="py-3.5 px-3.5 w-14 text-center border-r border-slate-800">#</th>
                            <th className="py-3.5 px-4 border-r border-slate-800">Date (DD/MM/YYYY)</th>
                            <th className="py-3.5 px-4 border-r border-slate-800">Sender / User</th>
                            <th className="py-3.5 px-4 text-right border-r border-slate-800">Amount (₹)</th>
                            <th className="py-3.5 px-4 border-r border-slate-800">Bank to be Delivered</th>
                            <th className="py-3.5 px-3 text-center w-36">Delete Control</th>
                          </tr>
                        </thead>

                        {/* Table Body (Excel rows) */}
                        <tbody className="divide-y divide-slate-200">
                          {payments.map((p, index) => {
                            const hasPendingRequest = p.deleteRequests && p.deleteRequests.length > 0;
                            return (
                              <tr
                                key={p.id}
                                className={`hover:bg-emerald-50/50 transition-colors ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                                }`}
                              >
                                {/* Row Number */}
                                <td className="py-3.5 px-3.5 text-center font-mono font-bold text-slate-400 border-r border-slate-200 bg-slate-100/60">
                                  {index + 1}
                                </td>

                                {/* Date (DD/MM/YYYY) */}
                                <td className="py-3.5 px-4 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                                  {formatDateDisplay(p.date)}
                                </td>

                                {/* Sender Name */}
                                <td className="py-3.5 px-4 font-black text-slate-900 border-r border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                                      {p.senderName.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{p.senderName}</span>
                                  </div>
                                </td>

                                {/* Amount (Right aligned) */}
                                <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 border-r border-slate-200 whitespace-nowrap text-sm">
                                  ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>

                                {/* Target Bank */}
                                <td className="py-3.5 px-4 font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-xs">
                                    <Building2 size={13} className="text-slate-500" />
                                    <span>{p.targetBank}</span>
                                  </span>
                                </td>

                                {/* Actions: Admin can delete directly; Users can Request Delete */}
                                <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                  {user.isAdmin ? (
                                    /* Master Admin Direct Delete */
                                    <button
                                      onClick={() => handleAdminDirectDelete(p.id)}
                                      className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto active:scale-95"
                                      title="Admin: Delete row directly from database"
                                    >
                                      <Trash2 size={13} />
                                      <span>Delete</span>
                                    </button>
                                  ) : hasPendingRequest ? (
                                    /* User has already requested delete */
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-xl">
                                      <Hourglass size={12} className="animate-spin" />
                                      <span>Pending Admin</span>
                                    </span>
                                  ) : (
                                    /* User sends delete request */
                                    <button
                                      onClick={() => handleUserRequestDelete(p)}
                                      className="px-3 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto active:scale-95"
                                      title="Send delete request to Admin"
                                    >
                                      <Bell size={12} />
                                      <span>Request Delete</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {payments.length === 0 && !loadingPayments && (
                            <tr>
                              <td colSpan={6} className="py-14 text-center text-slate-400 text-xs">
                                <FileSpreadsheet size={36} className="mx-auto mb-2 opacity-30 text-emerald-600" />
                                <p className="font-bold text-slate-700 text-sm mb-1">No payment entries matching filter</p>
                                <p className="max-w-xs mx-auto mb-4">Try adjusting your date range, bank, or search name.</p>
                                {isFilterActive && (
                                  <button
                                    onClick={handleResetFilters}
                                    className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                                  >
                                    Clear All Filters
                                  </button>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>

                        {/* Excel Summary Footer Row */}
                        {payments.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-xs sm:text-sm">
                              <td className="py-4 px-3.5 text-center border-r border-slate-200 font-mono font-black">
                                Σ
                              </td>
                              <td colSpan={2} className="py-4 px-4 border-r border-slate-200 uppercase tracking-wider text-xs font-black text-slate-800">
                                Total Collection ({payments.length} Rows)
                              </td>
                              <td className="py-4 px-4 text-right font-mono font-black text-emerald-700 text-sm sm:text-base border-r border-slate-200">
                                ₹{paymentStats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td colSpan={2} className="py-4 px-4 text-slate-500 text-xs font-semibold">
                                Grand Total Sum
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 🛡️ DATA RECOVERY & 10-DAY BACKUPS TAB (AVAILABLE TO ALL USERS) */}
              {activeTab === 'recovery' && (
                <div className="space-y-6">
                  {/* Top Status & Info Banner */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card-subtle">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                          <HardDriveDownload size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-slate-900">Backup & Data Recovery</h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Auto-Saved on Device
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 max-w-xl">
                            The system automatically archives 10-day & weekly Excel snapshots directly to your device folder every time you open the application.
                          </p>
                          <div className="mt-2 text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                            <FolderArchive size={13} className="text-slate-500" />
                            <span>Device Folder: <span className="text-slate-700 font-semibold">{backupFolder || 'd:\\work\\CVR\\backups\\'}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={handleCreateInstantBackup}
                          disabled={loadingBackups}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Sparkles size={15} />
                          <span>{loadingBackups ? 'Saving...' : 'Create Fresh Backup'}</span>
                        </button>

                        <button
                          onClick={fetchBackups}
                          className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
                          title="Refresh Backups List"
                        >
                          <RefreshCw size={16} className={loadingBackups ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Backups List Grid */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card-subtle">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-black text-slate-900">Available Device Backup Snapshots</h3>
                        <p className="text-xs text-slate-500">Weekly and 10-day Excel files ready to download or restore</p>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {backupsList.length} Snapshots
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {backupsList.map((b) => (
                        <div key={b.fileName} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-3 rounded-2xl transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              b.type === '10-DAYS' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : b.type === 'WEEKLY'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              <FileSpreadsheet size={18} />
                            </div>

                            <div>
                              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span>{b.fileName}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                                  b.type === '10-DAYS'
                                    ? 'bg-blue-100 text-blue-800'
                                    : b.type === 'WEEKLY'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {b.type}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                                <span>📅 {new Date(b.createdAt).toLocaleDateString()} at {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">{b.recordCount} Payment Rows</span>
                                <span>•</span>
                                <span className="font-bold text-emerald-700">₹{b.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                <span>•</span>
                                <span className="text-slate-400">{b.fileSizeKb} KB</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions: Download & 1-Click Restore */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <a
                              href={`/api/backup?download=${encodeURIComponent(b.fileName)}`}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                              download
                              title="Download Excel file to your computer"
                            >
                              <Download size={14} className="text-emerald-400" />
                              <span>Download</span>
                            </a>

                            <button
                              onClick={() => handleRestoreFromSnapshot(b.fileName)}
                              disabled={isRestoring}
                              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title="Restore any missing records from this snapshot"
                            >
                              <RotateCcw size={14} className={isRestoring ? 'animate-spin' : ''} />
                              <span>Restore</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {backupsList.length === 0 && !loadingBackups && (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          <FolderArchive size={32} className="mx-auto mb-2 opacity-40 text-emerald-600" />
                          <p className="font-bold text-slate-700 text-sm mb-1">No device backups created yet</p>
                          <p className="max-w-xs mx-auto mb-3">Click "Create Fresh Backup" to generate your first 10-day snapshot.</p>
                          <button
                            onClick={handleCreateInstantBackup}
                            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                          >
                            + Create Fresh Backup
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 🔔 DELETE REQUESTS TAB (SEPARATE DEDICATED ADMIN OPTION) */}
              {activeTab === 'requests' && user.isAdmin && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-amber-200 shadow-card-subtle p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
                          <Bell size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-slate-900">User Deletion Requests</h2>
                            {deleteRequests.length > 0 && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                {deleteRequests.length} Pending
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Users submitted these rows for removal. Review and click Accept or Reject.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={fetchDeleteRequests}
                        className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
                        title="Refresh requests"
                      >
                        <RefreshCw size={16} className={loadingRequests ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {deleteRequests.map((req) => (
                        <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50/50 p-4 sm:p-5 rounded-2xl border border-amber-100 my-2">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                              <span className="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md text-[11px] uppercase font-black">
                                Submitted by: {req.requestedBy}
                              </span>
                              <span>•</span>
                              <span className="text-slate-500 font-normal">
                                {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="text-base font-black text-slate-900 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span>Sender: {req.payment?.senderName}</span>
                              <span className="text-emerald-700 font-mono text-lg">₹{req.payment?.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              <span className="text-xs font-medium text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                                🏦 {req.payment?.targetBank}
                              </span>
                              <span className="text-xs text-slate-500 font-semibold">
                                📅 {formatDateDisplay(req.payment?.date)}
                              </span>
                            </div>
                          </div>

                          {/* Accept & Reject Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleProcessDeleteRequest(req.id, 'ACCEPT')}
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title="Accept request and permanently delete row"
                            >
                              <Check size={15} />
                              <span>Accept & Delete</span>
                            </button>

                            <button
                              onClick={() => handleProcessDeleteRequest(req.id, 'REJECT')}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                              title="Reject request and keep row safe"
                            >
                              <X size={15} />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {deleteRequests.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                          <p className="font-bold text-slate-700 text-sm mb-1">No Pending Deletion Requests</p>
                          <span>All user delete requests have been resolved.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* USERS TAB (ONLY VISIBLE AND ACCESSIBLE TO ADMIN) */}
              {activeTab === 'users' && user.isAdmin && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card-subtle">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-black text-slate-900">User Accounts Directory</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          List of registered staff members with login access
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={fetchUsers}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
                          title="Refresh user list"
                        >
                          <RefreshCw size={15} className={loadingUsers ? 'animate-spin' : ''} />
                        </button>
                        <div className="text-xs font-black bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                          Total: {dbUsers.length + 1}
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {/* Master Admin Entry */}
                      <div className="py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs shadow-xs">
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <span>Admin</span>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                Master Admin
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">System Administrator</div>
                          </div>
                        </div>
                        <div className="text-xs text-emerald-600 font-bold">Active</div>
                      </div>

                      {/* Database Users */}
                      {dbUsers.map((u) => (
                        <div key={u.id} className="py-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              <User size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{u.name}</div>
                              <div className="text-xs text-slate-400">
                                Registered on {formatDateDisplay(new Date(u.createdAt).toISOString().split('T')[0])}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer active:scale-95"
                            title="Delete user from database"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card-subtle">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                      <Settings size={24} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Application Settings</h2>
                    <p className="text-xs text-slate-500 mt-1 mb-6">
                      Account & system profile for CVR Agencies Pvt. Ltd.
                    </p>

                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-bold text-slate-600">Company Name</span>
                        <span className="font-black text-slate-900">CVR Agencies Pvt. Ltd.</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-bold text-slate-600">Logged User</span>
                        <span className="font-black text-slate-900">{user.name}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-bold text-slate-600">Account Type</span>
                        <span className="font-black text-emerald-600">{user.isAdmin ? 'Master Administrator' : 'Standard User'}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-bold text-slate-600">Data Protection Engine</span>
                        <span className="font-black text-emerald-600">Auto 10-Day Excel Sync Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>

            <footer className="py-4 text-center text-slate-400 text-xs font-bold border-t border-slate-100 bg-white/50">
              © 2026 CVR Agencies Pvt. Ltd. • All Rights Reserved
            </footer>
          </div>
        </div>
      ) : currentView === 'welcome' ? (
        /* WELCOME SCREEN */
        <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 w-full">
          <WelcomeScreen
            onGoToLogin={() => setCurrentView('login')}
            onGoToRegister={() => setCurrentView('register')}
          />
          <footer className="py-3 text-center text-slate-400 text-xs font-bold">
            © 2026 CVR Agencies Pvt. Ltd.
          </footer>
        </main>
      ) : (
        /* LOGIN & REGISTER SCREEN */
        <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 w-full">
          <AuthScreen
            initialTab={currentView === 'register' ? 'register' : 'login'}
            onBack={() => setCurrentView('welcome')}
          />
          <footer className="py-3 text-center text-slate-400 text-xs font-bold">
            © 2026 CVR Agencies Pvt. Ltd.
          </footer>
        </main>
      )}

      {/* Add Payment Modal */}
      {user && (
        <AddPaymentModal
          isOpen={isAddPaymentOpen}
          onClose={() => setIsAddPaymentOpen(false)}
          onPaymentAdded={() => {
            fetchPayments();
            fetchBackups();
            if (user.isAdmin) fetchDeleteRequests();
          }}
          currentUserName={user.name}
        />
      )}
    </div>
  );
}
