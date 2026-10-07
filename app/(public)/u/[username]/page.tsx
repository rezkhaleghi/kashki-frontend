"use client";

import Link from "next/link";
import { Suspense, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { CakeSlice, ChevronRight, Sparkles } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getPublicUserProfile } from "@/lib/api/users";
import { UserAvatar } from "@/components/shared/user-avatar";
import { WishProgress } from "@/components/shared/wish-progress";
import { LoadingState } from "@/components/shared/states";

type PageProps = {
  params: Promise<{ username: string }>;
};

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
        <header className="mb-5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-serif text-xl font-semibold text-emerald-950"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#d52d69] text-sm text-white">
              K
            </span>
            Kashki
          </Link>
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
                        {profile.birthday}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

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
