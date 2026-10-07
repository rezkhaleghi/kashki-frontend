"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { House, Search } from "lucide-react";
import { getMe } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { UserAvatar } from "@/components/shared/user-avatar";
import { BackButton } from "@/components/shared/back-button";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/search", label: "Search", icon: Search },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userQuery = useQuery({ queryKey: ["me"], queryFn: getMe });

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
    return () =>
      window.removeEventListener("kashki:unauthorized", handleUnauthorized);
  }, [queryClient, router]);

  const displayName = useMemo(
    () =>
      [userQuery.data?.firstName, userQuery.data?.lastName]
        .filter(Boolean)
        .join(" ") ||
      userQuery.data?.userName ||
      userQuery.data?.email ||
      "Your account",
    [userQuery.data],
  );

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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <Link
          href="/"
          className="flex h-20 items-center gap-3 border-b border-slate-100 px-6"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 font-semibold text-white">
            K
          </span>
          <span className="font-semibold tracking-wide text-slate-900">
            Kashki
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-1 px-3 py-5"
        >
          {navigation.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon aria-hidden="true" size={18} />
                <span className="flex-1">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-rose-50"
          >
            <UserAvatar
              src={userQuery.data.avatar}
              name={displayName}
              size="sm"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
              {displayName}
            </span>
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:hidden">
          <Link href="/" className="font-semibold text-slate-900">
            Kashki
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="flex max-w-48 items-center gap-2">
              <span className="truncate text-sm text-slate-600">
                {displayName}
              </span>
              <UserAvatar
                src={userQuery.data.avatar}
                name={displayName}
                size="sm"
              />
            </Link>
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <div className="mb-4">
            <BackButton fallbackHref="/" />
          </div>
          {children}
        </div>
        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-slate-200 bg-white px-1 py-2 lg:hidden"
        >
          {navigation.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-lg py-1 text-[10px] ${
                  active ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                <span className="relative">
                  <Icon aria-hidden="true" size={19} />
                </span>
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
