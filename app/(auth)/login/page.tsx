"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { loginOtp, loginPassword, requestOtp } from "@/lib/api/auth";

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
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  async function handleSubmit(values: LoginFormValues) {
    setError("");
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
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not connect to Kashki. Check that the backend is running and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestOtp() {
    setError("");
    setNotice("");
    setSendingOtp(true);
    try {
      const response = await requestOtp({ email: form.getValues("email") });
      setNotice(response.message);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not connect to Kashki. Check that the backend is running and try again.",
      );
    } finally {
      setSendingOtp(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Kashki</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Log in</h1>
        <p className="mt-2 text-sm text-slate-600">Welcome back. Pick up where you left off.</p>

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

        <form className="mt-4 space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
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
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
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
                disabled={!email || sendingOtp}
                onClick={handleRequestOtp}
                className="w-full rounded-xl border border-violet-200 px-4 py-2.5 font-medium text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
              >
                {sendingOtp ? "Sending code…" : "Send login code"}
              </button>
              <div>
                <label htmlFor="otp" className="mb-2 block text-sm font-medium text-slate-700">
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

          {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Logging in…" : loginMethod === "password" ? "Continue" : "Log in with code"}
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
          <Link href="/signup" className="font-medium text-violet-600 hover:text-violet-500">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
