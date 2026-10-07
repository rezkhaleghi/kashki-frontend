export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">Welcome back</h1>
          </div>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            New list
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Balance", value: "$1,240.00" },
            { label: "Lists", value: "4" },
            { label: "Gifts received", value: "$640.00" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Your lists</h2>
            <div className="mt-5 space-y-4">
              {[
                { name: "Birthday Wish List", visibility: "Public" },
                { name: "Travel goals", visibility: "Unlisted" },
                { name: "Family wishlist", visibility: "Private" },
              ].map((list) => (
                <div key={list.name} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{list.name}</p>
                    <p className="text-sm text-slate-500">{list.visibility}</p>
                  </div>
                  <button className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                    View
                  </button>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Recent activity</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              <li className="rounded-xl bg-slate-50 p-3">Ari funded your Camera kit</li>
              <li className="rounded-xl bg-slate-50 p-3">Your deposit was verified</li>
              <li className="rounded-xl bg-slate-50 p-3">A new notification arrived</li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
