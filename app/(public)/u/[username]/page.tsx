type PageProps = {
  params: { username: string };
};

export default function PublicUserPage({ params }: PageProps) {
  const { username } = params;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Public profile</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">@{username}</h1>
        <p className="mt-4 max-w-xl text-slate-600">
          This profile is visible publicly and includes birthday details plus public wishes.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            { title: "Birthday list", count: "3 wishes" },
            { title: "Travel fund", count: "2 wishes" },
          ].map((list) => (
            <div key={list.title} className="rounded-2xl border border-slate-200 p-5">
              <p className="text-lg font-semibold text-slate-900">{list.title}</p>
              <p className="mt-2 text-sm text-slate-500">{list.count}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
