"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Gift,
  Heart,
  House,
  LogOut,
  Search,
  Shield,
  UserRound,
  Wallet,
} from "lucide-react";
import { logout } from "@/lib/api/auth";
import { getMe } from "@/lib/api/users";
import { listNotifications } from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/client";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { UserAvatar } from "@/components/shared/user-avatar";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/lists", label: "My lists", icon: Heart },
  { href: "/search", label: "Search", icon: Search },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/gifts", label: "Gifts", icon: Gift },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => listNotifications({ limit: 100, channel: "IN_APP" }),
    enabled: userQuery.isSuccess,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (userQuery.error instanceof ApiError && userQuery.error.status === 401) {
      queryClient.clear();
      router.replace("/login");
    }
  }, [queryClient, router, userQuery.error]);

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.clear();
      router.replace("/login");
    };
    window.addEventListener("kashki:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("kashki:unauthorized", handleUnauthorized);
  }, [queryClient, router]);

  const displayName = useMemo(
    () =>
      [userQuery.data?.firstName, userQuery.data?.lastName]
        .filter(Boolean)
        .join(" ") || userQuery.data?.userName || userQuery.data?.email || "Your account",
    [userQuery.data],
  );

  const unreadCount =
    notificationsQuery.data?.data.filter(
      (item) => item.status === "SENT" && !item.readAt,
    ).length ?? 0;

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.clear();
      router.replace("/login");
    },
  });

  if (userQuery.isPending) {
    return (
      <main className="min-h-screen bg-[#f8f8f6] p-6">
        <div className="mx-auto max-w-5xl pt-12">
          <LoadingState label="Checking your Kashki session…" />
        </div>
      </main>
    );
  }

  if (userQuery.isError) {
    if (userQuery.error instanceof ApiError && userQuery.error.status === 401) {
      return <main className="min-h-screen bg-[#f8f8f6] p-6" />;
    }

    return (
      <main className="min-h-screen bg-[#f8f8f6] p-6">
        <div className="mx-auto max-w-5xl pt-12">
          <ErrorState
            message={
              userQuery.error instanceof Error
                ? userQuery.error.message
                : "Could not load your account."
            }
          />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <Link href="/dashboard" className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600 font-semibold text-white">K</span>
          <span className="font-semibold tracking-wide text-slate-900">Kashki</span>
        </Link>
        <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-5">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon aria-hidden="true" size={18} />
                <span className="flex-1">{label}</span>
                {label === "Notifications" && unreadCount > 0 && (
                  <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <Link
            href="/admin/withdrawals"
            className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            <Shield aria-hidden="true" size={18} />
            Admin withdrawals
          </Link>
          <div className="flex items-center gap-3 px-2 py-2">
            <UserAvatar src={userQuery.data.avatar} name={displayName} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{displayName}</span>
          </div>
          <button
            type="button"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <LogOut aria-hidden="true" size={18} />
            {logoutMutation.isPending ? "Logging out…" : "Log out"}
          </button>
          {logoutMutation.isError && (
            <p role="alert" className="mt-2 px-3 text-xs text-red-600">
              {logoutMutation.error instanceof Error ? logoutMutation.error.message : "Logout failed."}
            </p>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:hidden">
          <Link href="/dashboard" className="font-semibold text-slate-900">Kashki</Link>
          <div className="flex items-center gap-2">
            <span className="max-w-36 truncate text-sm text-slate-600">{displayName}</span>
            <UserAvatar src={userQuery.data.avatar} name={displayName} size="sm" />
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
        <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-8 border-t border-slate-200 bg-white px-1 py-2 lg:hidden">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-lg py-1 text-[10px] ${
                  active ? "text-violet-700" : "text-slate-500"
                }`}
              >
                <span className="relative">
                  <Icon aria-hidden="true" size={19} />
                  {label === "Notifications" && unreadCount > 0 && (
                    <span className="absolute -right-2 -top-1 size-2 rounded-full bg-rose-500" />
                  )}
                </span>
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            aria-label="Log out"
            className="flex min-w-0 flex-col items-center gap-1 rounded-lg py-1 text-[10px] text-slate-500 disabled:opacity-50"
          >
            <LogOut aria-hidden="true" size={19} />
            <span className="w-full truncate text-center">Log out</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
