'use client';

import React, { useEffect, useState, useRef, useId, useMemo } from 'react';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';
import { Company, Room } from '@/types/market';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  BarChart3,
  Clock,
  Search,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ArrowLeft,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface CompanyFlashState {
  [companyId: string]: 'UP' | 'DOWN' | null;
}

// Micro SVG Sparkline
function Sparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  const gradientId = useId();

  if (!data || data.length < 2) {
    return (
      <div className="h-7 w-20 flex items-center justify-center text-[10px] text-slate-500 font-mono">
        Flat
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 84;
  const height = 26;
  const padding = 2;

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  const firstPoint = `${padding},${height - padding}`;
  const lastPoint = `${width - padding},${height - padding}`;
  const areaPoints = `${firstPoint} ${points} ${lastPoint}`;

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Detailed Modal SVG Chart
function DetailCompanyChart({ company }: { company: Company }) {
  const gradientId = useId();
  const hist = company.history.length > 0 ? company.history : [company.startingPrice, company.price];

  const min = Math.min(...hist, company.startingPrice) - 1;
  const max = Math.max(...hist, company.startingPrice) + 1;
  const range = max - min || 1;
  const width = 500;
  const height = 180;
  const padX = 30;
  const padY = 20;

  const points = hist
    .map((val, idx) => {
      const x = padX + (idx / Math.max(hist.length - 1, 1)) * (width - padX * 2);
      const y = height - padY - ((val - min) / range) * (height - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const yBase = height - padY - ((company.startingPrice - min) / range) * (height - padY * 2);
  const isPositive = company.price >= company.startingPrice;
  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  const firstPoint = `${padX},${height - padY}`;
  const lastPoint = `${width - padX},${height - padY}`;
  const areaPoints = `${firstPoint} ${points} ${lastPoint}`;

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible select-none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="#1e293b" strokeDasharray="3 3" />
        <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="#1e293b" strokeDasharray="3 3" />
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#1e293b" strokeDasharray="3 3" />

        <line x1={padX} y1={yBase} x2={width - padX} y2={yBase} stroke="#475569" strokeDasharray="4 2" strokeWidth="1" />
        <text x={padX + 4} y={yBase - 4} fill="#64748b" fontSize="9" fontFamily="monospace">
          Base ₹{company.startingPrice.toFixed(2)}
        </text>

        <text x={width - padX - 2} y={padY + 10} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
          ₹{max.toFixed(2)}
        </text>
        <text x={width - padX - 2} y={height - padY - 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
          ₹{min.toFixed(2)}
        </text>

        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    </div>
  );
}

// Head-to-Head Comparative Line Chart
function HeadToHeadChart({ companyA, companyB }: { companyA?: Company; companyB?: Company }) {
  if (!companyA || !companyB) {
    return (
      <div className="h-32 w-full flex items-center justify-center text-slate-500 text-xs font-mono">
        Awaiting tick data...
      </div>
    );
  }

  const histA = companyA.history.length > 0 ? companyA.history : [companyA.startingPrice, companyA.price];
  const histB = companyB.history.length > 0 ? companyB.history : [companyB.startingPrice, companyB.price];

  const maxLen = Math.max(histA.length, histB.length, 2);
  const allValues = [...histA, ...histB, 100];
  const minVal = Math.min(...allValues) - 2;
  const maxVal = Math.max(...allValues) + 2;
  const range = maxVal - minVal || 1;

  const width = 380;
  const height = 130;
  const padX = 24;
  const padY = 14;

  const getPoints = (hist: number[]) => {
    return hist
      .map((val, idx) => {
        const x = padX + (idx / (maxLen - 1)) * (width - padX * 2);
        const y = height - padY - ((val - minVal) / range) * (height - padY * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const pointsA = getPoints(histA);
  const pointsB = getPoints(histB);
  const y100 = height - padY - ((100 - minVal) / range) * (height - padY * 2);

  return (
    <div className="relative w-full pt-1">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible select-none">
        <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="#1e293b" strokeDasharray="2 2" />
        <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="#1e293b" strokeDasharray="2 2" />
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#1e293b" strokeDasharray="2 2" />

        <line x1={padX} y1={y100} x2={width - padX} y2={y100} stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
        <text x={padX + 4} y={y100 - 3} fill="#64748b" fontSize="8.5" fontFamily="monospace">
          Base ₹100
        </text>

        <text x={width - padX - 2} y={padY + 8} fill="#64748b" fontSize="8.5" textAnchor="end" fontFamily="monospace">
          ₹{maxVal.toFixed(0)}
        </text>
        <text x={width - padX - 2} y={height - padY - 3} fill="#64748b" fontSize="8.5" textAnchor="end" fontFamily="monospace">
          ₹{minVal.toFixed(0)}
        </text>

        <polyline fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pointsA} />
        <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pointsB} />
      </svg>
    </div>
  );
}

export default function DisplayPage() {
  const { state } = useMarket();
  const [flashStates, setFlashStates] = useState<CompanyFlashState>({});
  const prevPrices = useRef<{ [id: string]: number }>({});
  const [currentTime, setCurrentTime] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'GAINERS' | 'LOSERS' | 'ARENA'>('ALL');
  const [sortBy, setSortBy] = useState<'CHANGE' | 'PRICE_DESC' | 'PRICE_ASC' | 'TICKER'>('CHANGE');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = (direction: 'UP' | 'DOWN') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const freq = direction === 'UP' ? 750 : 420;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 250);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!state.companies || state.companies.length === 0) return;

    const newFlashes: CompanyFlashState = {};
    let hasChanges = false;
    let lastDirection: 'UP' | 'DOWN' = 'UP';

    state.companies.forEach((comp) => {
      const prev = prevPrices.current[comp.id];
      if (prev !== undefined && prev !== comp.price) {
        hasChanges = true;
        const dir = comp.price > prev ? 'UP' : 'DOWN';
        newFlashes[comp.id] = dir;
        lastDirection = dir;
      }
      prevPrices.current[comp.id] = comp.price;
    });

    if (hasChanges) {
      playChime(lastDirection);
      setFlashStates((curr) => ({ ...curr, ...newFlashes }));
      const timer = setTimeout(() => {
        setFlashStates((curr) => {
          const cleared = { ...curr };
          Object.keys(newFlashes).forEach((id) => {
            cleared[id] = null;
          });
          return cleared;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.companies]);

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const totalVotes = state.voteLogs.length;
  const sortedByChange = useMemo(() => {
    return [...state.companies].sort((a, b) => {
      const changeA = a.price - a.startingPrice;
      const changeB = b.price - b.startingPrice;
      return changeB - changeA;
    });
  }, [state.companies]);

  const topGainer = sortedByChange[0];
  const topLoser = sortedByChange[sortedByChange.length - 1];

  const activeArenaIds = useMemo(() => {
    const ids = new Set<string>();
    state.rooms.forEach((r) => {
      ids.add(r.companyAId);
      ids.add(r.companyBId);
    });
    return ids;
  }, [state.rooms]);

  const displayedCompanies = useMemo(() => {
    let list = [...state.companies];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }

    if (filterMode === 'GAINERS') {
      list = list.filter((c) => c.price > c.startingPrice);
    } else if (filterMode === 'LOSERS') {
      list = list.filter((c) => c.price < c.startingPrice);
    } else if (filterMode === 'ARENA') {
      list = list.filter((c) => activeArenaIds.has(c.id));
    }

    if (sortBy === 'CHANGE') {
      list.sort((a, b) => (b.price - b.startingPrice) - (a.price - a.startingPrice));
    } else if (sortBy === 'PRICE_DESC') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'PRICE_ASC') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'TICKER') {
      list.sort((a, b) => a.ticker.localeCompare(b.ticker));
    }

    return list;
  }, [state.companies, searchQuery, filterMode, sortBy, activeArenaIds]);

  const selectedCompanyLogs = useMemo(() => {
    if (!selectedCompany) return [];
    return state.voteLogs
      .filter((log) => log.companyTicker === selectedCompany.ticker)
      .slice(0, 10);
  }, [selectedCompany, state.voteLogs]);

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Header - Clean, professional layout with back navigation */}
      <header className="border-b border-slate-800 bg-[#080d1a] px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg bg-[#0e1626] hover:bg-[#142036] border border-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Return to Home Hub"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Hub</span>
          </Link>

          <div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-sky-400 font-semibold mb-0.5">
              MARKET ARENA / LIVE FLOOR
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Market Overview
            </h1>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-sans pl-4 border-l border-slate-800 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Volume:</span>
              <strong className="text-white font-mono tabular-nums">{totalVotes}</strong>
            </div>

            {topGainer && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800/80">
                <span className="text-slate-400">Top Gainer:</span>
                <span className="text-emerald-400 font-bold font-mono">{topGainer.ticker}</span>
                <span className="text-emerald-400 font-mono tabular-nums font-medium">
                  +₹{(topGainer.price - topGainer.startingPrice).toFixed(2)}
                </span>
              </div>
            )}

            {topLoser && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800/80">
                <span className="text-slate-400">Top Loser:</span>
                <span className="text-rose-400 font-bold font-mono">{topLoser.ticker}</span>
                <span className="text-rose-400 font-mono tabular-nums font-medium">
                  -₹{(topLoser.startingPrice - topLoser.price).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side controls & navigation */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/judge"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#0e1626] hover:bg-[#142036] border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
            title="Open Judge Remote"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Judge</span>
          </Link>

          <Link
            href="/admin"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#0e1626] hover:bg-[#142036] border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
            title="Open Control Room"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Admin</span>
          </Link>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute chimes' : 'Enable audio chimes'}
            className="p-1.5 rounded-md bg-[#0e1626] border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-md bg-[#0e1626] border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2 font-mono text-xs bg-[#0e1626] border border-slate-800 px-3 py-1.5 rounded-md text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="tabular-nums font-medium">{currentTime || '00:00:00'}</span>
          </div>
        </div>
      </header>

      {/* Ticker tape marquee */}
      <div className="border-b border-slate-800 bg-[#0a1122] py-2 overflow-hidden relative">
        <div className="animate-ticker flex items-center space-x-6 whitespace-nowrap text-xs font-sans">
          {[...state.companies, ...state.companies].map((comp, idx) => {
            const diff = comp.price - comp.startingPrice;
            const pct = (diff / comp.startingPrice) * 100;
            const isPos = diff >= 0;

            return (
              <div
                key={`${comp.id}-${idx}`}
                onClick={() => setSelectedCompany(comp)}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0e1626] border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <span className="font-bold text-sky-400 font-mono">{comp.ticker}</span>
                <span className="tabular-nums font-mono font-medium text-slate-100">
                  ₹{comp.price.toFixed(2)}
                </span>
                <span className={`text-[11px] font-mono font-medium ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? '+' : ''}{pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-5 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Spotlight Rooms Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Active Arenas
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-[#38bdf8] inline-block rounded" /> Comp A
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-[#f59e0b] inline-block rounded" /> Comp B
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {state.rooms.map((room) => {
              const compA = state.companies.find((c) => c.id === room.companyAId);
              const compB = state.companies.find((c) => c.id === room.companyBId);

              const priceA = compA?.price ?? 100;
              const priceB = compB?.price ?? 100;
              const spread = priceA - priceB;
              const leader = spread > 0 ? compA?.ticker : spread < 0 ? compB?.ticker : 'Tied';

              const isLive = room.status === 'LIVE';
              const isPaused = room.status === 'PAUSED';

              return (
                <div
                  key={room.id}
                  className="bg-[#0e1626] border border-slate-800 rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-white uppercase font-sans">
                      ROOM 0{room.id}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
                        isLive
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                          : isPaused
                          ? 'bg-amber-950/70 text-amber-400 border border-amber-500/40'
                          : 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div
                      onClick={() => compA && setSelectedCompany(compA)}
                      className="bg-[#080d1a] border border-slate-800/80 hover:border-sky-500/50 rounded p-2.5 cursor-pointer transition-colors"
                    >
                      <span className="text-[10px] font-mono text-sky-400 font-bold block">
                        {compA?.ticker || '---'}
                      </span>
                      <div className="text-sm font-bold font-mono text-white mt-1 tabular-nums">
                        ₹{compA ? compA.price.toFixed(2) : '100.00'}
                      </div>
                      <span className={`text-[10px] font-mono ${compA && compA.price >= compA.startingPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {compA && compA.price >= compA.startingPrice ? '+' : ''}
                        {compA ? (compA.price - compA.startingPrice).toFixed(1) : '0'}
                      </span>
                    </div>

                    <div
                      onClick={() => compB && setSelectedCompany(compB)}
                      className="bg-[#080d1a] border border-slate-800/80 hover:border-amber-500/50 rounded p-2.5 cursor-pointer transition-colors"
                    >
                      <span className="text-[10px] font-mono text-amber-400 font-bold block">
                        {compB?.ticker || '---'}
                      </span>
                      <div className="text-sm font-bold font-mono text-white mt-1 tabular-nums">
                        ₹{compB ? compB.price.toFixed(2) : '100.00'}
                      </div>
                      <span className={`text-[10px] font-mono ${compB && compB.price >= compB.startingPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {compB && compB.price >= compB.startingPrice ? '+' : ''}
                        {compB ? (compB.price - compB.startingPrice).toFixed(1) : '0'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#080d1a] border border-slate-800 rounded p-1.5">
                    <HeadToHeadChart companyA={compA} companyB={compB} />
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div>
                      Leader: <strong className="text-white font-mono">{leader}</strong>
                    </div>
                    <div>
                      Spread: <strong className="text-white font-mono tabular-nums">₹{Math.abs(spread).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 20-Stock Wall Section */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                All Companies ({displayedCompanies.length})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex rounded-md bg-[#0e1626] border border-slate-800 p-0.5">
                {(['ALL', 'GAINERS', 'LOSERS', 'ARENA'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMode(m)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      filterMode === m
                        ? 'bg-[#1e293b] text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter ticker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0e1626] border border-slate-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 w-32"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as unknown as typeof sortBy)}
                className="bg-[#0e1626] border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="CHANGE">Sort by Change</option>
                <option value="PRICE_DESC">Price High-Low</option>
                <option value="PRICE_ASC">Price Low-High</option>
                <option value="TICKER">Ticker A-Z</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {displayedCompanies.map((comp) => {
              const diff = comp.price - comp.startingPrice;
              const pct = (diff / comp.startingPrice) * 100;
              const isPositive = diff >= 0;
              const flash = flashStates[comp.id];

              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCompany(comp)}
                  className={`p-3 rounded-lg border bg-[#0e1626] transition-all flex flex-col justify-between cursor-pointer hover:border-slate-700 shadow-sm ${
                    flash === 'UP'
                      ? 'flash-up border-emerald-500'
                      : flash === 'DOWN'
                      ? 'flash-down border-rose-500'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold font-mono text-sm text-white">
                        {comp.ticker}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[110px]">
                        {comp.name}
                      </p>
                    </div>

                    <Sparkline data={comp.history} isPositive={isPositive} />
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                    <span className="text-base font-bold font-mono text-white tabular-nums">
                      ₹{comp.price.toFixed(2)}
                    </span>

                    <span
                      className={`text-xs font-mono font-medium tabular-nums ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}{pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Live recent votes banner */}
      {state.voteLogs.length > 0 && (
        <div className="border-t border-slate-800 bg-[#080d1a] py-2 px-6 overflow-hidden flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="font-bold text-sky-400 shrink-0 uppercase tracking-wider text-[11px]">
            Latest votes:
          </span>
          <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
            {state.voteLogs.slice(0, 6).map((log) => (
              <span key={log.id} className="inline-flex items-center gap-1.5 bg-[#0e1626] border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                <span className={log.delta > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {log.companyTicker}
                </span>
                <span className="text-slate-500">R{log.roomNumber}</span>
                <span className="text-slate-200 tabular-nums">₹{log.newPrice.toFixed(2)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={selectedCompany !== null} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        {selectedCompany && (
          <DialogContent className="bg-[#0e1626] border border-slate-800 text-slate-100 max-w-lg p-5">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold font-mono text-white">
                    {selectedCompany.ticker}
                  </div>
                  <div className="text-xs text-slate-400">
                    {selectedCompany.name}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-white tabular-nums">
                    ₹{selectedCompany.price.toFixed(2)}
                  </div>
                  <span className={`text-xs font-mono ${selectedCompany.price >= selectedCompany.startingPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedCompany.price >= selectedCompany.startingPrice ? '+' : ''}
                    {(selectedCompany.price - selectedCompany.startingPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs font-mono">
              <div className="bg-[#080d1a] border border-slate-800 rounded p-2">
                <span className="text-slate-500 text-[10px] block">Baseline</span>
                <span className="font-bold text-slate-300">₹{selectedCompany.startingPrice.toFixed(2)}</span>
              </div>
              <div className="bg-[#080d1a] border border-slate-800 rounded p-2">
                <span className="text-slate-500 text-[10px] block">High</span>
                <span className="font-bold text-emerald-400">
                  ₹{Math.max(...selectedCompany.history, selectedCompany.startingPrice).toFixed(2)}
                </span>
              </div>
              <div className="bg-[#080d1a] border border-slate-800 rounded p-2">
                <span className="text-slate-500 text-[10px] block">Low</span>
                <span className="font-bold text-rose-400">
                  ₹{Math.min(...selectedCompany.history, selectedCompany.startingPrice).toFixed(2)}
                </span>
              </div>
              <div className="bg-[#080d1a] border border-slate-800 rounded p-2">
                <span className="text-slate-500 text-[10px] block">Ticks</span>
                <span className="font-bold text-sky-400">{selectedCompany.history.length}</span>
              </div>
            </div>

            <div className="bg-[#080d1a] border border-slate-800 rounded-lg p-2.5">
              <DetailCompanyChart company={selectedCompany} />
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-medium text-slate-400">
                Recent votes for {selectedCompany.ticker}:
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1 text-xs font-mono">
                {selectedCompanyLogs.length === 0 ? (
                  <div className="text-center py-3 text-slate-500 text-[11px]">
                    No votes recorded yet.
                  </div>
                ) : (
                  selectedCompanyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between bg-[#080d1a] border border-slate-800/80 px-2.5 py-1 rounded"
                    >
                      <span className={log.delta > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {log.delta > 0 ? '+ Bullish' : '- Bearish'}
                      </span>
                      <span className="text-slate-400 text-[11px]">Room 0{log.roomNumber} • Seat {log.judgeSlot}</span>
                      <span className="text-slate-200 tabular-nums">₹{log.newPrice.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
