"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { logout } from "@/lib/api/auth";
import { createList, listMyLists } from "@/lib/api/lists";
import { listNotifications } from "@/lib/api/notifications";
import { getMyBalances, getMe } from "@/lib/api/users";

function errorText(error: Error | null) {
  if (!error) return "";
  return error instanceof ApiError
    ? error.message
    : "Could not connect to Kashki. Check that the backend is running.";
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showNewList, setShowNewList] = useState(false);
  const [listName, setListName] = useState("");
  const [listError, setListError] = useState("");

  const userQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const listsQuery = useQuery({ queryKey: ["my-lists"], queryFn: () => listMyLists() });
  const balancesQuery = useQuery({ queryKey: ["my-balances"], queryFn: () => getMyBalances() });
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications({ limit: 5 }),
  });

  const createListMutation = useMutation({
    mutationFn: createList,
    onSuccess: async () => {
      setListName("");
      setShowNewList(false);
      setListError("");
      await queryClient.invalidateQueries({ queryKey: ["my-lists"] });
    },
    onError: (error: Error) => setListError(errorText(error)),
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.clear();
      router.push("/login");
      router.refresh();
    },
  });

  function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setListError("");
    createListMutation.mutate({ name: listName, visibility: "PUBLIC" });
  }

  const listErrorMessage =
    errorText(userQuery.error) ||
    errorText(listsQuery.error) ||
    errorText(balancesQuery.error) ||
    errorText(notificationsQuery.error);
  const balances = balancesQuery.data?.data ?? [];
  const firstBalance = balances[0];
  const name = [userQuery.data?.firstName, userQuery.data?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">
              {name ? `Welcome, ${name}` : "Welcome back"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/wallet" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              Wallet
            </Link>
            <button
              type="button"
              onClick={() => setShowNewList((value) => !value)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              New list
            </button>
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {logoutMutation.isPending ? "Logging out…" : "Log out"}
            </button>
          </div>
        </header>

        {showNewList && (
          <form onSubmit={handleCreateList} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="min-w-64 flex-1 text-sm font-medium text-slate-700">
              List name
              <input
                value={listName}
                onChange={(event) => setListName(event.target.value)}
                required
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal"
                placeholder="Birthday wishlist"
              />
            </label>
            <button
              type="submit"
              disabled={createListMutation.isPending}
              className="rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white disabled:opacity-50"
            >
              {createListMutation.isPending ? "Creating…" : "Create list"}
            </button>
            {listError && <p role="alert" className="w-full text-sm text-red-600">{listError}</p>}
          </form>
        )}

        {listErrorMessage && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {listErrorMessage}{" "}
            {userQuery.error && <Link href="/login" className="font-semibold underline">Log in</Link>}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Wallet balance</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {firstBalance ? `${firstBalance.amount} ${firstBalance.currency}` : balancesQuery.isPending ? "Loading…" : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Lists</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {listsQuery.data ? listsQuery.data.total : listsQuery.isPending ? "Loading…" : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Notifications</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {notificationsQuery.data ? notificationsQuery.data.total : notificationsQuery.isPending ? "Loading…" : "—"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Your lists</h2>
              {userQuery.data?.userName && (
                <Link href={`/u/${encodeURIComponent(userQuery.data.userName)}`} className="text-sm font-medium text-violet-600">
                  View public profile
                </Link>
              )}
            </div>
            <div className="mt-5 space-y-4">
              {listsQuery.data?.data.map((list) => (
                <div key={list.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{list.name}</p>
                    <p className="text-sm text-slate-500">{list.visibility}</p>
                  </div>
                  <Link href={`/lists/${list.id}`} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                    View
                  </Link>
                </div>
              ))}
              {listsQuery.data?.data.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No lists yet. Create one to get started.</p>
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Recent activity</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              {notificationsQuery.data?.data.map((notification) => (
                <li key={notification.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-medium text-slate-800">{notification.title}</p>
                  <p className="mt-1">{notification.message}</p>
                </li>
              ))}
              {notificationsQuery.data?.data.length === 0 && (
                <li className="rounded-xl bg-slate-50 p-3">No recent activity.</li>
              )}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
