"use client";

import { Zap, MessageSquare } from "lucide-react";
import type { Client } from "@/lib/types";
import TaskManager from "@/components/dashboard/task-manager";

export default function PublicClientView({ client, slug }: { client: Client; slug: string }) {
  return (
    <div className="min-h-screen bg-bg-surface flex flex-col">
      <header className="bg-bg-card border-b border-border-subtle px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {client.image ? (
              <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-border-subtle">
                <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-soft flex items-center justify-center">
                <span className="text-sm font-bold text-purple">{client.avatar}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-text-primary leading-tight">{client.company}</p>
              <p className="text-xs text-text-muted">{client.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live · comments enabled</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <TaskManager client={client} clientMode slug={slug} />
        </div>
      </main>

      <footer className="border-t border-border-subtle px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-purple flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span>GHL Command Center · System-BuiltBy AJ</span>
          </div>
          <span>Open a task to leave feedback.</span>
        </div>
      </footer>
    </div>
  );
}
