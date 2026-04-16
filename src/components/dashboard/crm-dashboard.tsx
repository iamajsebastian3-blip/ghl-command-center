"use client";

import { useState } from "react";
import { Users, DollarSign, TrendingUp, Target, Search, Plus, X, ChevronRight, ChevronLeft, Phone, Mail, MessageSquare, User } from "lucide-react";
import type { PipelineStage, Lead, Client } from "@/lib/types";

interface Props { client: Client }

const stageOrder: PipelineStage[] = [
  "Nurturing", "New Lead", "Offer Presented", "Engaged Prospect",
  "Qualified", "Call Booked", "Deal Negotiation", "Closed Won", "Closed Lost",
];

const stageConfig: Record<PipelineStage, { label: string; color: string; bg: string; dot: string }> = {
  "Nurturing":         { label: "M1", color: "text-purple",       bg: "bg-purple-soft",  dot: "bg-purple" },
  "New Lead":          { label: "M2", color: "text-purple",       bg: "bg-purple-soft",  dot: "bg-purple" },
  "Offer Presented":   { label: "M3", color: "text-yellow",       bg: "bg-yellow-soft",  dot: "bg-yellow" },
  "Engaged Prospect":  { label: "M4", color: "text-purple-light", bg: "bg-purple-soft",  dot: "bg-purple-light" },
  "Qualified":         { label: "M5", color: "text-green",        bg: "bg-green-soft",   dot: "bg-green" },
  "Call Booked":       { label: "M6", color: "text-purple",       bg: "bg-purple-soft",  dot: "bg-purple" },
  "Deal Negotiation":  { label: "M7", color: "text-yellow",       bg: "bg-yellow-soft",  dot: "bg-yellow" },
  "Closed Won":        { label: "M8", color: "text-green",        bg: "bg-green-soft",   dot: "bg-green" },
  "Closed Lost":       { label: "M9", color: "text-text-muted",   bg: "bg-bg-surface",   dot: "bg-text-muted" },
};

const initialLeads: Lead[] = [
  { id: "l1", name: "John Miller", company: "Miller & Sons", email: "john@miller.com", phone: "(555) 123-4567", stage: "Closed Won", value: 4500, source: "Facebook Ads", lastContact: "2026-04-15", notes: "Signed 6-month contract" },
  { id: "l2", name: "Amanda Brooks", company: "Brooks Plumbing", email: "amanda@brooks.com", phone: "(555) 234-5678", stage: "Deal Negotiation", value: 3200, source: "Referral", lastContact: "2026-04-14", notes: "Discussing pricing" },
  { id: "l3", name: "David Lee", company: "Lee Construction", email: "david@leeconst.com", phone: "(555) 345-6789", stage: "Qualified", value: 5000, source: "Google Ads", lastContact: "2026-04-16", notes: "Needs CRM + funnels" },
  { id: "l4", name: "Rachel Kim", company: "Kim Electric", email: "rachel@kimelectric.com", phone: "(555) 456-7890", stage: "Call Booked", value: 2800, source: "LinkedIn", lastContact: "2026-04-13", notes: "Call scheduled Apr 18" },
  { id: "l5", name: "Steve Adams", company: "Adams HVAC", email: "steve@adamshvac.com", phone: "(555) 567-8901", stage: "New Lead", value: 3500, source: "Instagram Ads", lastContact: "2026-04-16", notes: "Filled out form" },
  { id: "l6", name: "Nancy White", company: "White Roofing", email: "nancy@whiteroofing.com", phone: "(555) 678-9012", stage: "Offer Presented", value: 6000, source: "Google Ads", lastContact: "2026-04-12", notes: "Sent proposal PDF" },
  { id: "l7", name: "Carlos Ruiz", company: "Ruiz Landscaping", email: "carlos@ruiz.com", phone: "(555) 789-0123", stage: "Nurturing", value: 2200, source: "Facebook Ads", lastContact: "2026-04-16", notes: "In email sequence" },
  { id: "l8", name: "Tina Nguyen", company: "Nguyen Painting", email: "tina@nguyenpaint.com", phone: "(555) 890-1234", stage: "Closed Won", value: 4800, source: "Referral", lastContact: "2026-04-10", notes: "Onboarded" },
  { id: "l9", name: "Mike Torres", company: "Torres Flooring", email: "mike@torresflooring.com", phone: "(555) 901-2345", stage: "Engaged Prospect", value: 3800, source: "Google Ads", lastContact: "2026-04-15", notes: "Replied to SMS" },
  { id: "l10", name: "Lisa Park", company: "Park Cleaning", email: "lisa@parkcleaning.com", phone: "(555) 012-3456", stage: "Nurturing", value: 1800, source: "Facebook Ads", lastContact: "2026-04-14", notes: "Downloaded lead magnet" },
];

function LeadCard({ lead, onMove, onRemove, expanded, onToggle }: {
  lead: Lead;
  onMove: (id: string, dir: "forward" | "back") => void;
  onRemove: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const stageIdx = stageOrder.indexOf(lead.stage);

  return (
    <div className={`card p-3 cursor-pointer transition-all ${expanded ? "ring-1 ring-purple/20 shadow-sm" : ""}`} onClick={onToggle}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-purple-soft flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-purple">{lead.name.split(" ").map(n => n[0]).join("")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-text-primary truncate">{lead.name}</p>
          <p className="text-[11px] text-text-muted truncate">{lead.company}</p>
        </div>
        <span className="text-xs font-bold text-text-primary shrink-0">${lead.value.toLocaleString()}</span>
      </div>

      {expanded && (
        <div className="mt-3 pt-2.5 border-t border-border-subtle space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <p className="text-[11px] text-text-secondary flex items-center gap-1.5"><Mail className="w-3 h-3 text-text-muted" /> {lead.email}</p>
          <p className="text-[11px] text-text-secondary flex items-center gap-1.5"><Phone className="w-3 h-3 text-text-muted" /> {lead.phone}</p>
          {lead.notes && <p className="text-[11px] text-text-secondary flex items-start gap-1.5"><MessageSquare className="w-3 h-3 text-text-muted mt-0.5 shrink-0" /> {lead.notes}</p>}
          <p className="text-[10px] text-text-muted">Source: {lead.source} &middot; {new Date(lead.lastContact).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>

          {/* Move controls */}
          <div className="flex items-center gap-1 pt-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onMove(lead.id, "back"); }}
              disabled={stageIdx === 0}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${stageIdx === 0 ? "text-text-muted/20" : "bg-bg-surface text-text-muted hover:text-purple"}`}
            >
              <ChevronLeft className="w-3 h-3 inline" /> Back
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMove(lead.id, "forward"); }}
              disabled={stageIdx >= stageOrder.length - 1}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${stageIdx >= stageOrder.length - 1 ? "text-text-muted/20" : "bg-purple-soft text-purple hover:bg-purple/15"}`}
            >
              Next <ChevronRight className="w-3 h-3 inline" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onRemove(lead.id); }} className="ml-auto text-[10px] text-text-muted hover:text-yellow transition-colors cursor-pointer">Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CRMDashboard({ client }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [newLead, setNewLead] = useState({ name: "", company: "", email: "", phone: "", value: "", source: "", notes: "" });

  const activeStages = stageOrder.filter((s) => s !== "Closed Lost");
  const filtered = leads.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase()));

  const totalLeads = leads.length;
  const qualifiedPlus = leads.filter((l) => ["Qualified", "Call Booked", "Deal Negotiation", "Closed Won"].includes(l.stage)).length;
  const closedDeals = leads.filter((l) => l.stage === "Closed Won").length;
  const totalValue = leads.filter((l) => l.stage === "Closed Won").reduce((sum, l) => sum + l.value, 0);
  const pipelineValue = leads.filter((l) => !["Closed Won", "Closed Lost"].includes(l.stage)).reduce((sum, l) => sum + l.value, 0);
  const conversionRate = totalLeads > 0 ? Math.round((closedDeals / totalLeads) * 100) : 0;

  const moveLeadStage = (id: string, dir: "forward" | "back") => {
    setLeads((prev) => prev.map((lead) => {
      if (lead.id !== id) return lead;
      const idx = stageOrder.indexOf(lead.stage);
      const newIdx = dir === "forward" ? idx + 1 : idx - 1;
      if (newIdx < 0 || newIdx >= stageOrder.length) return lead;
      return { ...lead, stage: stageOrder[newIdx] };
    }));
  };

  const addLead = () => {
    if (!newLead.name.trim()) return;
    const lead: Lead = {
      id: `l${Date.now()}`, name: newLead.name.trim(), company: newLead.company.trim(),
      email: newLead.email.trim(), phone: newLead.phone.trim(), stage: "New Lead",
      value: parseInt(newLead.value) || 0, source: newLead.source.trim() || "Manual",
      lastContact: new Date().toISOString().split("T")[0], notes: newLead.notes.trim(),
    };
    setLeads((prev) => [lead, ...prev]);
    setNewLead({ name: "", company: "", email: "", phone: "", value: "", source: "", notes: "" });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4 animate-in opacity-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">CRM & Pipeline</h1>
          <p className="text-sm text-text-secondary mt-1">{client.name} &middot; GHL workflow stages</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {showAddForm && (
        <div className="card p-4 border-l-4 border-l-purple animate-in opacity-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input type="text" value={newLead.name} onChange={(e) => setNewLead((p) => ({ ...p, name: e.target.value }))} placeholder="Name *" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" autoFocus />
            <input type="text" value={newLead.company} onChange={(e) => setNewLead((p) => ({ ...p, company: e.target.value }))} placeholder="Company" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={newLead.email} onChange={(e) => setNewLead((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={newLead.phone} onChange={(e) => setNewLead((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={newLead.value} onChange={(e) => setNewLead((p) => ({ ...p, value: e.target.value }))} placeholder="Deal value ($)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={newLead.source} onChange={(e) => setNewLead((p) => ({ ...p, source: e.target.value }))} placeholder="Source" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={newLead.notes} onChange={(e) => setNewLead((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <div className="flex gap-2">
              <button onClick={addLead} className="flex-1 px-3 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">Add</button>
              <button onClick={() => setShowAddForm(false)} className="px-2 py-2 rounded-lg text-text-muted hover:text-text-secondary cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-in opacity-0 animate-delay-1">
        {[
          { label: "Total Leads", value: totalLeads, icon: Users, bg: "bg-purple-soft", color: "text-purple" },
          { label: "Qualified+", value: qualifiedPlus, icon: Target, bg: "bg-green-soft", color: "text-green" },
          { label: "Closed Won", value: closedDeals, icon: TrendingUp, bg: "bg-green-soft", color: "text-green" },
          { label: "Revenue", value: `$${totalValue.toLocaleString()}`, icon: DollarSign, bg: "bg-yellow-soft", color: "text-yellow" },
          { label: "Pipeline", value: `$${pipelineValue.toLocaleString()}`, icon: DollarSign, bg: "bg-purple-soft", color: "text-purple" },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-3 text-center">
            <kpi.icon className={`w-4 h-4 mx-auto mb-1.5 ${kpi.color}`} />
            <p className="text-lg font-bold text-text-primary">{kpi.value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative animate-in opacity-0 animate-delay-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..."
          className="w-full bg-bg-card border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
      </div>

      {/* Pipeline Board */}
      <div className="pipeline-scroll animate-in opacity-0 animate-delay-3">
        <div className="flex gap-2.5" style={{ minWidth: `${activeStages.length * 175}px` }}>
          {activeStages.map((stage) => {
            const cfg = stageConfig[stage];
            const stageLeads = filtered.filter((l) => l.stage === stage);
            const stageValue = stageLeads.reduce((s, l) => s + l.value, 0);
            return (
              <div key={stage} className="flex-1 min-w-[165px]">
                {/* Stage Header */}
                <div className={`rounded-lg px-3 py-2 mb-2 ${cfg.bg} border border-transparent`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label} &middot; {stage}</span>
                    <span className={`text-[11px] font-bold ${cfg.color}`}>{stageLeads.length}</span>
                  </div>
                  {stageValue > 0 && <p className="text-[10px] text-text-muted mt-0.5">${stageValue.toLocaleString()}</p>}
                </div>

                {/* Lead Cards */}
                <div className="space-y-2">
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onMove={moveLeadStage}
                      onRemove={(id) => setLeads((prev) => prev.filter((l) => l.id !== id))}
                      expanded={expandedLead === lead.id}
                      onToggle={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    />
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="border border-dashed border-border-subtle rounded-lg p-4 text-center">
                      <p className="text-[10px] text-text-muted">No leads</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
