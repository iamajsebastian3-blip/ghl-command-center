"use client";

import { useState, useTransition } from "react";
import { Zap, ArrowRight, Clock, Briefcase, Plus, X, Loader2, Lock, Copy } from "lucide-react";
import type { Client, EngagementType } from "@/lib/types";
import { useClients, type ClientWithSlug } from "@/lib/hooks/use-clients";
import { createClientAction } from "@/app/actions/clients";

interface ClientSelectorProps {
  onSelectClient: (client: Client) => void;
}

const statusStyle: Record<Client["status"], string> = {
  Active: "bg-green-soft text-green",
  Onboarding: "bg-purple-soft text-purple",
  Paused: "bg-yellow-soft text-yellow",
};

const engagementStyle: Record<EngagementType, string> = {
  "Full-time": "bg-purple-soft text-purple",
  "Part-time": "bg-yellow-soft text-yellow",
  "Project-based": "bg-green-soft text-green",
};

export default function ClientSelector({ onSelectClient }: ClientSelectorProps) {
  const { clients, loading, error } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function onLock() {
    await fetch("/api/unlock", { method: "DELETE" });
    window.location.href = "/unlock";
  }

  function copyClientUrl(slug: string) {
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="min-h-screen bg-bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-bg-card border-b border-border-subtle px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-text-primary tracking-tight">GHL Command Center</p>
              <p className="text-xs text-text-muted">System-BuiltBy AJ</p>
            </div>
          </div>
          <button
            onClick={onLock}
            className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Select a Client</h1>
              <p className="text-sm text-text-secondary mt-1">Choose a client to view their GHL dashboard</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple text-white text-sm font-semibold hover:bg-purple/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>

          {error && (
            <div className="card p-4 mb-6 border border-red-500/30 bg-red-500/5">
              <p className="text-sm text-red-500">Error loading clients: {error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-purple animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <EmptyState onAdd={() => setShowForm(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onSelect={() => onSelectClient(client)}
                  onCopyUrl={() => copyClientUrl(client.slug)}
                  copied={copied === client.slug}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && <AddClientForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card p-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-purple-soft flex items-center justify-center mx-auto mb-4">
        <Briefcase className="w-6 h-6 text-purple" />
      </div>
      <h2 className="text-base font-semibold text-text-primary">No clients yet</h2>
      <p className="text-sm text-text-secondary mt-1 mb-5">Add your first client to get started.</p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple text-white text-sm font-semibold hover:bg-purple/90"
      >
        <Plus className="w-4 h-4" />
        Add Your First Client
      </button>
    </div>
  );
}

function ClientCard({
  client,
  onSelect,
  onCopyUrl,
  copied,
}: {
  client: ClientWithSlug;
  onSelect: () => void;
  onCopyUrl: () => void;
  copied: boolean;
}) {
  return (
    <div className="card p-5 group">
      <button onClick={onSelect} className="w-full text-left cursor-pointer">
        <div className="flex items-start gap-4">
          {client.image ? (
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-border-subtle">
              <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-purple-soft flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-purple">{client.avatar}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{client.name}</p>
            <p className="text-xs text-text-muted truncate">{client.company}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Industry</span>
            <span className="text-xs text-text-secondary font-medium">{client.industry || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Rate</span>
            <span className="text-xs text-text-primary font-semibold">{client.rateLabel || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Status</span>
            <span className={`badge ${statusStyle[client.status]}`}>{client.status}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> Schedule</span>
            <span className="text-xs text-text-secondary font-medium">{client.schedule || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted flex items-center gap-1"><Briefcase className="w-3 h-3" /> Type</span>
            <span className={`badge ${engagementStyle[client.engagement]}`}>{client.engagement}</span>
          </div>
        </div>
      </button>

      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
        <button
          onClick={onCopyUrl}
          className="text-xs text-text-muted hover:text-purple flex items-center gap-1.5 transition-colors"
          title={`/c/${client.slug}`}
        >
          <Copy className="w-3 h-3" />
          {copied ? "Copied!" : "Copy client link"}
        </button>
        <button
          onClick={onSelect}
          className="text-xs font-medium text-purple flex items-center gap-1 hover:gap-2 transition-all"
        >
          Open
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function AddClientForm({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    company: "",
    slug: "",
    industry: "",
    status: "Active" as Client["status"],
    engagement: "Full-time" as EngagementType,
    schedule: "M-F (9AM-5PM)",
    rate: "",
    rateLabel: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createClientAction({
        name: form.name,
        company: form.company,
        slug: form.slug || undefined,
        industry: form.industry || undefined,
        status: form.status,
        engagement: form.engagement,
        schedule: form.schedule || undefined,
        rate: form.rate ? Number(form.rate) : undefined,
        rateLabel: form.rateLabel || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">Add Client</h2>
          <button onClick={onClose} disabled={pending} className="text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Name *">
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="input"
              placeholder="Coach Lish Aquino"
            />
          </Field>

          <Field label="Company *">
            <input
              required
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className="input"
              placeholder="Coach Circle PH"
            />
          </Field>

          <Field label="URL slug" hint="Used in /c/<slug>. Auto-generated if blank.">
            <input
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              className="input font-mono text-xs"
              placeholder="coach-lish"
            />
          </Field>

          <Field label="Industry">
            <input
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              className="input"
              placeholder="Coaching"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value as Client["status"])}
                className="input"
              >
                <option>Active</option>
                <option>Onboarding</option>
                <option>Paused</option>
              </select>
            </Field>

            <Field label="Engagement">
              <select
                value={form.engagement}
                onChange={(e) => update("engagement", e.target.value as EngagementType)}
                className="input"
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Project-based</option>
              </select>
            </Field>
          </div>

          <Field label="Schedule">
            <input
              value={form.schedule}
              onChange={(e) => update("schedule", e.target.value)}
              className="input"
              placeholder="M-F (9AM-5PM)"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rate (number)">
              <input
                type="number"
                value={form.rate}
                onChange={(e) => update("rate", e.target.value)}
                className="input"
                placeholder="40000"
              />
            </Field>

            <Field label="Rate label">
              <input
                value={form.rateLabel}
                onChange={(e) => update("rateLabel", e.target.value)}
                className="input"
                placeholder="₱40,000/mo"
              />
            </Field>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-purple text-white text-sm font-semibold hover:bg-purple/90 disabled:opacity-50 flex items-center gap-2"
            >
              {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </div>
  );
}
