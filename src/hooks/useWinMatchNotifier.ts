import { useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { dispatchWinEvent } from "@/hooks/useWinEvent";

const SEEN_MATCH_KEY = "tacktix_seen_win_match_ids";

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_MATCH_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeen(s: Set<string>) {
  try {
    localStorage.setItem(SEEN_MATCH_KEY, JSON.stringify(Array.from(s)));
  } catch {}
}

async function computeEstimatedPayout(matchId: string): Promise<number | null> {
  try {
    // Sum all holds for the match (any status)
    const { data: holds, error: holdsError } = await supabase
      .from("wallet_holds")
      .select("amount")
      .eq("match_id", matchId);
    if (holdsError) return null;
    const pot = (holds || []).reduce((sum, h: any) => sum + (Number(h.amount) || 0), 0);

    // Load fee percentage (assume single row table)
    const { data: settings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("fee_percentage")
      .limit(1)
      .maybeSingle();
    if (settingsError) {
      // ignore and default to 0% fee
    }
    const feePct = Number(settings?.fee_percentage ?? 0);

    // IMPORTANT: For 1v1 we want the winner's NET gain, not the full pot.
    // Net gain ~= opponent's stake minus fee. With equal stakes, that's half the pot less fee.
    const halfPot = pot / 2;
    const payout = Math.max(0, Math.floor(halfPot * (1 - feePct / 100)));
    return payout;
  } catch {
    return null;
  }
}

const SUPPRESS_KEY = "tacktix_suppressed_tx_match_ids";

function loadSuppressed(): Set<string> {
  try {
    const raw = localStorage.getItem(SUPPRESS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSuppressed(s: Set<string>) {
  try {
    localStorage.setItem(SUPPRESS_KEY, JSON.stringify(Array.from(s)));
  } catch {}
}

export function useWinMatchNotifier() {
  const { user } = useAuth();
  const seenRef = useRef<Set<string>>(loadSeen());
  const suppressedRef = useRef<Set<string>>(loadSuppressed());

  // Helper to scan recent wins and dispatch for unseen
  const scan = useMemo(() => {
    return async () => {
      if (!user) return;
      // Only 1v1 fallback to avoid team share ambiguity
      const { data, error } = await supabase
        .from("matches")
        .select("id, winner_id, status, completed_at, format")
        .eq("winner_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10);
      if (error || !data) return;

      for (const m of data) {
        const id = m.id as string;
        if (!id || seenRef.current.has(id)) continue;
        if ((m.format || "").toLowerCase() !== "1v1") continue; // skip non-1v1

        // If a transaction already exists for this match, skip fallback popup
        try {
          const { data: txCheck } = await supabase
            .from("transactions")
            .select("id")
            .eq("user_id", user.id)
            .eq("type", "match_win")
            .contains("metadata", { match_id: id })
            .limit(1);
          if (txCheck && txCheck.length > 0) {
            seenRef.current.add(id);
            saveSeen(seenRef.current);
            continue;
          }
        } catch {
          // ignore tx check errors and proceed with fallback
        }

        const amt = await computeEstimatedPayout(id);
        if (amt && amt > 0) {
          dispatchWinEvent({ amount: amt, currency: "₦", message: "You won" });
          // Mark this match as suppressed so tx-based notifier won't duplicate the popup later
          suppressedRef.current.add(id);
          saveSuppressed(suppressedRef.current);
        }
        seenRef.current.add(id);
        saveSeen(seenRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const realtimeEnabled = (import.meta as any).env?.VITE_ENABLE_REALTIME !== "false";

    // Initial scan
    scan();

    // Realtime subscription: any change to matches where winner_id = user.id
    const channels: any[] = [];
    if (realtimeEnabled) {
      const ch = supabase
        .channel(`wins-user-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "matches", filter: `winner_id=eq.${user.id}` },
          () => { scan(); }
        )
        .subscribe();
      channels.push(ch);
    }

    // Polling fallback every 10s
    const poll = setInterval(() => scan(), 10000);

    return () => {
      clearInterval(poll);
      channels.forEach((ch) => {
        try {
          ch.unsubscribe?.();
          supabase.removeChannel?.(ch);
        } catch {}
      });
    };
  }, [scan, user]);
}
