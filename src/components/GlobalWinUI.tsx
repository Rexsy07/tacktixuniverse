import React, { useMemo } from "react";
import { useWinEvent } from "@/hooks/useWinEvent";
import { useWinNotifier } from "@/hooks/useWinNotifier";
import { useWinMatchNotifier } from "@/hooks/useWinMatchNotifier";
import { WinCelebration } from "@/components/WinCelebration";

export default function GlobalWinUI() {
  // Always call hooks in the same order to avoid React hook order warnings
  const { isOpen, amount, currency, message, close } = useWinEvent();
  
  // Primary: watch transactions (exact payout)
  useWinNotifier();
  
  // Fallback: watch matches (1v1 only, estimate payout)
  useWinMatchNotifier();

  // Memoize the celebration component to prevent unnecessary re-renders
  const celebration = useMemo(() => (
    <WinCelebration
      open={isOpen}
      amount={amount}
      currency={currency}
      message={message}
      onClose={close}
    />
  ), [isOpen, amount, currency, message, close]);
  
  return celebration;
}
