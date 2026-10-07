"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { requestOtp, signUp } from "@/lib/api/auth";

const signUpSchema = z.object({
  userName: z.string().min(3).max(50),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  otp: z.string().length(6, "Enter the 6-digit code."),
});
type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { userName: "", email: "", password: "", otp: "" },
  });
  const email = useWatch({ control: form.control, name: "email" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit(values: SignUpFormValues) {
    setError("");
    setSubmitting(true);

    try {
      await signUp(values);
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Kashki</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">Start your birthday list in minutes.</p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              minLength={3}
              maxLength={50}
              required
              {...form.register("userName")}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              placeholder="yourname"
            />
          </div>

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

          <button
            type="button"
            disabled={!email || sendingOtp}
            onClick={handleRequestOtp}
            className="w-full rounded-xl border border-violet-200 px-4 py-2.5 font-medium text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendingOtp ? "Sending code…" : "Send verification code"}
          </button>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              {...form.register("password")}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              placeholder="At least 8 characters"
            />
          </div>

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

          {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-violet-600 hover:text-violet-500">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
