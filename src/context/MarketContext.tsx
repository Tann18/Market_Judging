'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Company, Room, Judge, VoteLog, MarketState, RoomStatus } from '@/types/market';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const INITIAL_COMPANIES: Company[] = [
  { id: 'AURA', name: 'Aura Robotics', ticker: 'AURA', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'VRTX', name: 'Vortex Energy', ticker: 'VRTX', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'CHRN', name: 'Chrono Quantum', ticker: 'CHRN', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'NXUS', name: 'Nexus BioTech', ticker: 'NXUS', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'HYPR', name: 'Hyperion Aerospace', ticker: 'HYPR', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'SYNP', name: 'Synapse AI', ticker: 'SYNP', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'SOLR', name: 'Solaris Systems', ticker: 'SOLR', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'QBIT', name: 'Qubit Compute', ticker: 'QBIT', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'NOVA', name: 'Nova CyberSecurity', ticker: 'NOVA', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'PLSE', name: 'Pulse Dynamics', ticker: 'PLSE', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'AETH', name: 'Aether Materials', ticker: 'AETH', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'TITN', name: 'Titan Defense', ticker: 'TITN', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'OMNI', name: 'Omni Cloud', ticker: 'OMNI', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'PRSM', name: 'Prism Photonics', ticker: 'PRSM', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'LUMN', name: 'Lumina Genomics', ticker: 'LUMN', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'KNTK', name: 'Kinetic Mobility', ticker: 'KNTK', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'VERD', name: 'Veridian AgTech', ticker: 'VERD', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'ASTR', name: 'Astral Deepsea', ticker: 'ASTR', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'ZENI', name: 'Zenith Neural', ticker: 'ZENI', price: 100.0, startingPrice: 100.0, history: [100.0] },
  { id: 'ECHO', name: 'Echo Synthetics', ticker: 'ECHO', price: 100.0, startingPrice: 100.0, history: [100.0] },
];

export const INITIAL_ROOMS: Room[] = [
  { id: 1, status: 'LIVE', companyAId: 'AURA', companyBId: 'VRTX', increment: 2 },
  { id: 2, status: 'LIVE', companyAId: 'CHRN', companyBId: 'NXUS', increment: 2 },
  { id: 3, status: 'LIVE', companyAId: 'HYPR', companyBId: 'SYNP', increment: 2 },
  { id: 4, status: 'LIVE', companyAId: 'SOLR', companyBId: 'QBIT', increment: 2 },
];

export const INITIAL_JUDGES: Judge[] = [
  { id: 'j-1-1', roomNumber: 1, judgeSlot: 1, pin: '1001', name: 'Room 1 · Judge 1' },
  { id: 'j-1-2', roomNumber: 1, judgeSlot: 2, pin: '1002', name: 'Room 1 · Judge 2' },
  { id: 'j-1-3', roomNumber: 1, judgeSlot: 3, pin: '1003', name: 'Room 1 · Judge 3' },
  { id: 'j-2-1', roomNumber: 2, judgeSlot: 1, pin: '2001', name: 'Room 2 · Judge 1' },
  { id: 'j-2-2', roomNumber: 2, judgeSlot: 2, pin: '2002', name: 'Room 2 · Judge 2' },
  { id: 'j-2-3', roomNumber: 2, judgeSlot: 3, pin: '2003', name: 'Room 2 · Judge 3' },
  { id: 'j-3-1', roomNumber: 3, judgeSlot: 1, pin: '3001', name: 'Room 3 · Judge 1' },
  { id: 'j-3-2', roomNumber: 3, judgeSlot: 2, pin: '3002', name: 'Room 3 · Judge 2' },
  { id: 'j-3-3', roomNumber: 3, judgeSlot: 3, pin: '3003', name: 'Room 3 · Judge 3' },
  { id: 'j-4-1', roomNumber: 4, judgeSlot: 1, pin: '4001', name: 'Room 4 · Judge 1' },
  { id: 'j-4-2', roomNumber: 4, judgeSlot: 2, pin: '4002', name: 'Room 4 · Judge 2' },
  { id: 'j-4-3', roomNumber: 4, judgeSlot: 3, pin: '4003', name: 'Room 4 · Judge 3' },
];

const STORAGE_KEY = 'market_simulation_store_inr_v1';

export interface MarketContextType {
  state: MarketState;
  isLoaded: boolean;
  isSupabaseActive: boolean;
  submitVote: (
    roomId: number,
    judgeSlot: number,
    companyId: string,
    direction: 'UP' | 'DOWN'
  ) => Promise<{ success: boolean; message?: string }>;
  setRoomStatus: (roomId: number, status: RoomStatus) => Promise<void>;
  setAllRoomsStatus: (status: RoomStatus) => Promise<void>;
  assignRoomMatchup: (roomId: number, compAId: string, compBId: string) => Promise<void>;
  setRoomIncrement: (roomId: number, increment: number) => Promise<void>;
  resetMarket: () => Promise<void>;
  clearAuditLogs: () => Promise<void>;
  updateCompany: (
    id: string,
    updates: {
      name?: string;
      ticker?: string;
      price?: number;
      startingPrice?: number;
    }
  ) => Promise<void>;
  addCompany: (newComp: {
    name: string;
    ticker: string;
    price?: number;
    startingPrice?: number;
  }) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  getJudgeByPin: (pin: string) => Judge | undefined;
  getCompany: (id: string) => Company | undefined;
  getRoom: (id: number) => Room | undefined;
  recentVoteCompanyId: { id: string; direction: 'UP' | 'DOWN'; timestamp: number } | null;
}

const defaultInitialState: MarketState = {
  companies: INITIAL_COMPANIES,
  rooms: INITIAL_ROOMS,
  judges: INITIAL_JUDGES,
  voteLogs: [],
  lastUpdated: Date.now(),
};

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MarketState>(defaultInitialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [recentVoteCompanyId, setRecentVoteCompanyId] = useState<{
    id: string;
    direction: 'UP' | 'DOWN';
    timestamp: number;
  } | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Save to localStorage for offline / same-browser fallback
  const persistLocalState = useCallback((newState: MarketState) => {
    setState(newState);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('market_local_sync', { detail: newState }));
      } catch (err) {
        console.error('Failed to save market state to localStorage', err);
      }
    }
  }, []);

  // Initialize and synchronize state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supabase = getSupabase();
    const hasSupabase = isSupabaseConfigured() && supabase !== null;
    setIsSupabaseActive(hasSupabase);

    if (hasSupabase && supabase) {
      // 1. Load active data from Supabase
      const fetchInitialSupabaseData = async () => {
        try {
          const [companiesRes, roomsRes, logsRes] = await Promise.all([
            supabase.from('companies').select('*').order('id'),
            supabase.from('rooms').select('*').order('id'),
            supabase.from('vote_logs').select('*').order('created_at', { ascending: false }).limit(60),
          ]);

          const loadedCompanies: Company[] = (companiesRes.data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            ticker: c.ticker,
            price: Number(c.price),
            startingPrice: Number(c.starting_price),
            history: Array.isArray(c.history) ? c.history.map(Number) : [Number(c.price)],
          }));

          const loadedRooms: Room[] = (roomsRes.data || []).map((r: any) => ({
            id: r.id,
            status: r.status,
            companyAId: r.company_a_id,
            companyBId: r.company_b_id,
            increment: Number(r.increment || 2),
          }));

          const loadedLogs: VoteLog[] = (logsRes.data || []).map((l: any) => ({
            id: l.id,
            timestamp: new Date(l.created_at).getTime(),
            roomNumber: l.room_number,
            judgeSlot: l.judge_slot,
            companyTicker: l.company_ticker,
            delta: Number(l.delta),
            newPrice: Number(l.new_price),
          }));

          setState((curr) => ({
            ...curr,
            companies: loadedCompanies.length > 0 ? loadedCompanies : curr.companies,
            rooms: loadedRooms.length > 0 ? loadedRooms : curr.rooms,
            voteLogs: loadedLogs,
            lastUpdated: Date.now(),
          }));
        } catch (err) {
          console.error('Error fetching from Supabase, using local fallback:', err);
        } finally {
          setIsLoaded(true);
        }
      };

      fetchInitialSupabaseData();

      // 2. Real-time Subscription via Supabase WebSockets (Broadcasts to all devices)
      const channel = supabase
        .channel('market_live_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'companies' },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              const oldComp = payload.old as any;
              if (oldComp && oldComp.id) {
                setState((prev) => ({
                  ...prev,
                  companies: prev.companies.filter((c) => c.id !== oldComp.id),
                  lastUpdated: Date.now(),
                }));
              }
              return;
            }

            const updatedCompany = payload.new as any;
            if (!updatedCompany || !updatedCompany.id) return;

            setState((prev) => {
              const prevComp = prev.companies.find((c) => c.id === updatedCompany.id);
              const newPrice = Number(updatedCompany.price);
              const dir = prevComp && newPrice > prevComp.price ? 'UP' : 'DOWN';

              if (prevComp && newPrice !== prevComp.price) {
                setRecentVoteCompanyId({ id: updatedCompany.id, direction: dir, timestamp: Date.now() });
              }

              const formattedComp: Company = {
                id: updatedCompany.id,
                name: updatedCompany.name || (prevComp ? prevComp.name : updatedCompany.id),
                ticker: updatedCompany.ticker || (prevComp ? prevComp.ticker : updatedCompany.id),
                price: newPrice,
                startingPrice: Number(updatedCompany.starting_price ?? (prevComp ? prevComp.startingPrice : newPrice)),
                history: Array.isArray(updatedCompany.history)
                  ? updatedCompany.history.map(Number)
                  : prevComp
                  ? prevComp.history
                  : [newPrice],
              };

              if (!prevComp) {
                return {
                  ...prev,
                  companies: [...prev.companies, formattedComp],
                  lastUpdated: Date.now(),
                };
              }

              return {
                ...prev,
                companies: prev.companies.map((c) =>
                  c.id === updatedCompany.id ? formattedComp : c
                ),
                lastUpdated: Date.now(),
              };
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rooms' },
          (payload) => {
            const updatedRoom = payload.new as any;
            if (!updatedRoom || !updatedRoom.id) return;

            setState((prev) => ({
              ...prev,
              rooms: prev.rooms.map((r) =>
                r.id === updatedRoom.id
                  ? {
                      ...r,
                      status: updatedRoom.status,
                      companyAId: updatedRoom.company_a_id,
                      companyBId: updatedRoom.company_b_id,
                      increment: Number(updatedRoom.increment || 2),
                    }
                  : r
              ),
              lastUpdated: Date.now(),
            }));
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'vote_logs' },
          (payload) => {
            const newLogRaw = payload.new as any;
            if (!newLogRaw) return;

            const newLog: VoteLog = {
              id: newLogRaw.id,
              timestamp: new Date(newLogRaw.created_at).getTime(),
              roomNumber: newLogRaw.room_number,
              judgeSlot: newLogRaw.judge_slot,
              companyTicker: newLogRaw.company_ticker,
              delta: Number(newLogRaw.delta),
              newPrice: Number(newLogRaw.new_price),
            };

            setState((prev) => ({
              ...prev,
              voteLogs: [newLog, ...prev.voteLogs.filter((l) => l.id !== newLog.id)].slice(0, 100),
              lastUpdated: Date.now(),
            }));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Offline / LocalStorage Mode Fallback
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: MarketState = JSON.parse(stored);
          if (parsed.companies && parsed.rooms && parsed.judges) {
            setState(parsed);
          } else {
            persistLocalState(defaultInitialState);
          }
        } else {
          persistLocalState(defaultInitialState);
        }
      } catch {
        persistLocalState(defaultInitialState);
      } finally {
        setIsLoaded(true);
      }

      const handleStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const updated: MarketState = JSON.parse(e.newValue);
            setState(updated);
          } catch (err) {
            console.error('Error parsing storage event state', err);
          }
        }
      };

      const handleLocalSync = (e: Event) => {
        const customEvent = e as CustomEvent<MarketState>;
        if (customEvent.detail) {
          setState(customEvent.detail);
        }
      };

      window.addEventListener('storage', handleStorage);
      window.addEventListener('market_local_sync', handleLocalSync);

      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('market_local_sync', handleLocalSync);
      };
    }
  }, [persistLocalState]);

  const submitVote = useCallback(
    async (
      roomId: number,
      judgeSlot: number,
      companyId: string,
      direction: 'UP' | 'DOWN'
    ): Promise<{ success: boolean; message?: string }> => {
      const currentState = stateRef.current;
      const room = currentState.rooms.find((r) => r.id === roomId);

      if (!room) {
        return { success: false, message: 'Room not found' };
      }

      if (room.status !== 'LIVE') {
        return {
          success: false,
          message: `Room ${roomId} is currently ${room.status}. Votes can only be submitted while LIVE.`,
        };
      }

      const company = currentState.companies.find((c) => c.id === companyId);
      if (!company) {
        return { success: false, message: 'Company not found' };
      }

      // If Supabase is active, execute atomic RPC on Postgres
      const supabase = getSupabase();
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase.rpc('submit_vote', {
            p_room_id: roomId,
            p_judge_slot: judgeSlot,
            p_company_id: companyId,
            p_direction: direction,
          });

          if (error) {
            console.error('Supabase submit_vote RPC error:', error);
            // Fall through to local optimistic update if needed
          } else if (data && !data.success) {
            return { success: false, message: data.message };
          } else {
            return { success: true };
          }
        } catch (err) {
          console.error('Supabase RPC call failed, falling back locally', err);
        }
      }

      // Local optimistic calculation & fallback
      const increment = room.increment > 0 ? room.increment : 2;
      const delta = direction === 'UP' ? increment : -increment;
      const rawNewPrice = company.price + delta;
      const newPrice = Math.max(1, Number(rawNewPrice.toFixed(2)));
      const updatedHistory = [...(company.history || [company.startingPrice]), newPrice].slice(-60);

      const updatedCompanies = currentState.companies.map((c) =>
        c.id === companyId
          ? {
              ...c,
              price: newPrice,
              history: updatedHistory,
            }
          : c
      );

      const newLog: VoteLog = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        roomNumber: roomId,
        judgeSlot: judgeSlot,
        companyTicker: company.ticker,
        delta,
        newPrice,
      };

      const updatedVoteLogs = [newLog, ...currentState.voteLogs].slice(0, 100);

      const newState: MarketState = {
        ...currentState,
        companies: updatedCompanies,
        voteLogs: updatedVoteLogs,
        lastUpdated: Date.now(),
      };

      persistLocalState(newState);
      setRecentVoteCompanyId({ id: companyId, direction, timestamp: Date.now() });

      return { success: true };
    },
    [persistLocalState]
  );

  const setRoomStatus = useCallback(
    async (roomId: number, status: RoomStatus) => {
      const supabase = getSupabase();
      if (isSupabaseConfigured() && supabase) {
        await supabase.from('rooms').update({ status }).eq('id', roomId);
      }

      const currentState = stateRef.current;
      const updatedRooms = currentState.rooms.map((r) =>
        r.id === roomId ? { ...r, status } : r
      );
      const newState: MarketState = {
        ...currentState,
        rooms: updatedRooms,
        lastUpdated: Date.now(),
      };
      persistLocalState(newState);
    },
    [persistLocalState]
  );

  const setAllRoomsStatus = useCallback(
    async (status: RoomStatus) => {
      const supabase = getSupabase();
      if (isSupabaseConfigured() && supabase) {
        await supabase.from('rooms').update({ status }).neq('id', 0);
      }

      const currentState = stateRef.current;
      const updatedRooms = currentState.rooms.map((r) => ({ ...r, status }));
      const newState: MarketState = {
        ...currentState,
        rooms: updatedRooms,
        lastUpdated: Date.now(),
      };
      persistLocalState(newState);
    },
    [persistLocalState]
  );

  const assignRoomMatchup = useCallback(
    async (roomId: number, compAId: string, compBId: string) => {
      const supabase = getSupabase();
      if (isSupabaseConfigured() && supabase) {
        await supabase
          .from('rooms')
          .update({ company_a_id: compAId, company_b_id: compBId })
          .eq('id', roomId);
      }

      const currentState = stateRef.current;
      const updatedRooms = currentState.rooms.map((r) =>
        r.id === roomId ? { ...r, companyAId: compAId, companyBId: compBId } : r
      );
      const newState: MarketState = {
        ...currentState,
        rooms: updatedRooms,
        lastUpdated: Date.now(),
      };
      persistLocalState(newState);
    },
    [persistLocalState]
  );

  const setRoomIncrement = useCallback(
    async (roomId: number, increment: number) => {
      const supabase = getSupabase();
      if (isSupabaseConfigured() && supabase) {
        await supabase.from('rooms').update({ increment }).eq('id', roomId);
      }

      const currentState = stateRef.current;
      const updatedRooms = currentState.rooms.map((r) =>
        r.id === roomId ? { ...r, increment } : r
      );
      const newState: MarketState = {
        ...currentState,
        rooms: updatedRooms,
        lastUpdated: Date.now(),
      };
      persistLocalState(newState);
    },
    [persistLocalState]
  );

  const resetMarket = useCallback(async () => {
    const supabase = getSupabase();
    if (isSupabaseConfigured() && supabase) {
      await supabase.rpc('reset_market');
    }

    const currentState = stateRef.current;
    const resetCompanies = currentState.companies.map((c) => ({
      ...c,
      price: 100.0,
      startingPrice: 100.0,
      history: [100.0],
    }));

    const newState: MarketState = {
      ...currentState,
      companies: resetCompanies,
      voteLogs: [],
      lastUpdated: Date.now(),
    };
    persistLocalState(newState);
  }, [persistLocalState]);

  const clearAuditLogs = useCallback(async () => {
    const supabase = getSupabase();
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('vote_logs').delete().neq('id', '');
      } catch (err) {
        console.error('Error clearing vote logs from Supabase:', err);
      }
    }

    const currentState = stateRef.current;
    const newState: MarketState = {
      ...currentState,
      voteLogs: [],
      lastUpdated: Date.now(),
    };
    persistLocalState(newState);
  }, [persistLocalState]);

  const updateCompany = useCallback(
    async (
      id: string,
      updates: {
        name?: string;
        ticker?: string;
        price?: number;
        startingPrice?: number;
      }
    ) => {
      const currentState = stateRef.current;
      const targetCompany = currentState.companies.find((c) => c.id === id);
      if (!targetCompany) return;

      const newName = updates.name !== undefined ? updates.name.trim() : targetCompany.name;
      const newTicker = updates.ticker !== undefined ? updates.ticker.trim().toUpperCase() : targetCompany.ticker;
      const newStartingPrice =
        updates.startingPrice !== undefined
          ? Math.max(0.01, Number(updates.startingPrice))
          : targetCompany.startingPrice;
      const newPrice =
        updates.price !== undefined ? Math.max(0.01, Number(updates.price)) : targetCompany.price;

      // History tracking: append if price changed
      const newHistory = [...targetCompany.history];
      if (newPrice !== targetCompany.price) {
        newHistory.push(newPrice);
      }

      const updatedCompany: Company = {
        ...targetCompany,
        name: newName,
        ticker: newTicker,
        price: newPrice,
        startingPrice: newStartingPrice,
        history: newHistory,
      };

      const newState: MarketState = {
        ...currentState,
        companies: currentState.companies.map((c) => (c.id === id ? updatedCompany : c)),
        lastUpdated: Date.now(),
      };

      persistLocalState(newState);

      const supabase = getSupabase();
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase
            .from('companies')
            .update({
              name: newName,
              ticker: newTicker,
              price: newPrice,
              starting_price: newStartingPrice,
              history: newHistory,
            })
            .eq('id', id);
          if (error) {
            console.error('Supabase update company error:', error);
          }
        } catch (err) {
          console.error('Error updating company in Supabase:', err);
        }
      }
    },
    [persistLocalState]
  );

  const addCompany = useCallback(
    async (newComp: {
      name: string;
      ticker: string;
      price?: number;
      startingPrice?: number;
    }) => {
      const currentState = stateRef.current;
      const ticker = newComp.ticker.trim().toUpperCase();
      const name = newComp.name.trim();
      const initialPrice = Number(newComp.price ?? newComp.startingPrice ?? 100);
      const startingPrice = Number(newComp.startingPrice ?? initialPrice);
      const id = ticker;

      if (!ticker || !name) {
        throw new Error('Company name and ticker are required.');
      }

      if (
        currentState.companies.some(
          (c) => c.id.toLowerCase() === id.toLowerCase() || c.ticker.toLowerCase() === ticker.toLowerCase()
        )
      ) {
        throw new Error(`A company with ticker "${ticker}" already exists.`);
      }

      const companyToAdd: Company = {
        id,
        name,
        ticker,
        price: initialPrice,
        startingPrice,
        history: [initialPrice],
      };

      const newState: MarketState = {
        ...currentState,
        companies: [...currentState.companies, companyToAdd],
        lastUpdated: Date.now(),
      };

      persistLocalState(newState);

      const supabase = getSupabase();
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase.from('companies').insert({
            id,
            name,
            ticker,
            price: initialPrice,
            starting_price: startingPrice,
            history: [initialPrice],
          });
          if (error) {
            console.error('Supabase insert company error:', error);
          }
        } catch (err) {
          console.error('Error adding company to Supabase:', err);
        }
      }
    },
    [persistLocalState]
  );

  const deleteCompany = useCallback(
    async (id: string) => {
      const currentState = stateRef.current;
      const activeInRoom = currentState.rooms.find(
        (r) => r.companyAId === id || r.companyBId === id
      );
      if (activeInRoom) {
        throw new Error(
          `Cannot delete company while assigned to Room 0${activeInRoom.id}. Reassign the room matchup first.`
        );
      }

      const newState: MarketState = {
        ...currentState,
        companies: currentState.companies.filter((c) => c.id !== id),
        lastUpdated: Date.now(),
      };

      persistLocalState(newState);

      const supabase = getSupabase();
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase.from('companies').delete().eq('id', id);
          if (error) {
            console.error('Supabase delete company error:', error);
          }
        } catch (err) {
          console.error('Error deleting company from Supabase:', err);
        }
      }
    },
    [persistLocalState]
  );

  const getJudgeByPin = useCallback(
    (pin: string) => {
      return state.judges.find((j) => j.pin.trim() === pin.trim());
    },
    [state.judges]
  );

  const getCompany = useCallback(
    (id: string) => {
      return state.companies.find((c) => c.id === id);
    },
    [state.companies]
  );

  const getRoom = useCallback(
    (id: number) => {
      return state.rooms.find((r) => r.id === id);
    },
    [state.rooms]
  );

  return (
    <MarketContext.Provider
      value={{
        state,
        isLoaded,
        isSupabaseActive,
        submitVote,
        setRoomStatus,
        setAllRoomsStatus,
        assignRoomMatchup,
        setRoomIncrement,
        resetMarket,
        clearAuditLogs,
        updateCompany,
        addCompany,
        deleteCompany,
        getJudgeByPin,
        getCompany,
        getRoom,
        recentVoteCompanyId,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
