'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';
import { Judge } from '@/types/market';
import {
  Lock,
  Unlock,
  KeyRound,
  AlertCircle,
  LogOut,
  UserCheck,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Delete,
  History,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';

export default function JudgePage() {
  const { state, isLoaded, getJudgeByPin, submitVote } = useMarket();

  const [pinInput, setPinInput] = useState('');
  const [currentJudge, setCurrentJudge] = useState<Judge | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCompanyFocus, setActiveCompanyFocus] = useState<'BOTH' | 'A' | 'B'>('BOTH');
  const [showHistory, setShowHistory] = useState(false);
  const [personalVoteCounts, setPersonalVoteCounts] = useState<{ [companyId: string]: number }>({});

  // Auto-restore session from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedPin = sessionStorage.getItem('judge_session_pin');
    if (savedPin) {
      const judge = getJudgeByPin(savedPin);
      if (judge) {
        setCurrentJudge(judge);
      }
    }
  }, [getJudgeByPin, isLoaded]);

  // Track personal votes cast by this judge from the global voteLogs
  useEffect(() => {
    if (!currentJudge) return;

    const counts: { [companyId: string]: number } = {};
    state.voteLogs.forEach((log) => {
      if (log.roomNumber === currentJudge.roomNumber && log.judgeSlot === currentJudge.judgeSlot) {
        const comp = state.companies.find((c) => c.ticker === log.companyTicker);
        if (comp) {
          counts[comp.id] = (counts[comp.id] || 0) + 1;
        }
      }
    });
    setPersonalVoteCounts(counts);
  }, [state.voteLogs, currentJudge, state.companies]);

  const handleKeypadPress = (val: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + val);
      setErrorMsg(null);
    }
  };

  const handleKeypadDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setErrorMsg('Please enter your 4-digit PIN');
      return;
    }

    setIsLoadingAuth(true);

    try {
      const res = await fetch('/api/judge/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.judge) {
        setCurrentJudge(data.judge);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('judge_session_pin', data.judge.pin);
        }
      } else {
        const localJudge = getJudgeByPin(cleanPin);
        if (localJudge) {
          setCurrentJudge(localJudge);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('judge_session_pin', localJudge.pin);
          }
        } else {
          setErrorMsg(data.message || 'Invalid PIN code');
        }
      }
    } catch {
      const localJudge = getJudgeByPin(cleanPin);
      if (localJudge) {
        setCurrentJudge(localJudge);
      } else {
        setErrorMsg('Authentication error. Please try again.');
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    setCurrentJudge(null);
    setPinInput('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('judge_session_pin');
    }
  };

  const handleVote = async (companyId: string, direction: 'UP' | 'DOWN') => {
    if (!currentJudge) return;

    const room = state.rooms.find((r) => r.id === currentJudge.roomNumber);
    if (!room) return;

    if (room.status !== 'LIVE') {
      setErrorMsg(`Room is currently ${room.status.toLowerCase()}`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const result = await submitVote(currentJudge.roomNumber, currentJudge.judgeSlot, companyId, direction);

    if (!result.success && result.message) {
      setErrorMsg(result.message);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  // Login View
  if (!currentJudge) {
    return (
      <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-center items-center p-4 select-none">
        {/* Navigation Bar above login modal */}
        <div className="w-full max-w-sm flex items-center justify-between mb-4 text-xs font-medium text-slate-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/display"
              className="hover:text-sky-400 transition-colors"
            >
              Display
            </Link>
            <span className="text-slate-700">·</span>
            <Link
              href="/admin"
              className="hover:text-amber-400 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>

        <div className="w-full max-w-sm bg-[#0e1626] border border-slate-800 rounded-xl p-6 shadow-2xl">
          <div className="text-center space-y-1 mb-5">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Judge Controller
            </h1>
            <p className="text-xs text-slate-400">
              Enter your assigned 4-digit PIN to begin judging
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Security PIN</span>
                <span className="font-mono text-emerald-400 font-semibold">{pinInput.length}/4 digits</span>
              </div>
              <input
                type="password"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="••••"
                className="w-full bg-[#080d1a] border border-slate-700 rounded-lg px-4 py-2.5 text-center text-2xl font-mono tracking-[0.35em] font-bold text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-700"
              />
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-10 rounded-md bg-[#080d1a] hover:bg-slate-900 border border-slate-800 text-base font-bold text-slate-200 active:scale-95 transition-all cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="h-10 rounded-md bg-[#080d1a] hover:bg-rose-950/40 border border-slate-800 text-xs text-rose-400 font-medium active:scale-95 transition-all cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-10 rounded-md bg-[#080d1a] hover:bg-slate-900 border border-slate-800 text-base font-bold text-slate-200 active:scale-95 transition-all cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadDelete}
                className="h-10 rounded-md bg-[#080d1a] hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 active:scale-95 transition-all cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoadingAuth || pinInput.length < 4}
              className="w-full h-10 rounded-md bg-[#00c57e] hover:bg-[#00b070] disabled:opacity-50 text-slate-950 font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer"
            >
              {isLoadingAuth ? 'Checking PIN...' : 'Access Controller'}
            </button>
          </form>

          {/* Quick PINs */}
          <div className="mt-5 pt-3 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
              <span>Quick fill PIN:</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
              {[
                { label: 'R1·J1', pin: '1001' },
                { label: 'R1·J2', pin: '1002' },
                { label: 'R2·J1', pin: '2001' },
                { label: 'R2·J2', pin: '2002' },
                { label: 'R3·J1', pin: '3001' },
                { label: 'R3·J2', pin: '3002' },
                { label: 'R4·J1', pin: '4001' },
                { label: 'R4·J2', pin: '4002' },
              ].map((item) => (
                <button
                  key={item.pin}
                  type="button"
                  onClick={() => {
                    setPinInput(item.pin);
                    setErrorMsg(null);
                  }}
                  className="px-1.5 py-1 rounded bg-[#080d1a] hover:bg-slate-900 border border-slate-800 text-slate-300 text-[10px] text-center cursor-pointer transition-colors"
                >
                  <span className="block text-slate-500 text-[9px]">{item.label}</span>
                  <span className="font-bold text-sky-400">{item.pin}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const room = state.rooms.find((r) => r.id === currentJudge.roomNumber);
  const compA = room ? state.companies.find((c) => c.id === room.companyAId) : undefined;
  const compB = room ? state.companies.find((c) => c.id === room.companyBId) : undefined;

  const isLive = room?.status === 'LIVE';
  const isPaused = room?.status === 'PAUSED';
  const increment = room?.increment || 2;

  const totalJudgeVotes = (compA ? personalVoteCounts[compA.id] || 0 : 0) +
    (compB ? personalVoteCounts[compB.id] || 0 : 0);

  const priceA = compA?.price ?? 100;
  const priceB = compB?.price ?? 100;
  const spread = priceA - priceB;

  const judgeRecentLogs = state.voteLogs
    .filter((log) => log.roomNumber === currentJudge.roomNumber && log.judgeSlot === currentJudge.judgeSlot)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col select-none">
      {/* Top Status Bar with back navigation */}
      <header className="border-b border-slate-800 bg-[#0e1626] px-4 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-[#080d1a] hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Return to Home Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-white">
                ROOM 0{currentJudge.roomNumber}
              </span>
              <span className="text-[11px] text-slate-400">
                Seat {currentJudge.judgeSlot} • {currentJudge.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-[#080d1a] hover:bg-slate-900 border border-slate-800 text-[11px] text-slate-300 transition-colors"
          >
            Display
          </Link>

          <span
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wider ${
              isLive
                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                : isPaused
                ? 'bg-amber-950/70 text-amber-400 border border-amber-500/40'
                : 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
            }`}
          >
            {room?.status}
          </span>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 rounded bg-[#080d1a] hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Touch-Optimized Layout */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-3.5">
        {!isLive && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
              isPaused
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <div>
              <strong className="block font-medium">
                {isPaused ? 'Voting paused by organizer' : 'Matchup concluded and locked'}
              </strong>
              <span className="text-[11px] text-slate-400">
                {isPaused ? 'Buttons will reactivate once resumed.' : 'Final scores are saved.'}
              </span>
            </div>
          </div>
        )}

        {/* Matchup Header Bar */}
        <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-400 font-mono">{compA?.ticker || 'A'}</span>
            <span className="text-slate-500 font-sans">vs</span>
            <span className="font-bold text-amber-400 font-mono">{compB?.ticker || 'B'}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Step: <strong className="text-white font-mono">±₹{increment.toFixed(2)}</strong></span>
            <span>Your votes: <strong className="text-white font-mono">{totalJudgeVotes}</strong></span>
          </div>
        </div>

        {/* View Focus Mode */}
        <div className="flex rounded-md bg-[#0e1626] border border-slate-800 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveCompanyFocus('BOTH')}
            className={`flex-1 py-1 rounded font-medium transition-colors cursor-pointer ${
              activeCompanyFocus === 'BOTH' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side by Side
          </button>
          <button
            type="button"
            onClick={() => setActiveCompanyFocus('A')}
            className={`flex-1 py-1 rounded font-medium transition-colors cursor-pointer ${
              activeCompanyFocus === 'A' ? 'bg-sky-950 text-sky-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {compA?.ticker || 'Comp A'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCompanyFocus('B')}
            className={`flex-1 py-1 rounded font-medium transition-colors cursor-pointer ${
              activeCompanyFocus === 'B' ? 'bg-amber-950 text-amber-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {compB?.ticker || 'Comp B'}
          </button>
        </div>

        {/* Comp A Card */}
        {compA && (activeCompanyFocus === 'BOTH' || activeCompanyFocus === 'A') && (
          <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
                COMPANY A
              </span>
              <span className="text-[11px] text-slate-400">
                {personalVoteCounts[compA.id] || 0} votes by you
              </span>
            </div>

            <div className="text-center py-2">
              <h3 className="text-2xl font-bold font-mono text-white">
                {compA.ticker}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{compA.name}</p>

              <div className="mt-2 text-4xl sm:text-5xl font-mono font-bold text-white tabular-nums">
                ₹{compA.price.toFixed(2)}
              </div>
              <div className={`text-xs font-mono mt-1 ${compA.price >= compA.startingPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                {compA.price >= compA.startingPrice ? '+' : ''}
                {(compA.price - compA.startingPrice).toFixed(2)} ({(((compA.price - compA.startingPrice) / compA.startingPrice) * 100).toFixed(1)}%)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={!isLive}
                onClick={() => handleVote(compA.id, 'UP')}
                className={`py-3.5 px-3 rounded-lg font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isLive
                    ? 'bg-[#00c57e] hover:bg-[#00b070] text-slate-950 active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4 stroke-[3]" />
                <span>Bullish (+₹{increment})</span>
              </button>

              <button
                type="button"
                disabled={!isLive}
                onClick={() => handleVote(compA.id, 'DOWN')}
                className={`py-3.5 px-3 rounded-lg font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isLive
                    ? 'bg-[#f43f5e] hover:bg-[#e11d48] text-white active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ArrowDown className="w-4 h-4 stroke-[3]" />
                <span>Bearish (-₹{increment})</span>
              </button>
            </div>
          </div>
        )}

        {/* Comp B Card */}
        {compB && (activeCompanyFocus === 'BOTH' || activeCompanyFocus === 'B') && (
          <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                COMPANY B
              </span>
              <span className="text-[11px] text-slate-400">
                {personalVoteCounts[compB.id] || 0} votes by you
              </span>
            </div>

            <div className="text-center py-2">
              <h3 className="text-2xl font-bold font-mono text-white">
                {compB.ticker}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{compB.name}</p>

              <div className="mt-2 text-4xl sm:text-5xl font-mono font-bold text-white tabular-nums">
                ₹{compB.price.toFixed(2)}
              </div>
              <div className={`text-xs font-mono mt-1 ${compB.price >= compB.startingPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                {compB.price >= compB.startingPrice ? '+' : ''}
                {(compB.price - compB.startingPrice).toFixed(2)} ({(((compB.price - compB.startingPrice) / compB.startingPrice) * 100).toFixed(1)}%)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={!isLive}
                onClick={() => handleVote(compB.id, 'UP')}
                className={`py-3.5 px-3 rounded-lg font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isLive
                    ? 'bg-[#00c57e] hover:bg-[#00b070] text-slate-950 active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4 stroke-[3]" />
                <span>Bullish (+₹{increment})</span>
              </button>

              <button
                type="button"
                disabled={!isLive}
                onClick={() => handleVote(compB.id, 'DOWN')}
                className={`py-3.5 px-3 rounded-lg font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isLive
                    ? 'bg-[#f43f5e] hover:bg-[#e11d48] text-white active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ArrowDown className="w-4 h-4 stroke-[3]" />
                <span>Bearish (-₹{increment})</span>
              </button>
            </div>
          </div>
        )}

        {/* Recent personal votes history */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#0e1626] border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5" />
              <span>Your recent votes ({judgeRecentLogs.length})</span>
            </div>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showHistory && (
            <div className="mt-2 p-2.5 rounded-lg bg-[#0e1626] border border-slate-800 space-y-1.5 text-xs font-mono">
              {judgeRecentLogs.length === 0 ? (
                <div className="text-center py-2 text-slate-500 text-[11px]">
                  No votes cast yet.
                </div>
              ) : (
                judgeRecentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 rounded bg-[#080d1a] border border-slate-800/80"
                  >
                    <span className={log.delta > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {log.companyTicker} {log.delta > 0 ? `+₹${log.delta}` : `-₹${Math.abs(log.delta)}`}
                    </span>
                    <span className="text-slate-300 tabular-nums">₹{log.newPrice.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
