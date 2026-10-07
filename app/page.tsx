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

          <nav className="flex items-center gap-2 text-sm text-slate-600 md:gap-6">
            <Link href="/login" className="rounded-full px-3 py-2 transition hover:text-slate-900">
              Login
            </Link>
            <Link href="/signup" className="rounded-full bg-violet-600 px-3 py-2 font-medium text-white transition hover:bg-violet-500 md:bg-transparent md:px-0 md:font-normal md:text-slate-600">
              Sign up
            </Link>
            <Link href="/dashboard" className="hidden rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 md:block">
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

          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <div className="rounded-2xl bg-[#f8f7ff] p-6">
              <p className="text-sm font-medium text-violet-700">Thoughtful giving, made simple</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">A better way to celebrate</h2>
              <div className="mt-6 space-y-4">
                {[
                  { number: "01", title: "Make a birthday list", text: "Collect wishes and choose who can see each list." },
                  { number: "02", title: "Give together", text: "Contribute toward a wish or send a cash gift." },
                  { number: "03", title: "Keep track", text: "Follow gifts and wallet activity in one place." },
                ].map((step) => (
                  <div key={step.number} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                    <span className="font-semibold text-violet-600">{step.number}</span>
                    <div>
                      <p className="font-medium text-slate-900">{step.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{step.text}</p>
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
