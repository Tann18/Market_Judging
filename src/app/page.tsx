'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';
import {
  MonitorPlay,
  Smartphone,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export default function Home() {
  const { state, isLoaded } = useMarket();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const liveRooms = useMemo(() => {
    return state.rooms.filter((r) => r.status === 'LIVE').length;
  }, [state.rooms]);

  const isAnyLive = liveRooms > 0;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-slate-700 selection:text-white">
      {/* Platform Navigation Header */}
      <header className="border-b border-slate-800/80 bg-[#0a0f1d] px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm tracking-tight text-white">
              Market Judging
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAnyLive ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300 font-normal">
                {mounted && isLoaded
                  ? isAnyLive
                    ? `${liveRooms} of 4 Arenas Active`
                    : 'Arenas Standby'
                  : 'Ready'}
              </span>
            </div>

            <nav className="flex items-center gap-1 text-xs">
              <Link
                href="/display"
                className="px-2.5 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Display
              </Link>
              <Link
                href="/judge"
                className="px-2.5 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Judge
              </Link>
              <Link
                href="/admin"
                className="px-2.5 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Hub Content */}
      <main className="max-w-5xl mx-auto w-full px-6 py-12 sm:py-16 flex-1 flex flex-col justify-center">
        {/* Clean, Non-AI Minimal Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Market Judging
          </h1>
        </div>

        {/* 3 Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Projector Display */}
          <Link
            href="/display"
            className="group bg-[#0d1424] border border-slate-800 hover:border-slate-700 rounded-xl p-6 flex flex-col justify-between transition-all hover:bg-[#0f172a]"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:text-white">
                <MonitorPlay className="w-5 h-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-white group-hover:text-slate-200">
                  Audience Display
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Projector dashboard showing real-time 20-company grid, head-to-head comparison charts, and live ticker tape.
                </p>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-white font-medium">
              <span>Open projector view</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Judge Controller */}
          <Link
            href="/judge"
            className="group bg-[#0d1424] border border-slate-800 hover:border-slate-700 rounded-xl p-6 flex flex-col justify-between transition-all hover:bg-[#0f172a]"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:text-white">
                <Smartphone className="w-5 h-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-white group-hover:text-slate-200">
                  Judge Controller
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Mobile interface for authenticated judges to cast bullish and bearish valuation votes in assigned rooms.
                </p>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-white font-medium">
              <span>Enter controller</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Organizer Dashboard */}
          <Link
            href="/admin"
            className="group bg-[#0d1424] border border-slate-800 hover:border-slate-700 rounded-xl p-6 flex flex-col justify-between transition-all hover:bg-[#0f172a]"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-white group-hover:text-slate-200">
                  Organizer Dashboard
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Master console for matchup assignments, round status controls, market resets, and judge credential directory.
                </p>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-white font-medium">
              <span>Open control panel</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Clean System Metadata Bar */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-[#0a0f1d] border border-slate-800/80">
            <span className="text-slate-500 block text-[11px]">Sync Mode</span>
            <span className="text-slate-300 font-medium">Supabase Realtime / Local</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0a0f1d] border border-slate-800/80">
            <span className="text-slate-500 block text-[11px]">Equities</span>
            <span className="text-slate-300 font-medium">20 Active Assets (₹100 Base)</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0a0f1d] border border-slate-800/80">
            <span className="text-slate-500 block text-[11px]">Competition Arenas</span>
            <span className="text-slate-300 font-medium">4 Concurrent Rooms</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0a0f1d] border border-slate-800/80">
            <span className="text-slate-500 block text-[11px]">Judge Roster</span>
            <span className="text-slate-300 font-medium">12 Allocated Seats</span>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        Market Judging Platform
      </footer>
    </div>
  );
}
