import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/shared/states";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-5xl pt-12">
            <LoadingState label="Loading Kashki…" />
          </div>
        </main>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
