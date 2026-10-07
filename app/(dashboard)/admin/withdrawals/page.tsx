"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAdminWithdrawals,
  updateAdminWithdrawal,
  type UpdateAdminWithdrawalStatus,
} from "@/lib/api/admin-withdrawals";
import type { Withdrawal } from "@/lib/types";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { formatDecimalAmount } from "@/lib/utils/decimal";

const statuses: Withdrawal["status"][] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
];

export default function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Withdrawal["status"] | "">("");
  const [page, setPage] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const withdrawalsQuery = useQuery({
    queryKey: ["admin-withdrawals", status, page],
    queryFn: () =>
      listAdminWithdrawals({
        status: status || undefined,
        page,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      }),
  });
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAdminWithdrawalStatus;
    }) => updateAdminWithdrawal(id, input),
    onSuccess: async () => {
      setActiveId(null);
      setReason("");
      setTransactionId("");
      await queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
  });

  function beginAction(
    id: string,
    action: "APPROVED" | "REJECTED" | "COMPLETED",
  ) {
    setActiveId(id);
    setReason("");
    setTransactionId("");
    if (action === "APPROVED") {
      statusMutation.mutate({ id, input: { status: action } });
    }
  }

  function finishAction(
    withdrawal: Withdrawal,
    action: "REJECTED" | "COMPLETED",
  ) {
    statusMutation.mutate({
      id: withdrawal.id,
      input: {
        status: action,
        ...(action === "REJECTED" && reason ? { reason } : {}),
        ...(action === "COMPLETED" && transactionId ? { transactionId } : {}),
      },
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm text-slate-500">Admin</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">
          Withdrawal queue
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Approving, rejecting, and completing requests changes financial
          records. Confirm each action carefully.
        </p>
      </header>

      <label className="block max-w-xs text-sm font-medium text-slate-700">
        Filter by status
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as Withdrawal["status"] | "");
            setPage(1);
          }}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
        >
          <option value="">All statuses</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      {withdrawalsQuery.isPending ? (
        <LoadingState label="Loading withdrawal requests…" />
      ) : withdrawalsQuery.isError ? null : withdrawalsQuery.data.data
          .length === 0 ? (
        <EmptyState
          title="No withdrawal requests"
          description="Requests matching this filter will appear here."
        />
      ) : (
        <>
          <div className="space-y-3">
            {withdrawalsQuery.data.data.map((withdrawal) => (
              <article
                key={withdrawal.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatDecimalAmount(withdrawal.amount)}{" "}
                      {withdrawal.currency}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      User {withdrawal.userId}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      Destination: {withdrawal.destination}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Created{" "}
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(withdrawal.createdAt))}
                    </p>
                    {withdrawal.rejectionReason && (
                      <p className="mt-2 text-sm text-red-700">
                        Reason: {withdrawal.rejectionReason}
                      </p>
                    )}
                    {withdrawal.transactionId && (
                      <p className="mt-2 break-all text-sm text-slate-600">
                        Transaction: {withdrawal.transactionId}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {withdrawal.status}
                  </span>
                </div>

                {withdrawal.status === "PENDING" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => beginAction(withdrawal.id, "APPROVED")}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => beginAction(withdrawal.id, "REJECTED")}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {withdrawal.status === "APPROVED" && (
                  <button
                    type="button"
                    onClick={() => beginAction(withdrawal.id, "COMPLETED")}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Record transfer
                  </button>
                )}

                {activeId === withdrawal.id &&
                  withdrawal.status === "PENDING" && (
                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                      <p className="text-sm font-medium text-slate-900">
                        Reject this request and refund the reserved amount?
                      </p>
                      <label className="mt-3 block text-sm text-slate-700">
                        Rejection reason (optional)
                        <input
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                        />
                      </label>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveId(null)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={statusMutation.isPending}
                          onClick={() => finishAction(withdrawal, "REJECTED")}
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          Confirm rejection
                        </button>
                      </div>
                    </div>
                  )}
                {activeId === withdrawal.id &&
                  withdrawal.status === "APPROVED" && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm text-slate-700">
                        Only record completion after the external/manual
                        transfer is confirmed.
                      </p>
                      <label className="mt-3 block text-sm text-slate-700">
                        Transaction ID (optional)
                        <input
                          value={transactionId}
                          onChange={(event) =>
                            setTransactionId(event.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                        />
                      </label>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveId(null)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={statusMutation.isPending}
                          onClick={() => finishAction(withdrawal, "COMPLETED")}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          Confirm transfer
                        </button>
                      </div>
                    </div>
                  )}
              </article>
            ))}
          </div>
          {withdrawalsQuery.data.totalPages > 1 && (
            <nav
              aria-label="Admin withdrawal pages"
              className="flex items-center justify-between"
            >
              <button
                type="button"
                disabled={page <= 1 || withdrawalsQuery.isFetching}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-sm text-slate-500">
                Page {page} of {withdrawalsQuery.data.totalPages}
              </p>
              <button
                type="button"
                disabled={
                  page >= withdrawalsQuery.data.totalPages ||
                  withdrawalsQuery.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
