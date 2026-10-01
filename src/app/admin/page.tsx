'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';
import { Company } from '@/types/market';
import {
  Lock,
  Play,
  Pause,
  RotateCcw,
  Users,
  LayoutGrid,
  Activity,
  FileText,
  Copy,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  Download,
  Search,
  ExternalLink,
  ArrowLeft,
  Trash2,
  Building2,
  Plus,
  Pencil,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AdminPage() {
  const {
    state,
    setRoomStatus,
    setAllRoomsStatus,
    assignRoomMatchup,
    setRoomIncrement,
    resetMarket,
    clearAuditLogs,
    updateCompany,
    addCompany,
    deleteCompany,
  } = useMarket();

  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearAuditConfirm, setShowClearAuditConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'matchups' | 'controls' | 'companies' | 'judges' | 'audit'>('controls');

  // Company management state
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    ticker: '',
    price: '',
    startingPrice: '',
  });
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyFormError, setCompanyFormError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    ticker: '',
    price: '100.00',
  });
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [addCompanyError, setAddCompanyError] = useState<string | null>(null);

  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Audit log filters
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logRoomFilter, setLogRoomFilter] = useState<number | 'ALL'>('ALL');
  const [logDirectionFilter, setLogDirectionFilter] = useState<'ALL' | 'UP' | 'DOWN'>('ALL');

  // Judge search
  const [judgeSearchQuery, setJudgeSearchQuery] = useState('');

  // Check persistent session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoadingAuth(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pinInput.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('admin_authenticated', 'true');
        }
      } else {
        setErrorMsg(data.message || 'Invalid password');
      }
    } catch {
      setErrorMsg('Unable to connect. Please try again.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_authenticated');
    }
  };

  const handleCopyPin = (pin: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedPin(pin);
      setTimeout(() => setCopiedPin(null), 2000);
    }
  };

  const handleResetConfirm = () => {
    resetMarket();
    setShowResetConfirm(false);
  };

  const handleClearAuditConfirm = async () => {
    await clearAuditLogs();
    setShowClearAuditConfirm(false);
  };

  const handleExportCSV = () => {
    if (state.voteLogs.length === 0) {
      alert('No events logged to export.');
      return;
    }

    const headers = ['Timestamp', 'Time', 'Room', 'Judge Seat', 'Company', 'Delta', 'New Price'];
    const rows = state.voteLogs.map((log) => [
      log.timestamp,
      `"${new Date(log.timestamp).toLocaleTimeString()}"`,
      log.roomNumber,
      log.judgeSlot,
      log.companyTicker,
      log.delta,
      log.newPrice.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `market-events-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleSwapRoom = (roomId: number, currentA: string, currentB: string) => {
    assignRoomMatchup(roomId, currentB, currentA);
  };

  const handleOpenEditCompany = (company: Company) => {
    setEditingCompany(company);
    setEditForm({
      name: company.name,
      ticker: company.ticker,
      price: company.price.toFixed(2),
      startingPrice: company.startingPrice.toFixed(2),
    });
    setCompanyFormError(null);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    const trimmedName = editForm.name.trim();
    const trimmedTicker = editForm.ticker.trim().toUpperCase();
    const parsedPrice = parseFloat(editForm.price);
    const parsedStartingPrice = parseFloat(editForm.startingPrice);

    if (!trimmedName) {
      setCompanyFormError('Company name is required.');
      return;
    }
    if (!trimmedTicker) {
      setCompanyFormError('Ticker symbol is required.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setCompanyFormError('Please enter a valid positive price.');
      return;
    }
    if (isNaN(parsedStartingPrice) || parsedStartingPrice <= 0) {
      setCompanyFormError('Please enter a valid positive starting price.');
      return;
    }

    setIsSavingCompany(true);
    setCompanyFormError(null);
    try {
      await updateCompany(editingCompany.id, {
        name: trimmedName,
        ticker: trimmedTicker,
        price: parsedPrice,
        startingPrice: parsedStartingPrice,
      });
      setEditingCompany(null);
    } catch (err: any) {
      setCompanyFormError(err.message || 'Failed to update company.');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleQuickAdjustPrice = async (company: Company, delta: number) => {
    const newPrice = Math.max(0.01, Math.round((company.price + delta) * 100) / 100);
    await updateCompany(company.id, { price: newPrice });
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCompanyForm.name.trim();
    const trimmedTicker = newCompanyForm.ticker.trim().toUpperCase();
    const parsedPrice = parseFloat(newCompanyForm.price);

    if (!trimmedName) {
      setAddCompanyError('Company name is required.');
      return;
    }
    if (!trimmedTicker) {
      setAddCompanyError('Ticker symbol is required.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setAddCompanyError('Please enter a valid starting price.');
      return;
    }

    setIsAddingCompany(true);
    setAddCompanyError(null);
    try {
      await addCompany({
        name: trimmedName,
        ticker: trimmedTicker,
        price: parsedPrice,
        startingPrice: parsedPrice,
      });
      setIsAddModalOpen(false);
      setNewCompanyForm({ name: '', ticker: '', price: '100.00' });
    } catch (err: any) {
      setAddCompanyError(err.message || 'Failed to add company.');
    } finally {
      setIsAddingCompany(false);
    }
  };

  const handleDeleteCompanyConfirm = async () => {
    if (!deletingCompany) return;
    setDeleteError(null);
    try {
      await deleteCompany(deletingCompany.id);
      setDeletingCompany(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete company.');
    }
  };

  // Login View - Clean, unpretentious SaaS modal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-center items-center p-4">
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
              href="/judge"
              className="hover:text-emerald-400 transition-colors"
            >
              Judge
            </Link>
          </div>
        </div>

        <div className="w-full max-w-sm bg-[#0e1626] border border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xl">
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Control Room Login
            </h1>
            <p className="text-xs text-slate-400">
              Enter your authorization key to access the organizer console
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Enter password"
                autoFocus
                className="w-full bg-[#080d1a] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-100 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoadingAuth}
              className="w-full h-10 rounded-lg bg-[#00c57e] hover:bg-[#00b070] text-slate-950 font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-60"
            >
              {isLoadingAuth ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setPinInput('admin123')}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Default Key: <strong className="text-slate-300">admin123</strong>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered audit logs
  const filteredLogs = state.voteLogs.filter((log) => {
    if (logRoomFilter !== 'ALL' && log.roomNumber !== logRoomFilter) return false;
    if (logDirectionFilter === 'UP' && log.delta <= 0) return false;
    if (logDirectionFilter === 'DOWN' && log.delta >= 0) return false;
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase().trim();
      const matchTicker = log.companyTicker.toLowerCase().includes(q);
      const matchRoom = `room ${log.roomNumber}`.includes(q) || `r${log.roomNumber}`.includes(q);
      if (!matchTicker && !matchRoom) return false;
    }
    return true;
  });

  // Filtered judges
  const filteredJudges = state.judges.filter((judge) => {
    if (!judgeSearchQuery.trim()) return true;
    const q = judgeSearchQuery.toLowerCase().trim();
    return judge.name.toLowerCase().includes(q) || judge.pin.includes(q) || `room ${judge.roomNumber}`.includes(q);
  });

  // Filtered companies
  const filteredCompanies = state.companies.filter((company) => {
    if (!companySearchQuery.trim()) return true;
    const q = companySearchQuery.toLowerCase().trim();
    return (
      company.name.toLowerCase().includes(q) ||
      company.ticker.toLowerCase().includes(q) ||
      company.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header matching Image 2 with Back button & cross-navigation */}
      <header className="border-b border-slate-800/80 bg-[#080d1a] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
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
              <div className="text-[11px] font-mono tracking-widest uppercase text-sky-400 font-semibold mb-0.5">
                MARKET ARENA / OPERATIONS
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                Control Room
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 tracking-wider hidden sm:inline">
              {state.voteLogs.length} EVENTS LOGGED
            </span>

            <a
              href="/display"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0e1626] hover:bg-[#142036] border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
            >
              <span>Display View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="/judge"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0e1626] hover:bg-[#142036] border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
            >
              <span>Judge Remote</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-md bg-[#0e1626] hover:bg-[#142036] border border-slate-800 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              Lock console
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-5 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="border-b border-slate-800 flex items-center gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matchups')}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'matchups'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Matchups</span>
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'controls'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'companies'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Companies & Prices</span>
          </button>

          <button
            onClick={() => setActiveTab('judges')}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'judges'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Judges</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'audit'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit log</span>
          </button>
        </div>

        {/* TAB 1: CONTROLS (Exact replica of Image 2) */}
        {activeTab === 'controls' && (
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold mb-1">
                DESK 02
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                Market controls
              </h2>
            </div>

            {/* Master Action Buttons Row matching Image 2 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <button
                type="button"
                onClick={() => setAllRoomsStatus('LIVE')}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-md bg-[#00c57e] hover:bg-[#00b070] text-slate-950 font-bold text-xs tracking-wider transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START ALL</span>
              </button>

              <button
                type="button"
                onClick={() => setAllRoomsStatus('PAUSED')}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-md bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold text-xs tracking-wider transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE ALL</span>
              </button>

              <button
                type="button"
                onClick={() => setAllRoomsStatus('LOCKED')}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-md bg-[#f43f5e] hover:bg-[#e11d48] text-white font-bold text-xs tracking-wider transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>LOCK ALL</span>
              </button>

              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-md bg-[#0e1626] hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-bold text-xs tracking-wider transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESET MARKET</span>
              </button>
            </div>

            {/* Room Status Cards with Segmented Controls matching Image 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {state.rooms.map((room) => {
                const compA = state.companies.find((c) => c.id === room.companyAId);
                const compB = state.companies.find((c) => c.id === room.companyBId);

                return (
                  <div
                    key={room.id}
                    className="bg-[#0e1626] border border-slate-800/90 rounded-lg p-4 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="text-base font-bold text-white font-sans tracking-tight">
                        ROOM 0{room.id}
                      </div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-sans mt-0.5">
                        {compA?.ticker || 'A'} vs {compB?.ticker || 'B'}
                      </div>
                    </div>

                    {/* Segmented Control: LIVE | PAUSED | LOCKED */}
                    <div className="flex items-center rounded bg-[#080d1a] p-1 border border-slate-800/90 text-xs font-semibold tracking-wider">
                      <button
                        type="button"
                        onClick={() => setRoomStatus(room.id, 'LIVE')}
                        className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                          room.status === 'LIVE'
                            ? 'bg-[#00c57e]/20 text-[#00c57e] font-bold border border-[#00c57e]/40'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        LIVE
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoomStatus(room.id, 'PAUSED')}
                        className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                          room.status === 'PAUSED'
                            ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        PAUSED
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoomStatus(room.id, 'LOCKED')}
                        className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                          room.status === 'LOCKED'
                            ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        LOCKED
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MATCHUPS */}
        {activeTab === 'matchups' && (
          <div className="space-y-5">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold mb-1">
                ARENA CONFIGURATION
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                Pair competing companies
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.rooms.map((room) => {
                const compA = state.companies.find((c) => c.id === room.companyAId);
                const compB = state.companies.find((c) => c.id === room.companyBId);

                return (
                  <div
                    key={room.id}
                    className="bg-[#0e1626] border border-slate-800 rounded-lg p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-base font-bold text-white font-sans">
                          ROOM 0{room.id}
                        </span>
                        <span className="ml-2 text-xs font-mono text-slate-400">
                          Current: {compA?.ticker} vs {compB?.ticker}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSwapRoom(room.id, room.companyAId, room.companyBId)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080d1a] hover:bg-slate-900 border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>Swap Sides</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-slate-300">
                            Company A
                          </label>
                          {compA && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditCompany(compA)}
                              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                              title="Edit company or change price"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              <span>Edit price</span>
                            </button>
                          )}
                        </div>
                        <select
                          value={room.companyAId}
                          onChange={(e) => assignRoomMatchup(room.id, e.target.value, room.companyBId)}
                          className="w-full bg-[#080d1a] border border-slate-700/80 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        >
                          {state.companies.map((c) => (
                            <option key={`a-${c.id}`} value={c.id}>
                              {c.ticker} — {c.name} (₹{c.price.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-slate-300">
                            Company B
                          </label>
                          {compB && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditCompany(compB)}
                              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                              title="Edit company or change price"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              <span>Edit price</span>
                            </button>
                          )}
                        </div>
                        <select
                          value={room.companyBId}
                          onChange={(e) => assignRoomMatchup(room.id, room.companyAId, e.target.value)}
                          className="w-full bg-[#080d1a] border border-slate-700/80 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        >
                          {state.companies.map((c) => (
                            <option key={`b-${c.id}`} value={c.id}>
                              {c.ticker} — {c.name} (₹{c.price.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Step increment:</span>
                      <select
                        value={room.increment || 2}
                        onChange={(e) => setRoomIncrement(room.id, Number(e.target.value))}
                        className="bg-[#080d1a] border border-slate-700/80 rounded px-2.5 py-1 text-xs text-emerald-400 font-semibold focus:outline-none"
                      >
                        <option value={1}>± ₹1.00</option>
                        <option value={2}>± ₹2.00 (Default)</option>
                        <option value={5}>± ₹5.00</option>
                        <option value={10}>± ₹10.00</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: COMPANIES & VALUATIONS */}
        {activeTab === 'companies' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold mb-1">
                  PORTFOLIO & VALUATIONS
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                  Manage Companies & Stock Prices
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Edit company names, tickers, starting base valuations, or adjust live market prices directly. Real-time changes broadcast instantly to the display boards and judge handsets.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    placeholder="Search companies or tickers..."
                    className="bg-[#0e1626] border border-slate-700/80 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 w-52"
                  />
                  {companySearchQuery && (
                    <button
                      onClick={() => setCompanySearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAddCompanyError(null);
                    setNewCompanyForm({ name: '', ticker: '', price: '100.00' });
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Company</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Listed</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{state.companies.length} Companies</div>
              </div>

              <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Average Valuation</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  ₹
                  {(
                    state.companies.reduce((acc, c) => acc + c.price, 0) /
                    (state.companies.length || 1)
                  ).toFixed(2)}
                </div>
              </div>

              <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Live In Arena</div>
                <div className="text-lg font-bold font-mono text-sky-400 mt-0.5">
                  {state.rooms.length * 2} Active ({state.rooms.length} Rooms)
                </div>
              </div>

              <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Leader</div>
                <div className="text-lg font-bold font-mono text-amber-400 mt-0.5 truncate">
                  {(() => {
                    const sorted = [...state.companies].sort((a, b) => b.price - a.price);
                    return sorted[0] ? `${sorted[0].ticker} (₹${sorted[0].price.toFixed(2)})` : 'None';
                  })()}
                </div>
              </div>
            </div>

            {/* Companies List */}
            <div className="space-y-2.5">
              {filteredCompanies.length === 0 ? (
                <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-8 text-center text-slate-400 text-xs">
                  No companies found matching &quot;{companySearchQuery}&quot;
                </div>
              ) : (
                filteredCompanies.map((comp) => {
                  const activeRoom = state.rooms.find(
                    (r) => r.companyAId === comp.id || r.companyBId === comp.id
                  );
                  const deltaFromStart = comp.price - comp.startingPrice;
                  const pctChange = ((deltaFromStart) / comp.startingPrice) * 100;
                  const isPositive = deltaFromStart > 0;
                  const isNegative = deltaFromStart < 0;

                  return (
                    <div
                      key={comp.id}
                      className="bg-[#0e1626] border border-slate-800/90 hover:border-slate-700/80 rounded-lg p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Company Details */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-[280px]">
                        <div className="px-2.5 py-1 rounded bg-[#080d1a] border border-slate-700 font-mono text-xs font-bold text-sky-400 tracking-wider">
                          {comp.ticker}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm tracking-tight font-sans">
                              {comp.name}
                            </h3>
                            {activeRoom ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Room 0{activeRoom.id} · {activeRoom.companyAId === comp.id ? 'Side A' : 'Side B'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-800/40 border border-slate-800">
                                Bench / Queue
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Starting: ₹{comp.startingPrice.toFixed(2)} · History ticks: {comp.history.length}
                          </div>
                        </div>
                      </div>

                      {/* Center: Live Price & Performance */}
                      <div className="flex items-center gap-5">
                        <div>
                          <div className="text-[10px] font-mono uppercase text-slate-400">Current Valuation</div>
                          <div className="text-xl font-bold font-mono text-white flex items-baseline gap-2">
                            <span>₹{comp.price.toFixed(2)}</span>
                            <span
                              className={`text-xs font-semibold ${
                                isPositive
                                  ? 'text-emerald-400'
                                  : isNegative
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isPositive ? '+' : ''}
                              {pctChange.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        {/* Inline Quick Price Nudge */}
                        <div className="flex items-center gap-1 bg-[#080d1a] p-1 rounded-md border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustPrice(comp, -5)}
                            className="px-1.5 py-1 rounded text-[11px] font-mono font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                            title="Decrease price by ₹5.00"
                          >
                            -₹5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustPrice(comp, -1)}
                            className="px-1.5 py-1 rounded text-[11px] font-mono font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                            title="Decrease price by ₹1.00"
                          >
                            -₹1
                          </button>
                          <span className="text-slate-700 text-xs px-0.5">|</span>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustPrice(comp, 1)}
                            className="px-1.5 py-1 rounded text-[11px] font-mono font-medium text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                            title="Increase price by ₹1.00"
                          >
                            +₹1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustPrice(comp, 5)}
                            className="px-1.5 py-1 rounded text-[11px] font-mono font-medium text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                            title="Increase price by ₹5.00"
                          >
                            +₹5
                          </button>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCompany(comp)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#080d1a] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-sky-400" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          disabled={!!activeRoom}
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingCompany(comp);
                          }}
                          className={`p-1.5 rounded-md border transition-colors ${
                            activeRoom
                              ? 'border-slate-800/40 text-slate-600 cursor-not-allowed'
                              : 'border-slate-700 bg-[#080d1a] hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 cursor-pointer'
                          }`}
                          title={activeRoom ? 'Cannot remove while active in a live room' : 'Remove company'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: JUDGES */}
        {activeTab === 'judges' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold mb-1">
                  SEAT DIRECTORY
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                  Judge access codes
                </h2>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter judges..."
                  value={judgeSearchQuery}
                  onChange={(e) => setJudgeSearchQuery(e.target.value)}
                  className="bg-[#0e1626] border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 w-48"
                />
              </div>
            </div>

            <div className="bg-[#0e1626] border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080d1a] text-slate-400 border-b border-slate-800 text-[11px] font-medium">
                  <tr>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Seat</th>
                    <th className="py-3 px-4">Judge Name</th>
                    <th className="py-3 px-4 text-right">PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredJudges.map((judge) => (
                    <tr key={judge.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">ROOM 0{judge.roomNumber}</td>
                      <td className="py-3 px-4 text-slate-300">Seat {judge.judgeSlot}</td>
                      <td className="py-3 px-4 text-slate-200">{judge.name}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopyPin(judge.pin)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080d1a] hover:bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-bold text-xs transition-colors cursor-pointer"
                        >
                          <span>{judge.pin}</span>
                          {copiedPin === judge.pin ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono tracking-widest uppercase text-sky-400 font-semibold mb-1">
                  HISTORICAL LOG
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                  Vote audit log ({state.voteLogs.length} events)
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="bg-[#0e1626] border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 w-40"
                  />
                </div>

                <div className="inline-flex rounded-md bg-[#0e1626] border border-slate-800 p-0.5">
                  {(['ALL', 1, 2, 3, 4] as const).map((r) => (
                    <button
                      key={`room-${r}`}
                      onClick={() => setLogRoomFilter(r)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        logRoomFilter === r
                          ? 'bg-[#00c57e] text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r === 'ALL' ? 'ALL' : `R${r}`}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0e1626] hover:bg-slate-800 border border-slate-800 text-xs text-sky-400 font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowClearAuditConfirm(true)}
                  disabled={state.voteLogs.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0e1626] hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-xs text-rose-400 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Clear audit log feed without resetting company stock valuations"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Audit</span>
                </button>
              </div>
            </div>

            <div className="bg-[#0e1626] border border-slate-800 rounded-lg overflow-hidden max-h-[560px] overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No votes recorded matching current filter.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#080d1a] text-slate-400 border-b border-slate-800 text-[11px] font-medium sticky top-0">
                    <tr>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Room</th>
                      <th className="py-3 px-4">Judge</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredLogs.map((log) => {
                      const isUp = log.delta > 0;
                      return (
                        <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-300">Room 0{log.roomNumber}</td>
                          <td className="py-2.5 px-4 text-slate-400">Seat {log.judgeSlot}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-sky-400">{log.companyTicker}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                isUp ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {isUp ? '+ BULLISH' : '- BEARISH'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-200">
                            ₹{log.newPrice.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Dialog for Reset Market */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="bg-[#0e1626] border border-slate-700 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-sans text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Reset all market data?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 leading-relaxed pt-2">
              This will reset all 20 company prices back to ₹100.00 and clear all recorded voting logs. Current room matchups will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 rounded-md bg-[#080d1a] border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetConfirm}
              className="px-4 py-2 rounded-md bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold tracking-wider cursor-pointer"
            >
              Yes, Reset Everything
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Clear Audit Logs */}
      <Dialog open={showClearAuditConfirm} onOpenChange={setShowClearAuditConfirm}>
        <DialogContent className="bg-[#0e1626] border border-slate-700 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-sans text-base flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              Clear vote audit log?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 leading-relaxed pt-2">
              This will permanently erase all recorded vote events from the database and feed. Active company stock valuations, history sparklines, and arena matchups will remain completely unchanged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <button
              type="button"
              onClick={() => setShowClearAuditConfirm(false)}
              className="px-4 py-2 rounded-md bg-[#080d1a] border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearAuditConfirm}
              className="px-4 py-2 rounded-md bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold tracking-wider cursor-pointer"
            >
              Yes, Clear Audit Log
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent className="bg-[#0e1626] border border-slate-700 text-slate-100 max-w-md">
          <form onSubmit={handleSaveCompany}>
            <DialogHeader>
              <DialogTitle className="text-white font-sans text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-400" />
                <span>Edit Company & Valuations</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 leading-relaxed pt-1">
                Update the display name, stock ticker symbol, or live market valuation in Indian Rupees (₹).
              </DialogDescription>
            </DialogHeader>

            {companyFormError && (
              <div className="mt-3 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {companyFormError}
              </div>
            )}

            <div className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Aura Robotics"
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ticker Symbol (uppercase)
                </label>
                <input
                  type="text"
                  required
                  value={editForm.ticker}
                  onChange={(e) => setEditForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                  placeholder="e.g. AURA"
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Live Market Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editForm.price}
                      onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                      className="w-full bg-[#080d1a] border border-slate-700 rounded-md pl-7 pr-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Starting Base Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editForm.startingPrice}
                      onChange={(e) => setEditForm((f) => ({ ...f, startingPrice: e.target.value }))}
                      className="w-full bg-[#080d1a] border border-slate-700 rounded-md pl-7 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-normal">
                💡 Manually setting the live price updates the leaderboard rankings, charts, and arena displays for all devices immediately.
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-5">
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="px-4 py-2 rounded-md bg-[#080d1a] border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingCompany}
                className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold tracking-wider cursor-pointer disabled:opacity-50"
              >
                {isSavingCompany ? 'Saving...' : 'Save Changes'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add New Company Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-[#0e1626] border border-slate-700 text-slate-100 max-w-md">
          <form onSubmit={handleCreateCompany}>
            <DialogHeader>
              <DialogTitle className="text-white font-sans text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add New Company</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 leading-relaxed pt-1">
                Register a new competing team or startup into the market exchange.
              </DialogDescription>
            </DialogHeader>

            {addCompanyError && (
              <div className="mt-3 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {addCompanyError}
              </div>
            )}

            <div className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company / Team Name
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyForm.name}
                  onChange={(e) => setNewCompanyForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Solaris Quantum"
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ticker Symbol
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyForm.ticker}
                  onChange={(e) => setNewCompanyForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SLRS"
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Starting Valuation (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={newCompanyForm.price}
                    onChange={(e) => setNewCompanyForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full bg-[#080d1a] border border-slate-700 rounded-md pl-7 pr-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-5">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-md bg-[#080d1a] border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingCompany}
                className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold tracking-wider cursor-pointer disabled:opacity-50"
              >
                {isAddingCompany ? 'Adding...' : 'Create Company'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Company Confirmation Dialog */}
      <Dialog open={!!deletingCompany} onOpenChange={(open) => !open && setDeletingCompany(null)}>
        <DialogContent className="bg-[#0e1626] border border-slate-700 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-sans text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Remove {deletingCompany?.name}?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 leading-relaxed pt-2">
              Are you sure you want to remove <span className="font-semibold text-slate-200">{deletingCompany?.name} ({deletingCompany?.ticker})</span> from the market exchange? This company will no longer appear on match boards or display leaderboards.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="mt-3 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {deleteError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <button
              type="button"
              onClick={() => setDeletingCompany(null)}
              className="px-4 py-2 rounded-md bg-[#080d1a] border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteCompanyConfirm}
              className="px-4 py-2 rounded-md bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold tracking-wider cursor-pointer"
            >
              Yes, Delete Company
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
