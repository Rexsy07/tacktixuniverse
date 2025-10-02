import { useEffect, useRef, useState, useCallback } from "react";

export const WIN_EVENT_NAME = "tacktix:win" as const;

export type WinEventDetail = {
  amount: number;
  currency?: string; // default ₦
  message?: string;  // optional custom message
};

export function dispatchWinEvent(detail: WinEventDetail) {
  const event = new CustomEvent(WIN_EVENT_NAME, { detail });
  window.dispatchEvent(event);
}

export function useWinEvent() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("₦");
  const [message, setMessage] = useState<string | undefined>(undefined);

  const open = useCallback((amt: number, curr = "₦", msg?: string) => {
    setAmount(amt);
    setCurrency(curr);
    setMessage(msg);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const simulate = useCallback((amt: number) => {
    dispatchWinEvent({ amount: amt, currency: "₦" });
  }, []);

  const handlerRef = useRef<(e: Event) => void>();

  useEffect(() => {
    handlerRef.current = (e: Event) => {
      const ce = e as CustomEvent<WinEventDetail>;
      const { amount: amt, currency: curr = "₦", message: msg } = ce.detail || ({} as WinEventDetail);
      if (typeof amt === "number") {
        open(amt, curr, msg);
      }
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: Event) => handlerRef.current?.(e);
    window.addEventListener(WIN_EVENT_NAME, handler as EventListener);
    return () => window.removeEventListener(WIN_EVENT_NAME, handler as EventListener);
  }, []);

  return { isOpen, amount, currency, message, open, close, simulate } as const;
}
