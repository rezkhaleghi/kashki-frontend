"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getWithdrawal } from "@/lib/api/withdrawals";
import { ApiError } from "@/lib/api/client";
import { ErrorState, LoadingState } from "@/components/shared/states";

type PageProps = { params: { id: string } };

function errorText(error: Error | null) {
  return error instanceof ApiError ? error.message : error ? "Could not connect to Kashki." : "";
}

function dateLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";
}

export default function WithdrawalDetailPage({ params }: PageProps) {
  const withdrawalQuery = useQuery({
    queryKey: ["withdrawal", params.id],
    queryFn: () => getWithdrawal(params.id),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/wallet" className="text-sm font-medium text-violet-700">← Wallet</Link>
      <h1 className="text-3xl font-semibold text-slate-900">Withdrawal details</h1>
      {withdrawalQuery.isPending ? (
        <LoadingState label="Loading withdrawal…" />
      ) : withdrawalQuery.isError ? (
        <ErrorState message={errorText(withdrawalQuery.error)} />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-2xl font-semibold text-slate-900">{withdrawalQuery.data.amount} {withdrawalQuery.data.currency}</p>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-medium text-slate-900">{withdrawalQuery.data.status}</dd></div>
            <div><dt className="text-slate-500">Created</dt><dd className="mt-1 font-medium text-slate-900">{dateLabel(withdrawalQuery.data.createdAt)}</dd></div>
            <div><dt className="text-slate-500">Destination</dt><dd className="mt-1 break-all font-medium text-slate-900">{withdrawalQuery.data.destination}</dd></div>
            <div><dt className="text-slate-500">Reference</dt><dd className="mt-1 break-all font-medium text-slate-900">{withdrawalQuery.data.referenceId}</dd></div>
            <div><dt className="text-slate-500">Last updated</dt><dd className="mt-1 font-medium text-slate-900">{dateLabel(withdrawalQuery.data.updatedAt)}</dd></div>
            <div><dt className="text-slate-500">Completed</dt><dd className="mt-1 font-medium text-slate-900">{dateLabel(withdrawalQuery.data.completedAt)}</dd></div>
            {withdrawalQuery.data.transactionId && <div><dt className="text-slate-500">Transaction ID</dt><dd className="mt-1 break-all font-medium text-slate-900">{withdrawalQuery.data.transactionId}</dd></div>}
            {withdrawalQuery.data.rejectionReason && <div className="sm:col-span-2"><dt className="text-slate-500">Rejection reason</dt><dd className="mt-1 font-medium text-red-700">{withdrawalQuery.data.rejectionReason}</dd></div>}
          </dl>
          {withdrawalQuery.data.status === "PENDING" && (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Your withdrawal is awaiting review. Its amount is reserved by the backend.</p>
          )}
          {withdrawalQuery.data.status === "APPROVED" && (
            <p className="mt-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-800">Your request has been approved and is awaiting completion.</p>
          )}
        </section>
      )}
    </div>
  );
}
