"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";

function retryAfterSeconds(error: unknown) {
  if (
    !(error instanceof ApiError) ||
    typeof error.data !== "object" ||
    error.data === null ||
    !("retryAfterSeconds" in error.data)
  ) {
    return null;
  }

  const seconds = error.data.retryAfterSeconds;
  return typeof seconds === "number" && seconds > 0 ? seconds : null;
}

export function formatOtpCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function useOtpCooldown(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [cooldownEmail, setCooldownEmail] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [clock, setClock] = useState(0);
  const remainingSeconds =
    cooldownEmail === normalizedEmail && cooldownUntil !== null
      ? Math.max(0, Math.ceil((cooldownUntil - clock) / 1000))
      : 0;

  useEffect(() => {
    if (cooldownUntil === null) return;

    const interval = window.setInterval(() => {
      const currentTime = Date.now();
      setClock(currentTime);
      if (currentTime >= cooldownUntil) setCooldownUntil(null);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  function startCooldown(seconds: number, targetEmail = normalizedEmail) {
    const duration = Number(seconds);
    if (!Number.isFinite(duration) || duration <= 0) return;

    const currentTime = Date.now();
    setClock(currentTime);
    setCooldownEmail(targetEmail.trim().toLowerCase());
    setCooldownUntil(currentTime + duration * 1000);
  }

  function applyApiCooldown(error: unknown, targetEmail = normalizedEmail) {
    const seconds = retryAfterSeconds(error);
    if (seconds !== null) startCooldown(seconds, targetEmail);
  }

  return { remainingSeconds, startCooldown, applyApiCooldown };
}
