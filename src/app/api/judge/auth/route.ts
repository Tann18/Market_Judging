import { NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_JUDGES } from '@/context/MarketContext';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pin = typeof body.pin === 'string' ? body.pin.trim() : '';

    if (!pin) {
      return NextResponse.json(
        { success: false, message: 'PIN code is required' },
        { status: 400 }
      );
    }

    // 1. If Supabase is configured, verify against Supabase database
    if (isSupabaseConfigured()) {
      const supabase = getServerSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from('judges')
          .select('id, room_number, judge_slot, name')
          .eq('pin', pin)
          .maybeSingle();

        if (error) {
          console.error('Supabase judge lookup error:', error);
        } else if (data) {
          return NextResponse.json({
            success: true,
            judge: {
              id: data.id,
              roomNumber: data.room_number,
              judgeSlot: data.judge_slot,
              name: data.name,
              pin: pin, // Only returned to the authenticating user
            },
          });
        }
      }
    }

    // 2. Fallback: Verify against server-side initial judges
    const matched = INITIAL_JUDGES.find((j) => j.pin === pin);
    if (matched) {
      return NextResponse.json({
        success: true,
        judge: {
          id: matched.id,
          roomNumber: matched.roomNumber,
          judgeSlot: matched.judgeSlot,
          name: matched.name,
          pin: matched.pin,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid judge PIN' },
      { status: 401 }
    );
  } catch (err) {
    console.error('Judge auth error:', err);
    return NextResponse.json(
      { success: false, message: 'Authentication error' },
      { status: 500 }
    );
  }
}
