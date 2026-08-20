import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#f8fafc]">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 mb-4">The requested page does not exist.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
      >
        Return Home
      </Link>
    </div>
  );
}
