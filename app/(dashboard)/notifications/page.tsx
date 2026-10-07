"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { markNotificationAsRead, listNotifications } from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/client";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";

function errorText(error: Error | null) {
  return error instanceof ApiError
    ? error.message
    : error
      ? "Could not load Kashki notifications."
      : "";
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "page", page, type, sortDirection],
    queryFn: () => listNotifications({
      page,
      limit: 20,
      channel: "IN_APP",
      type: type || undefined,
      sortDirection,
    }),
  });
  const readMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm text-slate-500">Updates</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Notifications</h1>
      </header>

      <div className="flex flex-wrap gap-3">
        <label className="text-sm font-medium text-slate-700">
          Type
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
            className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <option value="">All types</option>
            <option value="GIFT_RECEIVED">Gift received</option>
            <option value="WITHDRAWAL_APPROVED">Withdrawal approved</option>
            <option value="WITHDRAWAL_REJECTED">Withdrawal rejected</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Order
          <select
            value={sortDirection}
            onChange={(event) => {
              setSortDirection(event.target.value as "ASC" | "DESC");
              setPage(1);
            }}
            className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <option value="DESC">Newest first</option>
            <option value="ASC">Oldest first</option>
          </select>
        </label>
      </div>

      {notificationsQuery.isPending ? (
        <LoadingState label="Loading notifications…" />
      ) : notificationsQuery.isError ? (
        <ErrorState message={errorText(notificationsQuery.error) || "Could not load notifications."} />
      ) : notificationsQuery.data.data.length === 0 ? (
        <EmptyState title="You’re all caught up" description="New in-app notifications will appear here." />
      ) : (
        <>
          {readMutation.error && <ErrorState message={errorText(readMutation.error) || "Could not mark notification as read."} />}
          <ul className="space-y-3">
            {notificationsQuery.data.data.map((notification) => (
              <li key={notification.id} className={`rounded-2xl border p-4 ${notification.readAt ? "border-slate-200 bg-white" : "border-violet-200 bg-violet-50/60"}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-900">{notification.title}</h2>
                      {notification.status === "SENT" && !notification.readAt && <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-medium text-white">New</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {notification.type.replaceAll("_", " ").toLowerCase()} · {notification.status.toLowerCase()} · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}
                    </p>
                    {notification.failureReason && <p className="mt-2 text-xs text-red-700">{notification.failureReason}</p>}
                    {notification.referenceId && (
                      <a
                        href={notification.type === "GIFT_RECEIVED" ? "/gifts" : "/wallet"}
                        className="mt-2 inline-block text-sm font-medium text-violet-700"
                      >
                        {notification.type === "GIFT_RECEIVED" ? "View gifts" : "View wallet"}
                      </a>
                    )}
                  </div>
                  {notification.status === "SENT" && !notification.readAt && (
                    <button
                      type="button"
                      disabled={readMutation.isPending}
                      onClick={() => readMutation.mutate(notification.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {notificationsQuery.data.totalPages > 1 && (
            <nav aria-label="Notification pages" className="flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1 || notificationsQuery.isFetching}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-sm text-slate-500">Page {page} of {notificationsQuery.data.totalPages}</p>
              <button
                type="button"
                disabled={page >= notificationsQuery.data.totalPages || notificationsQuery.isFetching}
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
