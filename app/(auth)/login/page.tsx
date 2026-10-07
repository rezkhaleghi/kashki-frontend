"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { loginOtp, loginPassword, requestOtp } from "@/lib/api/auth";
import { formatOtpCountdown, useOtpCooldown } from "@/lib/use-otp-cooldown";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string(),
  otp: z.string(),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", otp: "" },
  });
  const email = useWatch({ control: form.control, name: "email" });
  const {
    remainingSeconds: cooldownSeconds,
    startCooldown,
    applyApiCooldown,
  } = useOtpCooldown(email);
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">(
    "password",
  );
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const normalizedEmail = email.trim().toLowerCase();

  async function handleSubmit(values: LoginFormValues) {
    setSubmitting(true);

    try {
      if (loginMethod === "password") {
        await loginPassword({ email: values.email, password: values.password });
      } else {
        await loginOtp({ email: values.email, otp: values.otp });
      }
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.push("/dashboard");
      router.refresh();
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestOtp() {
    setSendingOtp(true);
    try {
      const requestEmail = form.getValues("email").trim().toLowerCase();
      const response = await requestOtp({ email: requestEmail });
      startCooldown(response.resendAfterSeconds, requestEmail);
    } catch (error) {
      applyApiCooldown(error, form.getValues("email"));
    } finally {
      setSendingOtp(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          Kashki
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Log in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Welcome back. Pick up where you left off.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setLoginMethod("password")}
            className={`rounded-lg px-3 py-2 font-medium ${loginMethod === "password" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("otp")}
            className={`rounded-lg px-3 py-2 font-medium ${loginMethod === "otp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            Email code
          </button>
        </div>

        <form
          className="mt-4 space-y-4"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              {...form.register("email")}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              placeholder="you@example.com"
            />
          </div>
          {loginMethod === "password" ? (
            <>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  {...form.register("password")}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="Your password"
                />
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!normalizedEmail || sendingOtp || cooldownSeconds > 0}
                onClick={handleRequestOtp}
                className="w-full rounded-xl border border-violet-200 px-4 py-2.5 font-medium text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
              >
                {sendingOtp
                  ? "Sending code…"
                  : cooldownSeconds > 0
                    ? `Resend in ${formatOtpCountdown(cooldownSeconds)}`
                    : "Send login code"}
              </button>
              <div aria-live="polite" className="space-y-1">
                {cooldownSeconds > 0 && (
                  <p className="text-sm text-slate-600">
                    You can request another code in{" "}
                    {formatOtpCountdown(cooldownSeconds)}.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  minLength={6}
                  maxLength={6}
                  required
                  {...form.register("otp")}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="6-digit code"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting
              ? "Logging in…"
              : loginMethod === "password"
                ? "Continue"
                : "Log in with code"}
          </button>
        </form>

        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/auth/google`}
          className="mt-3 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Continue with Google
        </a>

        <p className="mt-5 text-center text-sm text-slate-600">
          Need an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-violet-600 hover:text-violet-500"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
