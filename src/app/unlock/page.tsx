"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Lock, Loader2 } from "lucide-react";

export default function UnlockPage() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Wrong passcode");
        setSubmitting(false);
        return;
      }
      router.replace(from || "/");
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <p className="text-base font-bold text-text-primary tracking-tight">GHL Command Center</p>
          <p className="text-xs text-text-muted">System-BuiltBy AJ</p>
        </div>

        <form onSubmit={onSubmit} className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-purple" />
            <h1 className="text-sm font-semibold text-text-primary">Owner access</h1>
          </div>
          <label className="block text-xs text-text-muted mb-2">Passcode</label>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoFocus
            disabled={submitting}
            className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-purple"
            placeholder="Enter your passcode"
          />
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting || passcode.length === 0}
            className="mt-4 w-full px-3 py-2 rounded-lg bg-purple text-white text-sm font-semibold hover:bg-purple/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Unlocking…</> : "Unlock"}
          </button>
          <p className="text-[11px] text-text-muted mt-4 leading-relaxed">
            Public client views at <code className="text-text-secondary">/c/&lt;slug&gt;</code> don&apos;t require this passcode.
          </p>
        </form>
      </div>
    </div>
  );
}
