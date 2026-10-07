import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(110,85,255,0.18),_transparent_45%),linear-gradient(to_bottom,_#fff,_#fafaf9)] text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
              K
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.15em] text-slate-500 uppercase">
                Kashki
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <Link href="/login" className="transition hover:text-slate-900">
              Login
            </Link>
            <Link href="/signup" className="transition hover:text-slate-900">
              Sign up
            </Link>
            <Link href="/dashboard" className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700">
              Dashboard
            </Link>
          </nav>
        </header>

        <section className="grid items-center gap-12 pb-16 pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:pt-24">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
              Birthday wishlist platform
            </p>

            <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
              Know what they want.
              <span className="mt-2 block text-violet-600">Make their birthday better.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Help friends discover the perfect present, fund a wish, and send a birthday gift with a wallet designed for joyful giving.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/signup" className="rounded-full bg-violet-600 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500">
                Create your birthday list
              </Link>
              <Link href="/login" className="rounded-full border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Log in
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-8 text-sm text-slate-500">
              <div>
                <p className="text-2xl font-semibold text-slate-900">1,200+</p>
                <p>birthday lists</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">$84k</p>
                <p>gifted this year</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">94%</p>
                <p>wish fulfillment</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70">
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
              <p className="text-sm font-medium text-violet-700">Featured birthday list</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Maya&apos;s dream wishlist</h2>
              <div className="mt-5 space-y-4">
                {[
                  { title: "Camera kit", amount: "$850", funded: "$420" },
                  { title: "Weekend getaway", amount: "$1,200", funded: "$210" },
                  { title: "Bookshelf", amount: "$160", funded: "$90" },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-600">Goal {item.amount}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {item.funded} funded
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
