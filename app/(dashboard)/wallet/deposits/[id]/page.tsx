"use client";

import Link from "next/link";
import { Suspense, use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDeposit, verifyDeposit } from "@/lib/api/deposits";
import { ApiError } from "@/lib/api/client";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { formatDecimalAmount } from "@/lib/utils/decimal";

type PageProps = { params: Promise<{ id: string }> };

function errorText(error: Error | null) {
  return error instanceof ApiError ? error.message : error ? "Could not connect to Kashki." : "";
}

export default function DepositDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<LoadingState label="Loading deposit…" />}>
      <DepositDetailContent params={params} />
    </Suspense>
  );
}

function DepositDetailContent({ params }: PageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const depositQuery = useQuery({
    queryKey: ["deposit", id],
    queryFn: () => getDeposit(id),
  });
  const verifyMutation = useMutation({
    mutationFn: () => verifyDeposit(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["deposit", id] }),
        queryClient.invalidateQueries({ queryKey: ["deposits"] }),
        queryClient.invalidateQueries({ queryKey: ["my-balances"] }),
      ]);
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/wallet" className="text-sm font-medium text-violet-700">← Wallet</Link>
      <h1 className="text-3xl font-semibold text-slate-900">Deposit details</h1>
      {depositQuery.isPending ? (
        <LoadingState label="Loading deposit…" />
      ) : depositQuery.isError ? (
        <ErrorState message={errorText(depositQuery.error)} />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-2xl font-semibold text-slate-900">{formatDecimalAmount(depositQuery.data.amount)} {depositQuery.data.currency}</p>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-medium text-slate-900">{depositQuery.data.status}</dd></div>
            <div><dt className="text-slate-500">Provider</dt><dd className="mt-1 font-medium text-slate-900">{depositQuery.data.provider}</dd></div>
            <div><dt className="text-slate-500">Created</dt><dd className="mt-1 font-medium text-slate-900">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(depositQuery.data.createdAt))}</dd></div>
            <div><dt className="text-slate-500">Reference</dt><dd className="mt-1 break-all font-medium text-slate-900">{depositQuery.data.referenceId}</dd></div>
            {depositQuery.data.transactionId && <div><dt className="text-slate-500">Transaction</dt><dd className="mt-1 break-all font-medium text-slate-900">{depositQuery.data.transactionId}</dd></div>}
            {depositQuery.data.completedAt && <div><dt className="text-slate-500">Completed</dt><dd className="mt-1 font-medium text-slate-900">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(depositQuery.data.completedAt))}</dd></div>}
          </dl>
          {verifyMutation.isError && <div className="mt-4"><ErrorState message={errorText(verifyMutation.error)} /></div>}
          {depositQuery.data.status === "PENDING" && (
            <div className="mt-6 rounded-xl bg-amber-50 p-4">
              <p className="text-sm text-slate-700">Balance is not available until the backend verifies the payment.</p>
              <button
                type="button"
                disabled={verifyMutation.isPending}
                onClick={() => verifyMutation.mutate()}
                className="mt-3 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {verifyMutation.isPending ? "Verifying…" : "Verify sandbox payment"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
