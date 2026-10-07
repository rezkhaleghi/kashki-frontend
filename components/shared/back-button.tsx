"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white/75 px-3.5 py-2 text-sm font-medium text-emerald-900 transition hover:bg-white"
    >
      <ArrowLeft aria-hidden="true" size={16} />
      Back
    </button>
  );
}
