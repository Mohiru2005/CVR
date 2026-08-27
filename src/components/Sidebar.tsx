'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Database, 
  Settings, 
  ShieldCheck, 
  X,
  ChevronRight,
  Bell,
  HardDriveDownload
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingRequestsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  pendingRequestsCount = 0,
}) => {
  const { user } = useAuth();

  // Navigation items: Data is FIRST (1st), Dashboard is SECOND (2nd)
  const navItems = [
    { id: 'data', label: 'Data', icon: Database },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'recovery', label: 'Data Recovery', icon: HardDriveDownload },
    ...(user?.isAdmin ? [
      { 
        id: 'requests', 
        label: 'Delete Requests', 
        icon: Bell, 
        badge: pendingRequestsCount > 0 ? pendingRequestsCount : null 
      },
      { id: 'users', label: 'Users', icon: Users }
    ] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-md">
              CVR
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                  CVR AGENCIES
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 brand-dot-pulse" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Pvt. Limited
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info Capsule */}
        <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              user?.isAdmin 
                ? 'bg-slate-900 text-emerald-400' 
                : 'bg-emerald-600 text-white'
            }`}>
              {user?.isAdmin ? <ShieldCheck size={16} /> : (user?.name?.charAt(0).toUpperCase() || 'U')}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">
                {user?.name}
              </div>
              <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                {user?.isAdmin ? 'Master Admin' : 'User Account'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu (Data 1st, Dashboard 2nd) */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge ? (
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                  {isActive && <ChevronRight size={14} className="text-emerald-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* 📲 APK Download Link at Bottom of Sidebar */}
        <div className="p-3 border-t border-slate-100">
          <a
            href="/api/download-apk"
            download="CVR_Agencies.apk"
            className="w-full flex items-center justify-between px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>📲</span>
              <span>Download Android App</span>
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-md">.APK</span>
          </a>
        </div>
      </aside>
    </>
  );
};
