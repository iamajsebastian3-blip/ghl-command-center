"use client";

import { Zap, ArrowRight, Clock, Briefcase } from "lucide-react";
import { clients } from "@/lib/mock-data";
import type { Client, EngagementType } from "@/lib/types";

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
  return (
    <div className="min-h-screen bg-bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-bg-card border-b border-border-subtle px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-text-primary tracking-tight">GHL Command Center</p>
            <p className="text-xs text-text-muted">System-BuiltBy AJ</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 animate-in opacity-0">
            <h1 className="text-2xl font-bold text-text-primary">Select a Client</h1>
            <p className="text-sm text-text-secondary mt-1">Choose a client to view their GHL dashboard</p>
          </div>

          {/* Client Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client, idx) => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className={`card p-5 text-left cursor-pointer group animate-in opacity-0 animate-delay-${idx + 1}`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-purple-soft flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-purple">{client.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{client.name}</p>
                    <p className="text-xs text-text-muted truncate">{client.company}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Industry</span>
                    <span className="text-xs text-text-secondary font-medium">{client.industry}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Rate</span>
                    <span className="text-xs text-text-primary font-semibold">{client.rateLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Status</span>
                    <span className={`badge ${statusStyle[client.status]}`}>{client.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> Schedule</span>
                    <span className="text-xs text-text-secondary font-medium">{client.schedule}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted flex items-center gap-1"><Briefcase className="w-3 h-3" /> Type</span>
                    <span className={`badge ${engagementStyle[client.engagement]}`}>{client.engagement}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                  <span className="text-xs text-text-muted">Since {new Date(client.joinedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-purple transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
