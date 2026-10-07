"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createGift, listGivenGifts, listReceivedGifts } from "@/lib/api/gifts";
import { searchUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDecimalAmount } from "@/lib/utils/decimal";

const giftSchema = z.object({
  amount: z.string().min(1).refine(
    (value) => /^\d+(\.\d+)?$/.test(value) && !/^0+(?:\.0+)?$/.test(value),
    "Enter a positive amount.",
  ),
  currency: z.enum(["IRR", "USD", "EUR", "USDT", "BTC", "TRX"]),
  message: z.string().max(1000),
  anonymous: z.boolean(),
});
type GiftFormValues = z.infer<typeof giftSchema>;
type GiftTab = "given" | "received";

function errorText(error: Error | null) {
  return error instanceof ApiError
    ? error.message
    : error
      ? "Could not connect to Kashki."
      : "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function GiftsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<GiftTab>("received");
  const [userInput, setUserInput] = useState("");
  const [debouncedUserInput, setDebouncedUserInput] = useState("");
  const [recipient, setRecipient] = useState<{
    id: string;
    name: string;
    userName: string | null;
    avatar: string | null;
  } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const form = useForm<GiftFormValues>({
    resolver: zodResolver(giftSchema),
    defaultValues: { amount: "", currency: "USD", message: "", anonymous: false },
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedUserInput(userInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [userInput]);

  const peopleQuery = useQuery({
    queryKey: ["gift-recipient-search", debouncedUserInput],
    queryFn: () => searchUsers(debouncedUserInput, 1, 10),
    enabled: showReview === false && debouncedUserInput.length >= 2 && recipient === null,
    placeholderData: keepPreviousData,
  });
  const givenQuery = useQuery({
    queryKey: ["gifts", "given", page],
    queryFn: () => listGivenGifts({ page, limit: 20 }),
    enabled: tab === "given",
  });
  const receivedQuery = useQuery({
    queryKey: ["gifts", "received", page],
    queryFn: () => listReceivedGifts({ page, limit: 20 }),
    enabled: tab === "received",
  });

  const giftMutation = useMutation({
    mutationFn: (values: GiftFormValues) => {
      if (!recipient) throw new Error("Choose a recipient before sending a gift.");
      return createGift({
        recipientUserId: recipient.id,
        amount: values.amount,
        currency: values.currency,
        anonymous: values.anonymous,
        message: values.message || undefined,
      });
    },
    onSuccess: async () => {
      form.reset();
      setShowReview(false);
      setRecipient(null);
      setUserInput("");
      setNotice("Gift sent. The recipient’s wallet has been updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["gifts"] }),
        queryClient.invalidateQueries({ queryKey: ["my-balances"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });

  const selectedQuery = tab === "given" ? givenQuery : receivedQuery;
  const selectedGifts = selectedQuery.data?.data ?? [];
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm text-slate-500">Money with meaning</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Gifts</h1>
        <p className="mt-2 text-sm text-slate-600">See gifts you have received and given, or send a cash gift to someone.</p>
      </header>

      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      {errorText(giftMutation.error) && <ErrorState message={errorText(giftMutation.error)} />}

      <section id="new-gift" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Send a general gift</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(() => setShowReview(true))}
        >
          <div className="sm:col-span-2">
            {recipient ? (
              <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
                <UserAvatar src={recipient.avatar} name={recipient.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{recipient.name}</p>
                  {recipient.userName && <p className="text-sm text-slate-600">@{recipient.userName}</p>}
                </div>
                <button type="button" onClick={() => setRecipient(null)} className="text-sm font-medium text-violet-700">Change</button>
              </div>
            ) : (
              <>
                <label htmlFor="recipient-search" className="text-sm font-medium text-slate-700">Recipient</label>
                <input
                  id="recipient-search"
                  type="search"
                  value={userInput}
                  onChange={(event) => setUserInput(event.target.value)}
                  placeholder="Search by name or username"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
                {debouncedUserInput.length < 2 && <p className="mt-2 text-xs text-slate-500">Enter at least two characters.</p>}
                {peopleQuery.isFetching && <p className="mt-2 text-xs text-slate-500">Searching…</p>}
                {peopleQuery.error && <p role="alert" className="mt-2 text-sm text-red-600">{errorText(peopleQuery.error)}</p>}
                {peopleQuery.data && (
                  <ul className="mt-2 max-h-52 space-y-1 overflow-auto rounded-xl border border-slate-200 p-2">
                    {peopleQuery.data.data.map((person) => {
                      const name = [person.firstName, person.lastName].filter(Boolean).join(" ") || person.userName || "Kashki member";
                      return (
                        <li key={person.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setRecipient({ id: person.id, name, userName: person.userName, avatar: person.avatar });
                              setUserInput("");
                            }}
                            className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-50"
                          >
                            <UserAvatar src={person.avatar} name={name} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-900">{name}</span>
                              {person.userName && <span className="block truncate text-xs text-slate-500">@{person.userName}</span>}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                    {peopleQuery.data.data.length === 0 && <li className="p-2 text-sm text-slate-500">No matching people.</li>}
                  </ul>
                )}
              </>
            )}
          </div>
          <label className="text-sm font-medium text-slate-700">
            Amount
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.amount.message}</span>}
          </label>
          <label className="text-sm font-medium text-slate-700">
            Currency
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" {...form.register("currency")}>
              {["USD", "IRR", "EUR", "USDT", "BTC", "TRX"].map((currency) => <option key={currency}>{currency}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Message (optional)
            <textarea className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5" maxLength={1000} {...form.register("message")} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" className="size-4 accent-violet-600" {...form.register("anonymous")} />
            Give anonymously
          </label>
          {!showReview ? (
            <button type="submit" disabled={!recipient} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 sm:col-span-2 sm:justify-self-start">
              Review gift
            </button>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:col-span-2">
              <p className="text-sm font-medium text-slate-900">
                You’re sending {form.getValues("amount")} {form.getValues("currency")} to {recipient?.name}.
              </p>
              <p className="mt-1 text-sm text-slate-600">This transfer happens immediately after confirmation and cannot be undone here.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => setShowReview(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">Cancel</button>
                <button
                  type="button"
                  disabled={giftMutation.isPending}
                  onClick={() => giftMutation.mutate(form.getValues())}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {giftMutation.isPending ? "Sending…" : "Send gift"}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex gap-2 border-b border-slate-100 pb-4">
          {(["received", "given"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${tab === value ? "bg-violet-100 text-violet-800" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Gifts {value}
            </button>
          ))}
        </div>

        {selectedQuery.isPending ? (
          <div className="pt-4"><LoadingState label="Loading gift history…" /></div>
        ) : selectedQuery.isError ? (
          <div className="pt-4"><ErrorState message={errorText(selectedQuery.error) || "Could not load gift history."} /></div>
        ) : selectedGifts.length === 0 ? (
          <div className="pt-4"><EmptyState title={`No gifts ${tab} yet`} description="Your gift history will appear here." /></div>
        ) : (
          <ul className="mt-4 space-y-3">
            {selectedGifts.map((gift) => (
              <li key={gift.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-900">
                    {tab === "received"
                      ? gift.userId === null ? "Anonymous gift" : "Gift from a Kashki member"
                      : "Gift sent"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(gift.createdAt)}{gift.wishId ? " · For a wish" : " · General gift"}
                  </p>
                  {gift.message && <p className="mt-2 text-sm text-slate-700">{gift.message}</p>}
                </div>
                <p className="text-lg font-semibold text-slate-900">{formatDecimalAmount(gift.amount)} {gift.currency}</p>
              </li>
            ))}
          </ul>
        )}

        {selectedQuery.data && selectedQuery.data.totalPages > 1 && (
          <nav aria-label="Gift history pages" className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1 || selectedQuery.isFetching}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <p className="text-sm text-slate-500">Page {page} of {selectedQuery.data.totalPages} · {selectedQuery.data.total} gifts</p>
            <button
              type="button"
              disabled={page >= selectedQuery.data.totalPages || selectedQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
