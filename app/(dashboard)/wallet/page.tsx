"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { createDeposit, listDeposits } from "@/lib/api/deposits";
import { createWithdrawal, listWithdrawals } from "@/lib/api/withdrawals";
import { getMyBalances } from "@/lib/api/users";
import { formatDecimalAmount } from "@/lib/utils/decimal";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm";

function errorText(error: Error | null) {
  if (!error) return "";
  return error instanceof ApiError
    ? error.message
    : "Could not connect to Kashki. Check that the backend is running.";
}

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState("USD");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCurrency, setWithdrawCurrency] = useState("USD");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [depositPage, setDepositPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [depositOperation, setDepositOperation] = useState<{
    input: { provider: string; currency: string; amount: string };
    idempotencyKey: string;
  } | null>(null);

  const balancesQuery = useQuery({ queryKey: ["my-balances"], queryFn: () => getMyBalances() });
  const depositsQuery = useQuery({
    queryKey: ["deposits", depositPage],
    queryFn: () => listDeposits({ page: depositPage, limit: 20 }),
  });
  const withdrawalsQuery = useQuery({
    queryKey: ["withdrawals", withdrawalPage],
    queryFn: () => listWithdrawals({ page: withdrawalPage, limit: 20 }),
  });

  const refreshWallet = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["my-balances"] }),
      queryClient.invalidateQueries({ queryKey: ["deposits"] }),
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] }),
    ]);
  };

  const depositMutation = useMutation({
    mutationFn: ({ input, idempotencyKey }: NonNullable<typeof depositOperation>) =>
      createDeposit(input, idempotencyKey),
    onSuccess: async () => {
      setDepositOperation(null);
      setDepositAmount("");
      setMessage("Deposit started. When payment is complete, verify it from the deposit list.");
      await refreshWallet();
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: createWithdrawal,
    onSuccess: async () => {
      setWithdrawAmount("");
      setDestination("");
      setMessage("Withdrawal request submitted.");
      await refreshWallet();
    },
  });

  function handleDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const operation = depositOperation ?? {
      input: {
        provider: "FAKE_PROVIDER",
        currency: depositCurrency,
        amount: depositAmount,
      },
      idempotencyKey: crypto.randomUUID(),
    };
    setDepositOperation(operation);
    depositMutation.mutate(operation);
  }

  function handleWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    withdrawalMutation.mutate({
      currency: withdrawCurrency,
      amount: withdrawAmount,
      destination,
    });
  }

  const mutationError =
    errorText(depositMutation.error) ||
    errorText(withdrawalMutation.error);
  const queryError =
    errorText(balancesQuery.error) ||
    errorText(depositsQuery.error) ||
    errorText(withdrawalsQuery.error);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">Wallet</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your balances</h1>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
            Dashboard
          </Link>
        </header>

        {queryError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {queryError}{" "}
            {balancesQuery.error && <Link href="/login" className="font-semibold underline">Log in</Link>}
          </p>
        )}
        {mutationError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{mutationError}</p>}
        {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {balancesQuery.data?.data.map((balance) => {
            const amount = balance.amount ?? balance._amount;
            return (
              <div key={balance.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{balance.currency} balance</p>
                <p className="mt-3 break-all text-2xl font-semibold text-violet-600 sm:text-3xl">
                  {amount ? formatDecimalAmount(amount) : "Unavailable"}
                </p>
              </div>
            );
          })}
          {balancesQuery.isPending && <p className="text-sm text-slate-500">Loading balances…</p>}
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section id="deposit" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Deposit</h2>
            <p className="mt-1 text-sm text-slate-500">Development deposits use the backend sandbox provider.</p>
            <form className="mt-4 space-y-4" onSubmit={handleDeposit}>
              <label className="block text-sm font-medium text-slate-700">
                Amount
                <input
                  className={`${inputClass} mt-2`}
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  disabled={depositOperation !== null}
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  placeholder="100.00"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Currency
                <select disabled={depositOperation !== null} className={`${inputClass} mt-2`} value={depositCurrency} onChange={(event) => setDepositCurrency(event.target.value)}>
                  <option value="USD">USD</option>
                  <option value="IRR">IRR</option>
                </select>
              </label>
              <p className="text-xs text-slate-500">Provider: FAKE_PROVIDER (sandbox)</p>
              <button
                type="submit"
                disabled={depositMutation.isPending}
                className="w-full rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white disabled:opacity-50"
              >
                {depositMutation.isPending ? "Starting deposit…" : "Start deposit"}
              </button>
              {depositMutation.isError && depositOperation && (
                <button
                  type="button"
                  disabled={depositMutation.isPending}
                  onClick={() => depositMutation.mutate(depositOperation)}
                  className="w-full rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-800 disabled:opacity-50"
                >
                  Retry this deposit safely
                </button>
              )}
            </form>
          </section>

          <section id="withdrawal" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Withdraw</h2>
            <form className="mt-4 space-y-4" onSubmit={handleWithdrawal}>
              <label className="block text-sm font-medium text-slate-700">
                Amount
                <input
                  className={`${inputClass} mt-2`}
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value)}
                  placeholder="50.00"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Currency
                <select className={`${inputClass} mt-2`} value={withdrawCurrency} onChange={(event) => setWithdrawCurrency(event.target.value)}>
                  <option value="USD">USD</option>
                  <option value="IRR">IRR</option>
                  <option value="EUR">EUR</option>
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="TRX">TRX</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Destination
                <input
                  className={`${inputClass} mt-2`}
                  required
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Wallet or account details"
                />
              </label>
              <button
                type="submit"
                disabled={withdrawalMutation.isPending}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 disabled:opacity-50"
              >
                {withdrawalMutation.isPending ? "Submitting…" : "Request withdrawal"}
              </button>
            </form>
          </section>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Deposits</h2>
            <ul className="mt-4 space-y-3">
              {depositsQuery.data?.data.map((deposit) => (
                <li key={deposit.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3 text-sm">
                  <Link href={`/wallet/deposits/${deposit.id}`} className="min-w-0 flex-1 font-medium text-slate-800">
                    {formatDecimalAmount(deposit.amount)} {deposit.currency} · {deposit.status}
                  </Link>
                  {deposit.status === "PENDING" && <span className="text-xs text-slate-500">Verification available</span>}
                </li>
              ))}
              {depositsQuery.data?.data.length === 0 && <li className="text-sm text-slate-500">No deposits yet.</li>}
            </ul>
            {depositsQuery.data && depositsQuery.data.totalPages > 1 && (
              <nav aria-label="Deposit pages" className="mt-4 flex items-center justify-between">
                <button type="button" disabled={depositPage <= 1 || depositsQuery.isFetching} onClick={() => setDepositPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Previous</button>
                <span className="text-xs text-slate-500">{depositPage} / {depositsQuery.data.totalPages}</span>
                <button type="button" disabled={depositPage >= depositsQuery.data.totalPages || depositsQuery.isFetching} onClick={() => setDepositPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
              </nav>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Withdrawals</h2>
            <ul className="mt-4 space-y-3">
              {withdrawalsQuery.data?.data.map((withdrawal) => (
                <li key={withdrawal.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <Link href={`/wallet/withdrawals/${withdrawal.id}`} className="block">
                  {formatDecimalAmount(withdrawal.amount)} {withdrawal.currency} · {withdrawal.status}
                  </Link>
                </li>
              ))}
              {withdrawalsQuery.data?.data.length === 0 && <li className="text-sm text-slate-500">No withdrawals yet.</li>}
            </ul>
            {withdrawalsQuery.data && withdrawalsQuery.data.totalPages > 1 && (
              <nav aria-label="Withdrawal pages" className="mt-4 flex items-center justify-between">
                <button type="button" disabled={withdrawalPage <= 1 || withdrawalsQuery.isFetching} onClick={() => setWithdrawalPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Previous</button>
                <span className="text-xs text-slate-500">{withdrawalPage} / {withdrawalsQuery.data.totalPages}</span>
                <button type="button" disabled={withdrawalPage >= withdrawalsQuery.data.totalPages || withdrawalsQuery.isFetching} onClick={() => setWithdrawalPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
              </nav>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
