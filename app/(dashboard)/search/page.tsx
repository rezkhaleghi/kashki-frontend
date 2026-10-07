"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/lib/api/users";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CakeSlice } from "lucide-react";

function formatBirthday(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`2000-${value}T00:00:00Z`));
}

export default function SearchPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(input.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  const usersQuery = useQuery({
    queryKey: ["user-search", query, page],
    queryFn: () => searchUsers(query, page),
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
  });
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm text-slate-500">Discover</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">
          Find someone and Gift them
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Search by name, username, or exact email address.
        </p>
      </header>

      <label className="block">
        <span className="sr-only">Search people</span>
        <input
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Try a name or username"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </label>

      {query.length < 2 ? (
        <EmptyState
          title="Start with two characters"
          description="Enter at least two characters to search Kashki users."
        />
      ) : usersQuery.isPending ? (
        <LoadingState label="Searching people…" />
      ) : usersQuery.isError ? null : usersQuery.data.data.length === 0 ? (
        <EmptyState
          title="No people found"
          description="Try another name, username, or exact email."
        />
      ) : (
        <>
          <div className="space-y-3">
            {usersQuery.data.data.map((person) => {
              const name =
                [person.firstName, person.lastName].filter(Boolean).join(" ") ||
                person.userName ||
                "Kashki member";
              return (
                <article
                  key={person.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <UserAvatar src={person.avatar} name={name} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-slate-900">
                      {name}
                    </h2>
                    {person.userName && (
                      <p className="truncate text-sm text-slate-500">
                        @{person.userName}
                      </p>
                    )}
                    {person.birthday && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-rose-700">
                        <CakeSlice aria-hidden="true" size={15} />
                        {formatBirthday(person.birthday)}
                      </p>
                    )}
                    {person.bio && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {person.bio}
                      </p>
                    )}
                  </div>
                  {person.userName ? (
                    <Link
                      href={`/u/${encodeURIComponent(person.userName)}`}
                      className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      View profile
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-400">
                      No public username
                    </span>
                  )}
                </article>
              );
            })}
          </div>
          {usersQuery.data.totalPages > 1 && (
            <nav
              aria-label="Search result pages"
              className="flex items-center justify-between"
            >
              <button
                type="button"
                disabled={page <= 1 || usersQuery.isFetching}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-sm text-slate-500">
                Page {usersQuery.data.page} of {usersQuery.data.totalPages}
              </p>
              <button
                type="button"
                disabled={
                  page >= usersQuery.data.totalPages || usersQuery.isFetching
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
