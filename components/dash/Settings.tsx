"use client";
export default function Settings({ repo, setRepo }: { repo: string; setRepo: (s: string) => void }) {
  return (
    <div className="panel max-w-xl space-y-4 p-6">
      <h3 className="font-semibold">Connected repository</h3>
      <input value={repo} onChange={(e) => setRepo(e.target.value.trim().slice(0, 201))} placeholder="your-org/automaton" className="w-full rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" />
      <p className="text-xs text-[var(--muted)]">Passed to agents as read-only context. No code is read or pushed yet — real GitHub access needs a GitHub App, which is a planned integration.</p>
      <button className="btn-ghost text-sm" onClick={() => { if (confirm("Delete ALL local Orvia data in this browser?")) { Object.keys(localStorage).filter((k) => k.startsWith("orvia.")).forEach((k) => localStorage.removeItem(k)); location.reload(); } }}>Erase local data</button>
    </div>
  );
}
