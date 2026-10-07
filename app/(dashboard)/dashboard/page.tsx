"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { listReceivedGifts } from "@/lib/api/gifts";
import { createList, listMyLists } from "@/lib/api/lists";
import { listNotifications } from "@/lib/api/notifications";
import { getMyBalances, getMe } from "@/lib/api/users";
import { formatDecimalAmount } from "@/lib/utils/decimal";

function errorText(error: Error | null) {
  if (!error) return "";
  return error instanceof ApiError
    ? error.message
    : "Could not connect to Kashki. Check that the backend is running.";
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [showNewList, setShowNewList] = useState(false);
  const [listName, setListName] = useState("");
  const [listError, setListError] = useState("");

  const userQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const listsQuery = useQuery({ queryKey: ["my-lists"], queryFn: () => listMyLists() });
  const balancesQuery = useQuery({ queryKey: ["my-balances"], queryFn: () => getMyBalances() });
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications({ limit: 5, channel: "IN_APP" }),
  });
  const unreadNotificationsQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => listNotifications({ limit: 100, channel: "IN_APP" }),
    refetchInterval: 60_000,
  });
  const giftsQuery = useQuery({
    queryKey: ["gifts", "received", "recent"],
    queryFn: () => listReceivedGifts({ limit: 5 }),
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

  function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setListError("");
    createListMutation.mutate({ name: listName });
  }

  const listErrorMessage =
    errorText(userQuery.error) ||
    errorText(listsQuery.error) ||
    errorText(balancesQuery.error) ||
    errorText(notificationsQuery.error) ||
    errorText(unreadNotificationsQuery.error) ||
    errorText(giftsQuery.error);
  const balances = balancesQuery.data?.data ?? [];
  const firstBalance = balances[0];
  const firstBalanceAmount = firstBalance?.amount ?? firstBalance?._amount;
  const unreadNotificationCount =
    unreadNotificationsQuery.data?.data.filter(
      (notification) => notification.status === "SENT" && !notification.readAt,
    ).length ?? 0;
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
            <p className="mt-1 text-sm text-slate-500">
              {userQuery.data?.dateOfBirth
                ? `Your birthday · ${userQuery.data.dateOfBirth.slice(0, 10)}`
                : "Add your birthday in profile settings"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNewList((value) => !value)}
              className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
            >
              New list
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Wallet balance</p>
            <p className="mt-3 break-all text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              {firstBalance ? `${firstBalanceAmount ? formatDecimalAmount(firstBalanceAmount) : firstBalanceAmount ?? "Unavailable"} ${firstBalance.currency}` : balancesQuery.isPending ? "Loading…" : "—"}
            </p>
          </div>
          <Link href="/notifications" className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm transition hover:border-rose-200">
            <p className="text-sm font-medium text-rose-800">Unread notifications</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {unreadNotificationsQuery.isPending ? "…" : unreadNotificationCount}
            </p>
            <p className="mt-1 text-sm text-slate-500">See what your friends have shared</p>
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { href: "/lists", title: "My wishlists", detail: "Create and organize lists" },
            { href: "/search", title: "Find someone", detail: "Discover public wishlists" },
            { href: "/wallet", title: "Add funds", detail: "Top up your Kashki wallet" },
            { href: "/gifts", title: "Send a gift", detail: "Give toward a wish or directly" },
            { href: "/notifications", title: "Notifications", detail: "Catch up on what's new" },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:bg-rose-50/50">
              <p className="font-medium text-slate-900">{action.title}</p>
              <p className="mt-1 text-sm text-slate-500">{action.detail}</p>
            </Link>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
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
                    <p className="font-medium text-slate-900">
                      {list.name === "Birthday" ? "Birthday list" : list.name}
                    </p>
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

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Recent gifts</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              {giftsQuery.data?.data.map((gift) => (
                <li key={gift.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-medium text-slate-800">
                    {gift.userId === null ? "Anonymous gift" : "Gift received"}
                  </p>
                  <p className="mt-1">{gift.amount} {gift.currency}</p>
                  {gift.message && <p className="mt-1">{gift.message}</p>}
                </li>
              ))}
              {giftsQuery.data?.data.length === 0 && (
                <li className="rounded-xl bg-slate-50 p-3">No gifts received yet.</li>
              )}
            </ul>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Recent activity</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              {notificationsQuery.data?.data.map((notification) => (
                <li key={notification.id} className="rounded-xl bg-slate-50 p-3">
                  <Link href="/notifications" className="block">
                    <p className="font-medium text-slate-800">{notification.title}</p>
                    <p className="mt-1">{notification.message}</p>
                  </Link>
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
