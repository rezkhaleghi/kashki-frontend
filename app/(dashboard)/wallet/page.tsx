export default function WalletPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Wallet</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Available balance</h1>
          <p className="mt-3 text-4xl font-semibold text-violet-600">$1,240.00</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Deposit</h2>
            <form className="mt-4 space-y-4">
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" placeholder="100.00" />
              <button className="w-full rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white">
                Deposit funds
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Withdraw</h2>
            <form className="mt-4 space-y-4">
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" placeholder="50.00" />
              <button className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700">
                Request withdrawal
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
