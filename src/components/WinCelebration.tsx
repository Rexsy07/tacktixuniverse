import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useInRouterContext } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type WinCelebrationProps = {
  open: boolean;
  amount: number | null;
  currency?: string;
  message?: string;
  onClose: () => void;
};

function formatAmount(amount: number | null, currency = "₦") {
  if (amount == null) return "";
  try {
    return `${currency}${amount.toLocaleString()}`;
  } catch {
    return `${currency}${amount}`;
  }
}

export function WinCelebration({ open, amount, currency = "₦", message, onClose }: WinCelebrationProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const inRouter = useInRouterContext();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Auto-close after ~6s unless hovered/focused
  useEffect(() => {
    if (!open) return;

    const schedule = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (!hovered && !focused) onClose();
      }, 6000);
    };

    schedule();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open, hovered, focused, onClose]);

  // simple celebratory sparkles
  const sparkles = useMemo(() => Array.from({ length: 18 }, (_, i) => i), []);

  // Focus the dialog when it opens
  useEffect(() => {
    if (open) {
      // defer to next tick so element exists
      setTimeout(() => dialogRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="win-celebration-title"
            ref={dialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative m-4 w-full max-w-md rounded-2xl bg-gradient-to-b from-background to-background/95 p-4 pb-[env(safe-area-inset-bottom)] shadow-2xl sm:p-6 max-h-[85vh] overflow-y-auto overscroll-contain"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
            {/* Glow ring (avoid Tailwind theme() in arbitrary values to prevent dev 500s) */}
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-[radial-gradient(120%_80%_at_50%_-20%,hsl(var(--primary)/0.3),transparent_60%)]" />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-foreground/70 hover:bg-black/20"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Sparkles */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              {sparkles.map((i) => (
                <motion.span
                  key={i}
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    left: `${(i * 47) % 100}%`,
                    top: `${(i * 29) % 100}%`,
                    backgroundColor: ["#F59E0B", "#10B981", "#3B82F6", "#EF4444"][i % 4],
                    boxShadow: "0 0 12px rgba(255,255,255,0.6)",
                  }}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2 + (i % 5) * 0.3, delay: (i % 7) * 0.15 }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-2 select-none text-5xl sm:text-6xl"
              >
                🎉
              </motion.div>

              <h2 id="win-celebration-title" className="mb-1 text-xl font-bold sm:text-2xl">Congratulations!</h2>

              <p className="mb-4 text-sm text-foreground/70 sm:text-base">
                {message ?? "You won"} {" "}
                <span className="font-semibold text-foreground">{formatAmount(amount, currency)}</span>
              </p>

              <div className="mb-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {formatAmount(amount, currency)}
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline" className="w-full">
                  {inRouter ? (
                    <Link to="/matches">View My Matches</Link>
                  ) : (
                    <a href="/matches">View My Matches</a>
                  )}
                </Button>
                <Button asChild className="w-full">
                  {inRouter ? (
                    <Link to="/wallet">Withdraw</Link>
                  ) : (
                    <a href="/wallet">Withdraw</a>
                  )}
                </Button>
              </div>

              {/* Secondary CTA */}
              <div className="mt-3">
                <Button asChild variant="ghost" className="text-sm">
                  {inRouter ? (
                    <Link to="/games">Play Again</Link>
                  ) : (
                    <a href="/games">Play Again</a>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
