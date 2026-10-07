"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CakeSlice,
  ExternalLink,
  Gift,
  Heart,
  WalletCards,
} from "lucide-react";
import { listGivenGifts, listReceivedGifts } from "@/lib/api/gifts";
import { createList, listMyLists } from "@/lib/api/lists";
import { listNotifications } from "@/lib/api/notifications";
import { getMyBalances, getMe } from "@/lib/api/users";
import { formatDecimalAmount } from "@/lib/utils/decimal";
import { UserAvatar } from "@/components/shared/user-avatar";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [showNewList, setShowNewList] = useState(false);
  const [listName, setListName] = useState("");
  const [giftTab, setGiftTab] = useState<"received" | "given">("received");

  const userQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const listsQuery = useQuery({
    queryKey: ["my-lists"],
    queryFn: () => listMyLists(),
  });
  const balancesQuery = useQuery({
    queryKey: ["my-balances"],
    queryFn: () => getMyBalances(),
  });
  const unreadNotificationsQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => listNotifications({ limit: 100, channel: "IN_APP" }),
    refetchInterval: 60_000,
  });
  const giftsQuery = useQuery({
    queryKey: ["gifts", giftTab, "dashboard-recent"],
    queryFn: () =>
      giftTab === "received"
        ? listReceivedGifts({ limit: 5 })
        : listGivenGifts({ limit: 5 }),
  });

  const createListMutation = useMutation({
    mutationFn: createList,
    onSuccess: async () => {
      setListName("");
      setShowNewList(false);
      await queryClient.invalidateQueries({ queryKey: ["my-lists"] });
    },
  });

  function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createListMutation.mutate({ name: listName });
  }

  const balances = balancesQuery.data?.data ?? [];
  const firstBalance = balances[0];
  const firstBalanceAmount = firstBalance?.amount ?? firstBalance?._amount;
  const unreadNotificationCount =
    unreadNotificationsQuery.data?.data.filter(
      (notification) => notification.status === "SENT" && !notification.readAt,
    ).length ?? 0;
  const name =
    [userQuery.data?.firstName, userQuery.data?.lastName]
      .filter(Boolean)
      .join(" ") ||
    userQuery.data?.userName ||
    "";

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-rose-100 bg-[linear-gradient(110deg,_#fff_0%,_#fff4f7_54%,_#e8f8f2_100%)] p-5 shadow-sm sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <UserAvatar
              src={userQuery.data?.avatar}
              name={name || "Kashki member"}
              size="md"
            />
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Dashboard</p>
              <h1 className="mt-1 truncate text-2xl font-semibold text-emerald-950 sm:text-3xl">
                {name ? `Welcome, ${name}` : "Welcome back"}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-100 bg-white/75 px-3 py-2.5 text-sm font-semibold text-rose-800">
              <CakeSlice aria-hidden="true" size={18} />
              {userQuery.data?.dateOfBirth
                ? new Intl.DateTimeFormat(undefined, {
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  }).format(
                    new Date(
                      `${userQuery.data.dateOfBirth.slice(0, 10)}T00:00:00Z`,
                    ),
                  )
                : "Add your birthday"}
            </div>
            <Link
              href={
                userQuery.data?.userName
                  ? `/u/${encodeURIComponent(userQuery.data.userName)}`
                  : "/profile"
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              {userQuery.data?.userName
                ? "Show my public profile"
                : "Set up my public profile"}
              <ExternalLink aria-hidden="true" size={15} />
            </Link>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <WalletCards aria-hidden="true" size={17} /> Wallet balance
            </p>
            <p className="mt-3 break-all text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              {firstBalance
                ? `${firstBalanceAmount ? formatDecimalAmount(firstBalanceAmount) : (firstBalanceAmount ?? "Unavailable")} ${firstBalance.currency}`
                : balancesQuery.isPending
                  ? "Loading…"
                  : "—"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/wallet#deposit"
                className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Deposit
              </Link>
              <Link
                href="/wallet#withdrawal"
                className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
              >
                Withdraw
              </Link>
              <Link
                href="/wallet"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
              >
                Wallet details
              </Link>
            </div>
          </section>
          <section className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-medium text-rose-800">
              <Bell aria-hidden="true" size={17} /> Unread notifications
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {unreadNotificationsQuery.isPending
                ? "…"
                : unreadNotificationCount}
            </p>
            <Link
              href="/notifications"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-rose-800 hover:text-rose-950"
            >
              Show notifications <span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                  <Heart
                    aria-hidden="true"
                    className="text-rose-600"
                    size={19}
                  />{" "}
                  Your wishlists
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowNewList((value) => !value)}
                className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                {showNewList ? "Cancel" : "New list"}
              </button>
            </div>
            {showNewList && (
              <form
                onSubmit={handleCreateList}
                className="mt-5 flex flex-wrap items-end gap-3 rounded-xl bg-emerald-50/70 p-4"
              >
                <label className="min-w-48 flex-1 text-sm font-medium text-slate-700">
                  List name
                  <input
                    value={listName}
                    onChange={(event) => setListName(event.target.value)}
                    required
                    maxLength={100}
                    className="mt-2 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2.5 font-normal"
                    placeholder="Weekend adventures"
                  />
                </label>
                <button
                  type="submit"
                  disabled={createListMutation.isPending}
                  className="rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  {createListMutation.isPending ? "Creating…" : "Create list"}
                </button>
              </form>
            )}
            <div className="mt-5 space-y-4">
              {listsQuery.data?.data.map((list) => (
                <div
                  key={list.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {list.name === "Birthday" ? "Birthday list" : list.name}
                    </p>
                    <p className="text-sm text-slate-500">{list.visibility}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/lists/${list.id}`}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </Link>
                    <Link
                      href={`/lists/${list.id}?addWish=true`}
                      className="rounded-full bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                    >
                      Add wish
                    </Link>
                  </div>
                </div>
              ))}
              {listsQuery.data?.data.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  No lists yet. Create one to get started.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <Gift aria-hidden="true" className="text-rose-600" size={19} />{" "}
                Recent gifts
              </h2>
              <Link
                href="/gifts#new-gift"
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                New gift
              </Link>
            </div>
            <div
              className="mt-4 inline-flex rounded-xl bg-slate-100 p-1"
              role="group"
              aria-label="Recent gift direction"
            >
              {(["received", "given"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGiftTab(value)}
                  aria-pressed={giftTab === value}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${giftTab === value ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  {value}
                </button>
              ))}
            </div>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              {giftsQuery.data?.data.map((gift) => (
                <li key={gift.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-medium text-slate-800">
                    {giftTab === "given"
                      ? "Gift sent"
                      : gift.userId === null
                        ? "Anonymous gift"
                        : "Gift received"}
                  </p>
                  <p className="mt-1">
                    {formatDecimalAmount(gift.amount)} {gift.currency}
                  </p>
                  {gift.message && <p className="mt-1">{gift.message}</p>}
                </li>
              ))}
              {giftsQuery.data?.data.length === 0 && (
                <li className="rounded-xl bg-slate-50 p-3">
                  No gifts {giftTab} yet.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
