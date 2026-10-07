"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CakeSlice, ChevronRight, Sparkles } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { createGift } from "@/lib/api/gifts";
import { getMe, getPublicUserProfile } from "@/lib/api/users";
import { UserAvatar } from "@/components/shared/user-avatar";
import { WishProgress } from "@/components/shared/wish-progress";
import { LoadingState } from "@/components/shared/states";
import { BackButton } from "@/components/shared/back-button";

type PageProps = {
  params: Promise<{ username: string }>;
};

function formatPublicBirthday(value: string) {
  const includesYear = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const dateValue = includesYear ? value : `2000-${value}`;
  const date = new Date(`${dateValue}T00:00:00Z`);

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    ...(includesYear ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(date);
}

export default function PublicUserPage({ params }: PageProps) {
  return (
    <Suspense fallback={<LoadingState label="Loading profile…" />}>
      <PublicUserContent params={params} />
    </Suspense>
  );
}

function PublicUserContent({ params }: PageProps) {
  const { username } = use(params);
  const profileQuery = useQuery({
    queryKey: ["public-user", username],
    queryFn: () => getPublicUserProfile(username),
  });
  const profile = profileQuery.data;
  const fullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ");
  const error =
    profileQuery.error instanceof ApiError
      ? profileQuery.error.message
      : "Could not connect to Kashki. Check that the backend is running.";

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_5%_8%,_rgba(255,221,231,0.78),_transparent_30%),radial-gradient(ellipse_at_95%_38%,_rgba(190,240,226,0.65),_transparent_32%),linear-gradient(160deg,_#fffaf9_0%,_#f8fffc_100%)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/" />
            <Link
              href="/"
              className="flex items-center gap-2.5 font-serif text-xl font-semibold text-emerald-950"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#d52d69] text-sm text-white">
                K
              </span>
              Kashki
            </Link>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800/70">
            <Sparkles aria-hidden="true" size={14} /> A little wishbook
          </span>
        </header>
        {profileQuery.isPending ? (
          <p className="border-y border-emerald-900/10 bg-white/70 px-5 py-8 text-slate-500">
            Loading profile…
          </p>
        ) : profileQuery.isError ? (
          <p
            role="alert"
            className="border-y border-rose-200 bg-white/70 px-5 py-8 text-red-700"
          >
            {error}
          </p>
        ) : profile ? (
          <>
            <section className="relative overflow-hidden border-y border-emerald-900/10 bg-[linear-gradient(112deg,_rgba(255,241,245,0.94)_0%,_rgba(255,255,255,0.86)_48%,_rgba(220,247,238,0.9)_100%)] px-5 py-8 sm:px-10 sm:py-11">
              <div
                aria-hidden="true"
                className="absolute inset-y-0 right-0 hidden w-1/3 border-l border-white/70 bg-[repeating-linear-gradient(135deg,_rgba(255,255,255,0.25)_0px,_rgba(255,255,255,0.25)_1px,_transparent_1px,_transparent_12px)] sm:block"
              />
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-rose-700">
                A birthday wishbook
              </p>
              <div className="relative mt-5 flex flex-wrap items-center gap-5 sm:gap-7">
                <UserAvatar
                  src={profile.avatar}
                  name={fullName || profile.userName || username}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="font-serif text-4xl font-semibold leading-tight text-emerald-950 sm:text-5xl">
                    {fullName || `@${profile.userName ?? username}`}
                  </h1>
                  {profile.userName && (
                    <p className="mt-1 text-emerald-900/60">
                      @{profile.userName}
                    </p>
                  )}
                  {profile.bio && (
                    <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                      {profile.bio}
                    </p>
                  )}
                </div>
                {profile.birthday && (
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-rose-200/80 bg-white/85 px-4 py-3 shadow-sm">
                    <span
                      aria-hidden="true"
                      className="flex size-10 items-center justify-center rounded-xl bg-[#fde5ed] text-[#c52860]"
                    >
                      <CakeSlice size={21} />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700">
                        Birthday
                      </p>
                      <p className="font-semibold text-emerald-950">
                        {formatPublicBirthday(profile.birthday)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <PublicDonationSection
              profileId={profile.id}
              profileName={fullName || profile.userName || username}
            />

            <div className="mt-5">
              {profile.lists.map((list) => (
                <section
                  key={list.id}
                  className="border-b border-emerald-900/10 py-7 first:pt-5 sm:py-9"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-2xl font-semibold text-emerald-950">
                        {list.name}
                      </h2>
                      {list.description && (
                        <p className="mt-1 text-sm text-slate-600">
                          {list.description}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/lists/${list.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-800/20 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-white"
                    >
                      Open list <ChevronRight aria-hidden="true" size={16} />
                    </Link>
                  </div>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {list.wishes.map((wish) => (
                      <li
                        key={wish.id}
                        className="rounded-xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/[0.03]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {wish.title}
                            </p>
                            {wish.description && (
                              <p className="mt-1 text-sm text-slate-600">
                                {wish.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          {wish.targetAmount && wish.currency && (
                            <WishProgress
                              received={wish.receivedAmount}
                              target={wish.targetAmount}
                              currency={wish.currency}
                            />
                          )}
                          {wish.status !== "COMPLETED" && (
                            <Link
                              href={`/lists/${list.id}#wish-${encodeURIComponent(wish.id)}`}
                              className="inline-flex shrink-0 items-center rounded-full bg-[#d52d69] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b92259]"
                            >
                              View & contribute
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                    {list.wishes.length === 0 && (
                      <li className="text-sm text-slate-500">
                        No wishes in this list yet.
                      </li>
                    )}
                  </ul>
                </section>
              ))}
              {profile.lists.length === 0 && (
                <p className="border-b border-emerald-900/10 py-8 text-sm text-slate-600">
                  There are no public lists yet.
                </p>
              )}
            </div>
          </>
        ) : null}
        <footer className="pt-6 text-center text-sm text-emerald-900/60">
          Thoughtfully shared with Kashki
        </footer>
      </div>
    </main>
  );
}

function PublicDonationSection({
  profileId,
  profileName,
}: {
  profileId: string;
  profileName: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      createGift({
        recipientUserId: profileId,
        amount,
        currency,
        message: message || undefined,
        anonymous,
      }),
    onSuccess: async () => {
      setIsOpen(false);
      setAmount("");
      setMessage("");
      setAnonymous(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-balances"] }),
        queryClient.invalidateQueries({ queryKey: ["gifts"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });
  const validAmount =
    /^\d+(?:\.\d+)?$/.test(amount) && !/^0+(?:\.0+)?$/.test(amount);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  async function handleDonateClick() {
    if (isOpen) {
      setIsOpen(false);
      setAmount("");
      setMessage("");
      setAnonymous(false);
      mutation.reset();
      return;
    }

    mutation.reset();

    try {
      const session = userQuery.data
        ? { data: userQuery.data, error: null }
        : await userQuery.refetch();

      if (session.data) {
        setIsOpen(true);
        return;
      }

      if (
        session.error &&
        !(session.error instanceof ApiError && session.error.status === 401)
      ) {
        return;
      }

      router.push("/login");
    } catch {
      return;
    }
  }

  return (
    <section className="relative my-5 overflow-hidden rounded-2xl border border-rose-200/80 bg-[linear-gradient(105deg,_#fff0f5_0%,_#fff_50%,_#e9f8f2_100%)] p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-700">
            A little extra birthday magic
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-emerald-950">
            Send a birthday donation
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Give any amount directly to {profileName}’s Kashki wallet, with or
            without a wish list. Add a personal note or keep your gift
            anonymous.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDonateClick}
          className="rounded-full bg-[#d52d69] px-6 py-3 text-sm font-bold text-white shadow-sm shadow-rose-900/15 transition hover:bg-[#b92259]"
        >
          {isOpen ? "Close" : "DONATE"}
        </button>
      </div>
      {isOpen && userQuery.data && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 border-t border-emerald-900/10 pt-5 sm:grid-cols-2"
        >
          <label className="text-sm font-medium text-slate-700">
            Amount
            <input
              required
              type="number"
              min="0.01"
              step="any"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-2 w-full rounded-xl border border-emerald-900/15 bg-white px-3 py-2.5"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Currency
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="mt-2 w-full rounded-xl border border-emerald-900/15 bg-white px-3 py-2.5"
            >
              {["USD", "IRR", "EUR", "USDT", "BTC", "TRX"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Message (optional)
            <input
              maxLength={1000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-2 w-full rounded-xl border border-emerald-900/15 bg-white px-3 py-2.5"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(event) => setAnonymous(event.target.checked)}
              className="size-4 accent-rose-600"
            />
            Give anonymously
          </label>
          <p className="text-xs text-slate-500 sm:col-span-2">
            The donation is sent from your Kashki wallet.
          </p>
          <button
            type="submit"
            disabled={!validAmount || mutation.isPending}
            className="rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-50 sm:justify-self-start"
          >
            {mutation.isPending ? "Sending…" : "Send donation"}
          </button>
        </form>
      )}
    </section>
  );
}
