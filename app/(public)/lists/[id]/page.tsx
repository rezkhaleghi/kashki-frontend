"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { createGift, listAllWishGifts } from "@/lib/api/gifts";
import { getList } from "@/lib/api/lists";
import { createWish, deleteWish, listWishes, updateWish } from "@/lib/api/wishes";
import { getMe } from "@/lib/api/users";
import type { WishEntity } from "@/lib/types";
import { sumDecimalStrings } from "@/lib/utils/decimal";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { WishProgress } from "@/components/shared/wish-progress";

type PageProps = {
  params: { id: string };
};

const wishSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000),
  links: z.string(),
  targetAmount: z.string().refine(
    (value) =>
      value === "" ||
      (/^\d+(\.\d+)?$/.test(value) && !/^0+(?:\.0+)?$/.test(value)),
    "Enter a positive target amount or leave it blank.",
  ),
  currency: z.enum(["IRR", "USD", "EUR", "USDT", "BTC", "TRX"]),
});
type WishFormValues = z.infer<typeof wishSchema>;

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";

function errorText(error: Error | null) {
  return error instanceof ApiError
    ? error.message
    : error
      ? "Could not connect to Kashki."
      : "";
}

function WishEditor({
  initial,
  pending,
  onCancel,
  onSave,
}: {
  initial?: WishEntity;
  pending: boolean;
  onCancel?: () => void;
  onSave: (values: WishFormValues) => void;
}) {
  const form = useForm<WishFormValues>({
    resolver: zodResolver(wishSchema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      links: initial?.links.join("\n") ?? "",
      targetAmount: initial?.targetAmount ?? "",
      currency: (initial?.currency as WishFormValues["currency"]) ?? "USD",
    },
  });

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit(onSave)}
    >
      <label className="text-sm font-medium text-slate-700">
        Wish title
        <input className={inputClass} {...form.register("title")} />
        {form.formState.errors.title && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.title.message}</span>}
      </label>
      <label className="text-sm font-medium text-slate-700">
        Target amount (optional)
        <input className={inputClass} type="number" min="0.01" step="any" {...form.register("targetAmount")} />
        {form.formState.errors.targetAmount && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.targetAmount.message}</span>}
      </label>
      <label className="text-sm font-medium text-slate-700">
        Currency
        <select className={inputClass} {...form.register("currency")}>
          {["USD", "IRR", "EUR", "USDT", "BTC", "TRX"].map((currency) => <option key={currency}>{currency}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Product links (up to 10, one per line)
        <textarea className={`${inputClass} min-h-20`} {...form.register("links")} />
      </label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">
        Description
        <textarea className={`${inputClass} min-h-20`} {...form.register("description")} />
      </label>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {pending ? "Saving…" : initial ? "Save wish" : "Add wish"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Cancel</button>}
      </div>
    </form>
  );
}

export default function PublicListPage({ params }: PageProps) {
  const queryClient = useQueryClient();
  const [editingWish, setEditingWish] = useState<string | null>(null);
  const [addingWish, setAddingWish] = useState(false);
  const [selectedWish, setSelectedWish] = useState<WishEntity | null>(null);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftCurrency, setGiftCurrency] = useState("USD");
  const [giftMessage, setGiftMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [giftReview, setGiftReview] = useState(false);
  const [notice, setNotice] = useState("");
  const [wishPage, setWishPage] = useState(1);

  const listQuery = useQuery({
    queryKey: ["list", params.id],
    queryFn: () => getList(params.id),
  });
  const wishesQuery = useQuery({
    queryKey: ["wishes", params.id, wishPage],
    queryFn: () => listWishes(params.id, { page: wishPage, limit: 20 }),
    enabled: listQuery.isSuccess,
  });
  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const targetedWishes = useMemo(
    () => wishesQuery.data?.data.filter(
      (wish) => wish.targetAmount !== null && wish.currency !== null,
    ) ?? [],
    [wishesQuery.data],
  );
  const progressQueries = useQueries({
    queries: targetedWishes.map((wish) => ({
      queryKey: ["wish-gift-progress", wish.id],
      queryFn: () => listAllWishGifts(wish.id),
      staleTime: 30_000,
    })),
  });
  const receivedByWish = useMemo(() => {
    const amounts = new Map<string, string>();
    targetedWishes.forEach((wish, index) => {
      const gifts = progressQueries[index]?.data;
      if (gifts) {
        amounts.set(wish.id, sumDecimalStrings(gifts.map((gift) => gift.amount)));
      }
    });
    return amounts;
  }, [targetedWishes, progressQueries]);
  const isOwner = Boolean(listQuery.data && userQuery.data?.id === listQuery.data.userId);
  const wishMutationError = errorText(wishesQuery.error);

  const refreshWishes = async (wishId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wishes", params.id] }),
      queryClient.invalidateQueries({ queryKey: ["list", params.id] }),
      queryClient.invalidateQueries({ queryKey: ["public-user"] }),
      wishId ? queryClient.invalidateQueries({ queryKey: ["wish-gift-progress", wishId] }) : Promise.resolve(),
    ]);
  };
  const toWishInput = (values: WishFormValues) => ({
    title: values.title,
    description: values.description || undefined,
    links: values.links.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
    targetAmount: values.targetAmount || null,
    currency: values.targetAmount ? values.currency : null,
  });
  const createMutation = useMutation({
    mutationFn: (values: WishFormValues) => createWish(params.id, toWishInput(values)),
    onSuccess: async () => {
      setAddingWish(false);
      setNotice("Wish added.");
      await refreshWishes();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ wishId, values }: { wishId: string; values: WishFormValues }) =>
      updateWish(params.id, wishId, toWishInput(values)),
    onSuccess: async (wish) => {
      setEditingWish(null);
      setNotice("Wish updated.");
      await refreshWishes(wish.id);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (wishId: string) => deleteWish(params.id, wishId),
    onSuccess: async (_, wishId) => {
      setNotice("Wish deleted.");
      await refreshWishes(wishId);
    },
  });
  const giftMutation = useMutation({
    mutationFn: () => {
      if (!selectedWish) throw new Error("Select a wish before sending a gift.");
      return createGift({
        wishId: selectedWish.id,
        amount: giftAmount,
        currency: selectedWish.currency ?? giftCurrency,
        anonymous,
        message: giftMessage || undefined,
      });
    },
    onSuccess: async () => {
      setGiftReview(false);
      setSelectedWish(null);
      setGiftAmount("");
      setGiftMessage("");
      setNotice("Gift sent. The wish progress and recipient balance are being refreshed.");
      await Promise.all([
        refreshWishes(selectedWish?.id),
        queryClient.invalidateQueries({ queryKey: ["my-balances"] }),
        queryClient.invalidateQueries({ queryKey: ["gifts"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
    onError: async () => {
      await refreshWishes(selectedWish?.id);
    },
  });

  function handleGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGiftReview(true);
    setNotice("");
  }

  const error = listQuery.error;
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error
        ? "Could not connect to Kashki. Check that the backend is running."
        : "";
  const combinedMutationError =
    errorText(createMutation.error) ||
    errorText(updateMutation.error) ||
    errorText(deleteMutation.error);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/lists" className="text-sm font-medium text-violet-700">← My lists</Link>
        {listQuery.isPending ? (
          <p className="mt-5 text-slate-500">Loading list…</p>
        ) : listQuery.isError ? (
          <p role="alert" className="mt-5 text-sm text-red-700">{errorMessage}</p>
        ) : listQuery.data ? (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Wishlist · {listQuery.data.visibility}</p>
                <h1 className="mt-1 text-3xl font-semibold text-slate-900">{listQuery.data.name}</h1>
                {listQuery.data.description && <p className="mt-2 text-slate-600">{listQuery.data.description}</p>}
              </div>
              {isOwner && (
                <button type="button" onClick={() => setAddingWish((value) => !value)} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white">
                  {addingWish ? "Close" : "Add a wish"}
                </button>
              )}
            </div>
          </>
        ) : null}
      </header>

      {notice && (
        <p role="status" className={`rounded-xl border p-4 text-sm ${notice.toLowerCase().includes("sent") || notice.endsWith(".") && !notice.startsWith("Request") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {notice}
        </p>
      )}
      {combinedMutationError && <ErrorState message={combinedMutationError} />}
      {giftMutation.error && <ErrorState message={errorText(giftMutation.error)} />}
      {wishMutationError && listQuery.data && <ErrorState message={wishMutationError} />}

      {addingWish && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Add a wish</h2>
          <WishEditor
            pending={createMutation.isPending}
            onCancel={() => setAddingWish(false)}
            onSave={(values) => createMutation.mutate(values)}
          />
        </section>
      )}

      {wishesQuery.isPending ? (
        <LoadingState label="Loading wishes…" />
      ) : wishesQuery.isError ? (
        <ErrorState message={errorText(wishesQuery.error) || "Could not load wishes."} />
      ) : wishesQuery.data.data.length === 0 ? (
        <EmptyState
          title="No wishes yet"
          description={isOwner ? "Add your first wish to this list." : "This list doesn’t have any wishes yet."}
          action={isOwner ? (
            <button type="button" onClick={() => setAddingWish(true)} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white">Add a wish</button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {wishesQuery.data.data.map((wish) => {
            const wishStatus = wish.status;
            const completed = wishStatus === "COMPLETED";
            const received = receivedByWish.get(wish.id) ?? "0";
            const giftProgressError = progressQueries[targetedWishes.findIndex((item) => item.id === wish.id)]?.error;
            const isEditing = editingWish === wish.id;

            return (
              <article key={wish.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {isEditing ? (
                  <WishEditor
                    initial={wish}
                    pending={updateMutation.isPending}
                    onCancel={() => setEditingWish(null)}
                    onSave={(values) => updateMutation.mutate({ wishId: wish.id, values })}
                  />
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold text-slate-900">{wish.title}</h2>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${completed ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                            {wishStatus}
                          </span>
                        </div>
                        {wish.description && <p className="mt-2 text-sm text-slate-600">{wish.description}</p>}
                        {wish.links.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {wish.links.map((link) => (
                              <li key={link}><a href={link} target="_blank" rel="noreferrer" className="break-all text-sm text-violet-700 underline">{link}</a></li>
                            ))}
                          </ul>
                        )}
                        {wish.targetAmount && wish.currency && (
                          progressQueries[targetedWishes.findIndex((item) => item.id === wish.id)]?.isPending ? (
                            <p className="mt-3 text-sm text-slate-500">Loading funding progress…</p>
                          ) : giftProgressError ? (
                            <p role="alert" className="mt-3 text-sm text-red-600">{errorText(giftProgressError ?? null)}</p>
                          ) : (
                            <WishProgress received={received} target={wish.targetAmount} currency={wish.currency} />
                          )
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!completed && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWish(wish);
                              setGiftCurrency(wish.currency ?? "USD");
                              setGiftAmount("");
                              setGiftReview(false);
                            }}
                            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white"
                          >
                            Contribute
                          </button>
                        )}
                        {isOwner && (
                          <>
                            <button type="button" onClick={() => setEditingWish(wish.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Edit</button>
                            <button
                              type="button"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Delete "${wish.title}"?`)) deleteMutation.mutate(wish.id);
                              }}
                              className="rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {selectedWish?.id === wish.id && (
                      <form className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2" onSubmit={handleGift}>
                        <label className="text-sm font-medium text-slate-700">
                          Amount
                          <input
                            required
                            type="number"
                            min="0.01"
                            step="any"
                            value={giftAmount}
                            onChange={(event) => setGiftAmount(event.target.value)}
                            className={inputClass}
                          />
                        </label>
                        {!wish.currency && (
                          <label className="text-sm font-medium text-slate-700">
                            Currency
                            <select className={inputClass} value={giftCurrency} onChange={(event) => setGiftCurrency(event.target.value)}>
                              {["USD", "IRR", "EUR", "USDT", "BTC", "TRX"].map((currency) => <option key={currency}>{currency}</option>)}
                            </select>
                          </label>
                        )}
                        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                          Message (optional)
                          <input maxLength={1000} value={giftMessage} onChange={(event) => setGiftMessage(event.target.value)} className={inputClass} />
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                          <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="accent-violet-600" />
                          Give anonymously
                        </label>
                        {giftReview ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:col-span-2">
                            <p className="text-sm font-medium text-slate-900">
                              You’re sending {giftAmount} {wish.currency ?? giftCurrency} to the list owner.
                            </p>
                            <p className="mt-1 text-sm text-slate-600">This transfer happens immediately after confirmation. The backend verifies your balance and wish status.</p>
                            <div className="mt-4 flex gap-3">
                              <button type="button" onClick={() => setGiftReview(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">Cancel</button>
                              <button type="button" disabled={giftMutation.isPending || completed} onClick={() => giftMutation.mutate()} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                                {giftMutation.isPending ? "Sending…" : "Confirm gift"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                            <button type="submit" disabled={completed} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-50">Review gift</button>
                            <Link href="/login" className="text-sm font-medium text-violet-700">Log in to give</Link>
                          </div>
                        )}
                      </form>
                    )}
                  </>
                )}
              </article>
            );
          })}
          {wishesQuery.data.totalPages > 1 && (
            <nav aria-label="Wish pages" className="flex items-center justify-between">
              <button
                type="button"
                disabled={wishPage <= 1 || wishesQuery.isFetching}
                onClick={() => setWishPage((current) => current - 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-sm text-slate-500">Page {wishPage} of {wishesQuery.data.totalPages}</p>
              <button
                type="button"
                disabled={wishPage >= wishesQuery.data.totalPages || wishesQuery.isFetching}
                onClick={() => setWishPage((current) => current + 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
