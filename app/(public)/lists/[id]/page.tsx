type PageProps = {
  params: { id: string };
};

export default function PublicListPage({ params }: PageProps) {
  const { id } = params;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Public list</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">List {id}</h1>
        <div className="mt-8 space-y-4">
          {[
            { title: "Wireless earbuds", amount: "$120" },
            { title: "Travel voucher", amount: "$500" },
          ].map((wish) => (
            <div key={wish.title} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
              <div>
                <p className="font-medium text-slate-900">{wish.title}</p>
                <p className="text-sm text-slate-500">Goal {wish.amount}</p>
              </div>
              <button className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white">
                Contribute
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
