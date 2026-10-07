"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createList,
  deleteList,
  listMyLists,
  updateList,
} from "@/lib/api/lists";
import type { ListEntity } from "@/lib/types";
import { EmptyState, LoadingState } from "@/components/shared/states";

const listSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]),
});
type ListForm = z.infer<typeof listSchema>;
const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";

export default function ListsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const listsQuery = useQuery({
    queryKey: ["my-lists", page],
    queryFn: () => listMyLists({ page, limit: 20 }),
  });
  const form = useForm<ListForm>({
    resolver: zodResolver(listSchema),
    defaultValues: { name: "", description: "", visibility: "PRIVATE" },
  });
  const editForm = useForm<ListForm>({
    resolver: zodResolver(listSchema),
  });

  const refreshLists = () =>
    queryClient.invalidateQueries({ queryKey: ["my-lists"] });
  const createMutation = useMutation({
    mutationFn: createList,
    onSuccess: async () => {
      form.reset();
      await refreshLists();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ListForm }) =>
      updateList(id, values),
    onSuccess: async (list) => {
      setEditing(null);
      await Promise.all([
        refreshLists(),
        queryClient.invalidateQueries({ queryKey: ["list", list.id] }),
      ]);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: async (_, id) => {
      await Promise.all([
        refreshLists(),
        queryClient.removeQueries({ queryKey: ["list", id] }),
      ]);
    },
  });

  function beginEdit(list: ListEntity) {
    setEditing(list.id);
    editForm.reset({
      name: list.name,
      description: list.description ?? "",
      visibility: list.visibility,
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm text-slate-500">Your wishes, your way</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">My lists</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your Birthday list is created automatically. Add more lists whenever
          you like.
        </p>
      </header>

      <form
        onSubmit={form.handleSubmit((values) => {
          createMutation.mutate({
            name: values.name,
            description: values.description || undefined,
            visibility: values.visibility,
          });
        })}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"
      >
        <h2 className="text-lg font-semibold text-slate-900 sm:col-span-2">
          Create a list
        </h2>
        <label className="text-sm font-medium text-slate-700">
          Name
          <input className={inputClass} {...form.register("name")} />
          {form.formState.errors.name && (
            <span className="mt-1 block text-xs text-red-600">
              {form.formState.errors.name.message}
            </span>
          )}
        </label>
        <label className="text-sm font-medium text-slate-700">
          Visibility
          <select className={inputClass} {...form.register("visibility")}>
            <option value="PUBLIC">Public</option>
            <option value="UNLISTED">Unlisted — link only</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Description
          <textarea
            className={`${inputClass} min-h-20`}
            {...form.register("description")}
          />
        </label>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2 sm:justify-self-start"
        >
          {createMutation.isPending ? "Creating…" : "Create list"}
        </button>
      </form>

      {listsQuery.isPending ? (
        <LoadingState label="Loading your lists…" />
      ) : listsQuery.isError ? null : listsQuery.data.data.length === 0 ? (
        <EmptyState
          title="No lists yet"
          description="Create a list above to start collecting birthday wishes."
        />
      ) : (
        <div className="space-y-4">
          {listsQuery.data.data.map((list) => (
            <article
              key={list.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              {editing === list.id ? (
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={editForm.handleSubmit((values) =>
                    updateMutation.mutate({ id: list.id, values }),
                  )}
                >
                  <label className="text-sm font-medium text-slate-700">
                    Name
                    <input
                      className={inputClass}
                      {...editForm.register("name")}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Visibility
                    <select
                      className={inputClass}
                      {...editForm.register("visibility")}
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="UNLISTED">Unlisted</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Description
                    <textarea
                      className={`${inputClass} min-h-20`}
                      {...editForm.register("description")}
                    />
                  </label>
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {updateMutation.isPending ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {list.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {list.visibility}
                      {list.description ? ` · ${list.description}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/lists/${list.id}`}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Open list
                  </Link>
                  <button
                    type="button"
                    onClick={() => beginEdit(list)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${list.name}"? This cannot be undone.`,
                        )
                      ) {
                        deleteMutation.mutate(list.id);
                      }
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </article>
          ))}
          {listsQuery.data.totalPages > 1 && (
            <nav
              aria-label="List pages"
              className="flex items-center justify-between pt-2"
            >
              <button
                type="button"
                disabled={page <= 1 || listsQuery.isFetching}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-sm text-slate-500">
                Page {page} of {listsQuery.data.totalPages}
              </p>
              <button
                type="button"
                disabled={
                  page >= listsQuery.data.totalPages || listsQuery.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
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
