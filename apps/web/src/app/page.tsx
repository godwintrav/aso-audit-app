import Link from "next/link";

const featureCards = [
  {
    title: "Storefront intelligence",
    copy:
      "Analyze title, subtitle, description, screenshots, and customer sentiment to find the exact ASO levers that shape conversion.",
  },
  {
    title: "Competitor benchmarking",
    copy:
      "Compare your app against top performers to see where your listing is falling behind and where you can win more visibility.",
  },
  {
    title: "Actionable recommendations",
    copy:
      "Turn raw data into prioritized ideas for metadata, creative updates, and review-response strategy with scoring backed by evidence.",
  },
];

const useCases = [
  "App founders validating a launch",
  "Growth teams optimizing conversion",
  "Product marketers testing listing experiments",
  "Agencies managing multiple apps",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
        <header className="mb-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/50">
              <span className="text-lg font-bold text-indigo-300">A</span>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-indigo-300 uppercase">
                ASO Audit Agent
              </p>
            </div>
          </div>

          <Link
            href="/audit"
            className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
          >
            Get Started
          </Link>
        </header>

        <section className="grid items-center gap-10 pb-20 pt-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
              AI-powered App Store optimization
            </div>

            <h1 className="max-w-xl text-5xl font-black tracking-tight text-white sm:text-6xl">
              Turn your App Store listing into a growth engine.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              ASO Audit Agent reviews your app like a product and growth team would: it
              checks metadata, screenshots, user feedback, and market positioning to reveal
              the highest-impact opportunities for more installs and better conversion.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/audit"
                className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
              >
                Get Started
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-6 py-3 text-base font-semibold text-slate-100 transition hover:border-slate-500"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-300">
              <div>
                <div className="text-2xl font-bold text-white">10</div>
                <div>ASO dimensions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">20–40s</div>
                <div>Typical audit time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">100</div>
                <div>Score-based insights</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-950/40 ring-1 ring-white/5 backdrop-blur">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Live app scan</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Uber</h2>
                </div>
                <div className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  82/100
                </div>
              </div>

              <div className="space-y-4">
                {[
                  ["Title & subtitle", "Strong but slightly generic"],
                  ["Screenshots", "Good visual flow, weak CTA clarity"],
                  ["Reviews", "Positive sentiment, recurring friction points"],
                  ["Competitors", "Losing share on keyword alignment"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-300">{label}</span>
                      <span className="text-slate-100">{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-indigo-500/10 p-4 text-sm text-indigo-100 ring-1 ring-indigo-500/20">
                Suggested focus: tighten the value proposition in the first 2 lines of the listing
                and improve screenshot storytelling for conversion.
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-[0.2em] text-indigo-300 uppercase">
              Why teams use it
            </p>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Everything you need to improve app discoverability and conversion.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/20"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-lg text-indigo-300 ring-1 ring-indigo-400/25">
                  ✦
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{feature.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-indigo-300 uppercase">
                  Built for
                </p>
                <h2 className="mt-4 text-3xl font-bold text-white">App teams that want faster wins.</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {useCases.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/15 via-slate-900 to-slate-950 p-8 text-center shadow-xl shadow-indigo-950/30 lg:p-12">
            <p className="text-sm font-semibold tracking-[0.2em] text-indigo-200 uppercase">
              Start optimizing today
            </p>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Audit any App Store listing in minutes.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Spot the biggest conversion gaps, benchmark against competitors, and turn your app
              listing into a higher-performing acquisition channel.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href="/audit"
                className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
