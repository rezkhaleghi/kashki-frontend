"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { changePassword } from "@/lib/api/auth";
import { deleteAvatar, uploadAvatar } from "@/lib/api/files";
import { getMe, updateMe } from "@/lib/api/users";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { UserAvatar } from "@/components/shared/user-avatar";

const profileSchema = z.object({
  firstName: z.string().max(100).nullable(),
  lastName: z.string().max(100).nullable(),
  userName: z.string().min(3).max(50),
  dateOfBirth: z.string(),
  bio: z.string().max(1000),
  hideYear: z.boolean(),
});

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

function getError(error: Error | null) {
  if (!error) return "";
  return error instanceof ApiError
    ? error.message
    : "Could not connect to Kashki. Please try again.";
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const userQuery = useQuery({ queryKey: ["me"], queryFn: getMe });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: userQuery.data
      ? {
          firstName: userQuery.data.firstName,
          lastName: userQuery.data.lastName,
          userName: userQuery.data.userName ?? "",
          dateOfBirth: userQuery.data.dateOfBirth?.slice(0, 10) ?? "",
          bio: userQuery.data.bio ?? "",
          hideYear: userQuery.data.hideYear,
        }
      : undefined,
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const profileMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: async () => {
      setNotice("Profile saved.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        queryClient.invalidateQueries({ queryKey: ["public-user"] }),
      ]);
    },
  });
  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setNotice("Password changed. Other sessions have been signed out.");
      passwordForm.reset();
    },
  });
  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: async () => {
      setAvatarError("");
      setNotice("Profile photo updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        queryClient.invalidateQueries({ queryKey: ["public-user"] }),
      ]);
    },
    onError: (error: Error) => setAvatarError(getError(error)),
  });
  const deleteAvatarMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: async () => {
      setAvatarError("");
      setNotice("Profile photo removed.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        queryClient.invalidateQueries({ queryKey: ["public-user"] }),
      ]);
    },
    onError: (error: Error) => setAvatarError(getError(error)),
  });

  if (userQuery.isPending) return <LoadingState label="Loading your profile…" />;
  if (userQuery.isError || !userQuery.data) return <ErrorState message={getError(userQuery.error)} />;

  const user = userQuery.data;
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.userName || user.email;
  const mutationError =
    getError(profileMutation.error) || getError(passwordMutation.error);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm text-slate-500">Settings</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Your profile</h1>
        <p className="mt-2 text-sm text-slate-600">Manage the details people see on your public birthday profile.</p>
      </header>

      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      {mutationError && <ErrorState message={mutationError} />}
      {avatarError && <ErrorState message={avatarError} />}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Profile photo</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <UserAvatar src={user.avatar} name={displayName} size="lg" />
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {avatarMutation.isPending ? "Uploading…" : "Upload photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={avatarMutation.isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    setAvatarError("Choose an image smaller than 5 MB.");
                    event.target.value = "";
                    return;
                  }
                  setNotice("");
                  avatarMutation.mutate(file);
                  event.target.value = "";
                }}
              />
            </label>
            {user.avatar && (
              <button
                type="button"
                disabled={deleteAvatarMutation.isPending}
                onClick={() => {
                  setNotice("");
                  deleteAvatarMutation.mutate();
                }}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {deleteAvatarMutation.isPending ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">JPEG, PNG, WebP, or GIF; up to 5 MB.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Personal details</h2>
        <p className="mt-1 text-sm text-slate-500">Account email: {user.email}</p>
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={profileForm.handleSubmit((values) => {
            setNotice("");
            profileMutation.mutate({
              firstName: values.firstName || null,
              lastName: values.lastName || null,
              userName: values.userName,
              dateOfBirth: values.dateOfBirth || null,
              bio: values.bio || null,
              hideYear: values.hideYear,
            });
          })}
        >
          <label className="text-sm font-medium text-slate-700">
            First name
            <input className={inputClass} {...profileForm.register("firstName")} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Last name
            <input className={inputClass} {...profileForm.register("lastName")} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Username
            <input className={inputClass} {...profileForm.register("userName")} />
            {profileForm.formState.errors.userName && <span className="mt-1 block text-xs text-red-600">{profileForm.formState.errors.userName.message}</span>}
          </label>
          <label className="text-sm font-medium text-slate-700">
            Date of birth
            <input className={inputClass} type="date" {...profileForm.register("dateOfBirth")} />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Bio
            <textarea className={`${inputClass} min-h-24 resize-y`} maxLength={1000} {...profileForm.register("bio")} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" className="size-4 accent-violet-600" {...profileForm.register("hideYear")} />
            Hide my birth year on my public profile
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {profileMutation.isPending ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
        <form
          className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={passwordForm.handleSubmit((values) => {
            setNotice("");
            passwordMutation.mutate(values);
          })}
        >
          <label className="flex-1 text-sm font-medium text-slate-700">
            New password
            <input className={inputClass} type="password" autoComplete="new-password" {...passwordForm.register("password")} />
            {passwordForm.formState.errors.password && <span className="mt-1 block text-xs text-red-600">{passwordForm.formState.errors.password.message}</span>}
          </label>
          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            {passwordMutation.isPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
