"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CakeSlice, Gift, Heart, Sparkles } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getMe } from "@/lib/api/users";

const faqs = [
  {
    question: "What is Kashki?",
    answer:
      "Kashki is a birthday wishlist and gifting space. It helps you share the things you love and makes it easier for friends and family to celebrate you thoughtfully.",
  },
  {
    question: "How does Kashki work?",
    answer:
      "Create your account, add wishes to a list, and share your profile. Friends can pick a wish, contribute toward one, or send you a gift directly.",
  },
  {
    question: "Can friends contribute together?",
    answer:
      "Yes. Friends can contribute toward a wish, so everyone can take part in making a more special gift happen.",
  },
  {
    question: "Can I keep my birth year private?",
    answer:
      "Yes. Turn on Hide my birth year in your profile settings. Your public profile will show only the month and day.",
  },
];

export default function HomePage() {
  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });
  const user = userQuery.data;
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.userName ||
    "Your profile";

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_5%_12%,_rgba(255,234,234,0.85),_transparent_34%),radial-gradient(ellipse_at_92%_24%,_rgba(184,216,190,0.72),_transparent_34%),linear-gradient(155deg,_#fffaf9_0%,_#fff_52%,_#e8f4ea_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-9 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-emerald-900/10 pb-5">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Kashki home"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-violet-700 font-serif text-xl font-bold text-white shadow-md shadow-rose-900/10">
              K
            </span>
            <span className="font-serif text-2xl font-semibold text-emerald-950">
              Kashki
            </span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-2">
            {user ? (
              <Link
                href="/profile"
                className="flex max-w-52 items-center gap-2 rounded-full border border-emerald-900/10 bg-white/75 py-1.5 pl-1.5 pr-4 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-white"
              >
                <UserAvatar src={user.avatar} name={displayName} size="sm" />
                <span className="truncate">{displayName}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-violet-700 px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-white shadow-md shadow-rose-900/15 transition hover:bg-violet-800"
              >
                SIGNIN
              </Link>
            )}
          </nav>
        </header>

        <section className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="relative z-10">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700 shadow-sm">
              <CakeSlice aria-hidden="true" size={15} /> Birthday wishes, gifts
              & good company
            </p>
            <h1 className="max-w-2xl font-serif text-5xl font-semibold leading-[1.08] text-emerald-950 sm:text-6xl">
              Make room for the things that make them{" "}
              <span className="text-violet-700">glow.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              A softer way to share birthday wishes, gather around a gift, and
              make someone feel wonderfully seen.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-900"
              >
                {user ? "Open your dashboard" : "SIGNIN"}
                <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-emerald-900/15 bg-white/70 px-6 py-3 font-medium text-emerald-950 transition hover:bg-white"
              >
                A peek inside
              </a>
            </div>
            <div className="mt-9 flex items-center gap-3 text-sm text-emerald-900/70">
              <span className="flex -space-x-2" aria-hidden="true">
                <span className="size-8 rounded-full border-2 border-white bg-rose-300" />
                <span className="size-8 rounded-full border-2 border-white bg-emerald-300" />
                <span className="size-8 rounded-full border-2 border-white bg-amber-200" />
              </span>
              <span>Made for thoughtful people and their favorite people</span>
            </div>
          </div>

          <div
            id="how-it-works"
            className="relative mx-auto w-full max-w-lg scroll-mt-8"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-5 -rotate-3 rounded-[2.5rem] border border-rose-200/70 bg-rose-100/70"
            />
            <div className="relative rounded-[2rem] border border-emerald-900/10 bg-white/90 p-6 shadow-[0_28px_80px_-40px_rgba(31,92,75,0.4)] sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-emerald-900/10 pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <Gift aria-hidden="true" size={23} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      A birthday wishbook
                    </p>
                    <h2 className="mt-1 font-serif text-2xl font-semibold text-emerald-950">
                      The good things list
                    </h2>
                  </div>
                </div>
                <Heart
                  aria-hidden="true"
                  className="shrink-0 text-violet-700"
                  size={21}
                />
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                A few lovely things, saved for a day worth celebrating.
              </p>
              <div className="mt-5 divide-y divide-emerald-900/10">
                {[
                  {
                    number: "01",
                    title: "Gather your wishes",
                    text: "Keep favorite finds together in one warm little place.",
                  },
                  {
                    number: "02",
                    title: "Give a little magic",
                    text: "Choose a gift or join friends in making a wish happen.",
                  },
                  {
                    number: "03",
                    title: "Celebrate together",
                    text: "Send a note, share a surprise, make the day theirs.",
                  },
                ].map((step) => (
                  <div
                    key={step.number}
                    className="flex gap-4 py-4 first:pt-1 last:pb-1"
                  >
                    <span className="font-serif text-lg font-semibold text-violet-700">
                      {step.number}
                    </span>
                    <div>
                      <p className="font-semibold text-emerald-950">
                        {step.title}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        {step.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-900">
                <Sparkles aria-hidden="true" size={16} /> Small gestures, big
                birthday energy.
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-t border-emerald-900/10 py-12 sm:py-16"
          aria-labelledby="faq-title"
        >
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-rose-700">
                The little details
              </p>
              <h2
                id="faq-title"
                className="mt-2 font-serif text-3xl font-semibold text-emerald-950"
              >
                A few things you might wonder
              </h2>
            </div>
            <div className="divide-y divide-emerald-900/10 border-y border-emerald-900/10">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-emerald-950 marker:hidden">
                    {faq.question}
                    <span
                      aria-hidden="true"
                      className="font-serif text-xl text-violet-700 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-900/10 py-6 text-sm text-emerald-900/60">
          <Link href="/" className="font-serif font-semibold text-emerald-950">
            Kashki
          </Link>
          <p>Make their birthday a little more theirs.</p>
        </footer>
      </div>
    </main>
  );
}
