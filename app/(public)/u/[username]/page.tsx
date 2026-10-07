"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { getPublicUserProfile } from "@/lib/api/users";
import { UserAvatar } from "@/components/shared/user-avatar";
import { WishProgress } from "@/components/shared/wish-progress";

type PageProps = {
  params: { username: string };
};

export default function PublicUserPage({ params }: PageProps) {
  const profileQuery = useQuery({
    queryKey: ["public-user", params.username],
    queryFn: () => getPublicUserProfile(params.username),
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
              <UserAvatar src={profile.avatar} name={fullName || profile.userName || params.username} size="lg" />
            </div>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">
              {fullName || `@${profile.userName ?? params.username}`}
            </h1>
            {profile.userName && <p className="mt-1 text-slate-500">@{profile.userName}</p>}
            {profile.bio && <p className="mt-4 max-w-xl text-slate-600">{profile.bio}</p>}
            {profile.birthday && (
              <p className="mt-3 text-sm text-violet-700">
                Birthday {profile.birthday}
              </p>
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
                          {wish.targetAmount && wish.currency && (
                            <WishProgress received={wish.receivedAmount} target={wish.targetAmount} currency={wish.currency} />
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
