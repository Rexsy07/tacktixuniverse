import { useEffect, useMemo, useRef } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { dispatchWinEvent } from "@/hooks/useWinEvent";

const SEEN_KEY = "tacktix_seen_win_tx_ids";

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveSeen(set: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore storage errors
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

export function useWinNotifier() {
  const { transactions } = useTransactions();
  const seenRef = useRef<Set<string>>(loadSeen());
  const suppressedRef = useRef<Set<string>>(loadSuppressed());

  // Compact seen set to avoid unbounded growth
  const compact = () => {
    const arr = Array.from(seenRef.current);
    if (arr.length > 200) {
      seenRef.current = new Set(arr.slice(-100));
      saveSeen(seenRef.current);
    }
  };

  const winTxs = useMemo(() => {
    return (transactions || []).filter(
      (t: any) => t?.type === "match_win" && (t?.status === "completed" || t?.status === "success")
    );
  }, [transactions]);

  useEffect(() => {
    for (const tx of winTxs) {
      const id = tx.id as string;
      if (!id) continue;
      if (seenRef.current.has(id)) continue;

      // If this tx is linked to a match we already showed via fallback, suppress once
      const matchId = (tx as any)?.metadata?.match_id as string | undefined;
      if (matchId && suppressedRef.current.has(matchId)) {
        suppressedRef.current.delete(matchId);
        saveSuppressed(suppressedRef.current);
        seenRef.current.add(id);
        saveSeen(seenRef.current);
        compact();
        continue;
      }

      const amt = Number(tx.amount || 0);
      const value = Math.abs(amt);
      if (value > 0) {
        dispatchWinEvent({ amount: value, currency: "₦", message: "You won" });
      }

      seenRef.current.add(id);
      saveSeen(seenRef.current);
      compact();
    }
  }, [winTxs]);
}
