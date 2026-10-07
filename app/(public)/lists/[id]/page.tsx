"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { createGift } from "@/lib/api/gifts";
import { getList } from "@/lib/api/lists";
import { listWishes } from "@/lib/api/wishes";

type PageProps = {
  params: { id: string };
};

export default function PublicListPage({ params }: PageProps) {
  const [selectedWish, setSelectedWish] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [notice, setNotice] = useState("");

  const listQuery = useQuery({
    queryKey: ["list", params.id],
    queryFn: () => getList(params.id),
  });
  const wishesQuery = useQuery({
    queryKey: ["wishes", params.id],
    queryFn: () => listWishes(params.id),
  });

  const giftMutation = useMutation({
    mutationFn: createGift,
    onSuccess: () => {
      setSelectedWish(null);
      setAmount("");
      setMessage("");
      setAnonymous(false);
      setNotice("Your contribution was sent.");
    },
  });

  function handleContribute(event: FormEvent<HTMLFormElement>, wishId: string, currency: string) {
    event.preventDefault();
    setNotice("");
    giftMutation.mutate({
      wishId,
      amount,
      currency,
      anonymous,
      message: message || undefined,
    });
  }

  const error = listQuery.error ?? wishesQuery.error ?? giftMutation.error;
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : "Could not connect to Kashki. Check that the backend is running.";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-medium text-violet-700">Kashki</Link>
        {listQuery.isPending || wishesQuery.isPending ? (
          <p className="mt-5 text-slate-500">Loading list…</p>
        ) : error ? (
          <p role="alert" className="mt-5 text-red-700">{errorMessage}</p>
        ) : listQuery.data ? (
          <>
            <p className="mt-5 text-sm text-slate-500">Wishlist</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">{listQuery.data.name}</h1>
            {listQuery.data.description && <p className="mt-3 text-slate-600">{listQuery.data.description}</p>}

            {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

            <div className="mt-8 space-y-4">
              {wishesQuery.data?.data.map((wish) => (
                <section key={wish.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{wish.title}</h2>
                      {wish.description && <p className="mt-1 text-sm text-slate-600">{wish.description}</p>}
                      {wish.targetAmount && <p className="mt-2 text-sm text-slate-500">Goal: {wish.targetAmount} {wish.currency}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWish(selectedWish === wish.id ? null : wish.id);
                        setAmount("");
                      }}
                      className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      Contribute
                    </button>
                  </div>

                  {selectedWish === wish.id && (
                    <form
                      className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2"
                      onSubmit={(event) => handleContribute(event, wish.id, wish.currency ?? "USD")}
                    >
                      <label className="text-sm font-medium text-slate-700">
                        Amount ({wish.currency ?? "USD"})
                        <input
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                        />
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Message (optional)
                        <input
                          maxLength={1000}
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
                        Give anonymously
                      </label>
                      <div className="flex items-center justify-end gap-3">
                        <Link href="/login" className="text-sm font-medium text-violet-700">Log in to give</Link>
                        <button
                          type="submit"
                          disabled={giftMutation.isPending}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          {giftMutation.isPending ? "Sending…" : "Send gift"}
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              ))}
              {wishesQuery.data?.data.length === 0 && <p className="text-sm text-slate-500">No wishes in this list yet.</p>}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
