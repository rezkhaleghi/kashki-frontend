"use client";

import Link from "next/link";
import { Suspense, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { CakeSlice } from "lucide-react";
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
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  const error =
    profileQuery.error instanceof ApiError
      ? profileQuery.error.message
      : "Could not connect to Kashki. Check that the backend is running.";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {profileQuery.isPending ? (
          <p className="text-slate-500">Loading profile…</p>
        ) : profileQuery.isError ? (
          <p role="alert" className="text-red-700">{error}</p>
        ) : profile ? (
          <>
            <p className="text-sm text-slate-500">Public profile</p>
            <div className="mt-4">
              <UserAvatar src={profile.avatar} name={fullName || profile.userName || username} size="lg" />
            </div>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">
              {fullName || `@${profile.userName ?? username}`}
            </h1>
            {profile.userName && <p className="mt-1 text-slate-500">@{profile.userName}</p>}
            {profile.bio && <p className="mt-4 max-w-xl text-slate-600">{profile.bio}</p>}
            {profile.birthday && (
              <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-emerald-50 px-5 py-3">
                <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-white text-rose-600">
                  <CakeSlice size={22} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Birthday</p>
                  <p className="text-lg font-bold text-emerald-900">{profile.birthday}</p>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-6">
              {profile.lists.map((list) => (
                <section key={list.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{list.name}</h2>
                      {list.description && <p className="mt-1 text-sm text-slate-600">{list.description}</p>}
                    </div>
                    <Link href={`/lists/${list.id}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                      Open list
                    </Link>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {list.wishes.map((wish) => (
                      <li key={wish.id} className="rounded-xl bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{wish.title}</p>
                            {wish.description && <p className="mt-1 text-sm text-slate-600">{wish.description}</p>}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          {wish.targetAmount && wish.currency && (
                            <WishProgress received={wish.receivedAmount} target={wish.targetAmount} currency={wish.currency} />
                          )}
                          {wish.status !== "COMPLETED" && (
                            <Link
                              href={`/lists/${list.id}#wish-${encodeURIComponent(wish.id)}`}
                              className="inline-flex shrink-0 items-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                            >
                              View & contribute
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                    {list.wishes.length === 0 && <li className="text-sm text-slate-500">No wishes in this list yet.</li>}
                  </ul>
                </section>
              ))}
              {profile.lists.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">There are no public lists yet.</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
