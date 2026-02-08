const highlights = [
  {
    title: "Fast iteration",
    description: "Vite delivers instant feedback while you build your next idea.",
  },
  {
    title: "TypeScript by default",
    description: "Safer refactors and better editor tooling out of the box.",
  },
  {
    title: "Tailwind styling",
    description: "Utility-first classes keep your UI consistent and flexible.",
  },
];

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <header className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-16">
        <span className="w-fit rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
          Lovable Starter
        </span>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Build your next product with a clean Vite + React foundation.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          This starter includes TypeScript, Tailwind CSS, and a structured layout so
          you can focus on features instead of setup.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
            href="https://vitejs.dev/"
            target="_blank"
            rel="noreferrer"
          >
            Explore Vite
          </a>
          <a
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            href="https://tailwindcss.com/"
            target="_blank"
            rel="noreferrer"
          >
            Tailwind Docs
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 pb-20 sm:grid-cols-3">
        {highlights.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl shadow-slate-950/40"
          >
            <h2 className="text-lg font-semibold text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {item.description}
            </p>
          </article>
        ))}
      </main>
    </div>
  );
}
