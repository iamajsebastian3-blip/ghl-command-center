"use client";

import { useState } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Workflow,
  Target,
  CheckCircle2,
  Pencil,
  Check,
  X,
  Calendar,
  CircleDashed,
  Loader2,
  Flag,
} from "lucide-react";
import type { Client, MilestoneStatus } from "@/lib/types";
import { milestonesByClient } from "@/lib/mock-data";

interface Props { client: Client }

interface EditableField {
  key: string;
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

const statusStyle: Record<MilestoneStatus, { badge: string; icon: React.ElementType; dot: string }> = {
  Completed: { badge: "bg-green-soft text-green", icon: CheckCircle2, dot: "bg-green" },
  "In Progress": { badge: "bg-purple-soft text-purple", icon: Loader2, dot: "bg-purple" },
  "Not Started": { badge: "bg-bg-surface text-text-muted", icon: CircleDashed, dot: "bg-text-muted/40" },
};

function MilestoneOverview({ client }: { client: Client }) {
  const initial = milestonesByClient[client.id] ?? [];
  const [milestones, setMilestones] = useState(initial);

  const toggleStep = (mid: string, sid: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== mid) return m;
        const steps = m.steps.map((s) => (s.id === sid ? { ...s, done: !s.done } : s));
        const doneCount = steps.filter((s) => s.done).length;
        let status: MilestoneStatus = "Not Started";
        if (doneCount === steps.length) status = "Completed";
        else if (doneCount > 0) status = "In Progress";
        return { ...m, steps, status };
      })
    );
  };

  const totalSteps = milestones.reduce((n, m) => n + m.steps.length, 0);
  const doneSteps = milestones.reduce((n, m) => n + m.steps.filter((s) => s.done).length, 0);
  const completedMilestones = milestones.filter((m) => m.status === "Completed").length;
  const progressPct = totalSteps === 0 ? 0 : Math.round((doneSteps / totalSteps) * 100);
  const launchDate = milestones[milestones.length - 1]?.targetDate;
  const daysToLaunch = launchDate
    ? Math.ceil((new Date(launchDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const summaryCards = [
    { label: "Milestones Done", value: `${completedMilestones}/${milestones.length}`, icon: Flag, color: "bg-purple-soft text-purple" },
    { label: "Steps Complete", value: `${doneSteps}/${totalSteps}`, icon: CheckCircle2, color: "bg-green-soft text-green" },
    { label: "Overall Progress", value: `${progressPct}%`, icon: TrendingUp, color: "bg-yellow-soft text-yellow" },
    { label: "Days to Launch", value: daysToLaunch !== null ? `${daysToLaunch}` : "—", icon: Calendar, color: "bg-purple-soft text-purple-light" },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Coach Circle branding */}
      <div className="card p-6 animate-in opacity-0 overflow-hidden relative">
        <div className="flex items-center gap-5">
          {client.image && (
            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 ring-2 ring-yellow/30">
              <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Project Overview</p>
            <h1 className="text-2xl font-bold text-text-primary">{client.company}</h1>
            <p className="text-sm text-text-secondary mt-1">{client.name} · {client.industry} · Grand Launch Roadmap</p>
          </div>
          {client.logo && (
            <div className="w-20 h-20 rounded-lg bg-black flex items-center justify-center shrink-0 p-2">
              <img src={client.logo} alt={`${client.company} logo`} className="w-full h-full object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((kpi, i) => (
          <div key={kpi.label} className={`card p-5 animate-in opacity-0 animate-delay-${i + 1}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{kpi.value}</p>
            <p className="text-xs text-text-muted mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card p-5 animate-in opacity-0 animate-delay-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-text-primary">Grand Launch Progress</h2>
          <span className="text-xs text-text-muted">{progressPct}% complete</span>
        </div>
        <div className="w-full h-2 rounded-full bg-bg-surface overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple to-purple-light transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-text-muted mt-2">
          Launch target: {launchDate ? new Date(launchDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
        </p>
      </div>

      {/* Milestone timeline */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-text-primary px-1">6 Milestones for the Grand Launch</h2>
        {milestones.map((m, idx) => {
          const cfg = statusStyle[m.status];
          const StatusIcon = cfg.icon;
          const doneInM = m.steps.filter((s) => s.done).length;
          return (
            <div key={m.id} className="card p-5 animate-in opacity-0">
              <div className="flex items-start gap-4">
                {/* Number bubble */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${cfg.badge}`}>
                    {m.number}
                  </div>
                  {idx !== milestones.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border-subtle mt-2 min-h-[40px]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider">Milestone {m.number}</p>
                      <h3 className="text-base font-semibold text-text-primary mt-0.5">{m.title}</h3>
                      <p className="text-xs text-text-secondary mt-1">{m.intent}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${cfg.badge} flex items-center gap-1.5`}>
                        <StatusIcon className={`w-3 h-3 ${m.status === "In Progress" ? "animate-spin" : ""}`} />
                        {m.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="text-xs text-text-muted flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      Target: {new Date(m.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="text-xs text-text-muted">·</span>
                    <span className="text-xs text-text-muted">
                      {doneInM}/{m.steps.length} steps
                    </span>
                  </div>

                  {/* Steps */}
                  <div className="mt-4 space-y-1.5">
                    {m.steps.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => toggleStep(m.id, s.id)}
                        className="w-full flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-bg-surface transition-colors text-left cursor-pointer group"
                      >
                        <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                          s.done ? "bg-green border-green" : "border-border-subtle group-hover:border-purple/40"
                        }`}>
                          {s.done && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm flex-1 ${s.done ? "text-text-muted line-through" : "text-text-primary"}`}>
                          {s.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Output */}
                  <div className="mt-4 pt-3 border-t border-border-subtle">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Output</p>
                    <p className="text-xs text-text-secondary italic">{m.output}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiOverview({ client }: { client: Client }) {
  const [stats, setStats] = useState({
    totalLeads: "8",
    dealsClosed: "2",
    revenueCollected: "$5,700",
    conversionRate: "25%",
    activeFunnels: "1",
    activeWorkflows: "2",
    tasksDone: "2/8",
    pendingRevenue: "$2,500",
    overdueInvoices: "1",
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (key: string, currentValue: string) => {
    setEditingField(key);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingField) {
      setStats((prev) => ({ ...prev, [editingField]: editValue }));
      setEditingField(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const kpis = [
    { key: "totalLeads", label: "Total Leads", icon: Users, color: "bg-purple-soft text-purple" },
    { key: "dealsClosed", label: "Deals Closed", icon: Target, color: "bg-green-soft text-green" },
    { key: "revenueCollected", label: "Revenue Collected", icon: DollarSign, color: "bg-yellow-soft text-yellow" },
    { key: "conversionRate", label: "Conversion Rate", icon: TrendingUp, color: "bg-purple-soft text-purple" },
  ];

  const quickStats: EditableField[] = [
    { key: "activeFunnels", label: "Active Funnels", value: stats.activeFunnels, icon: Workflow, color: "text-purple" },
    { key: "activeWorkflows", label: "Active Workflows", value: stats.activeWorkflows, icon: Workflow, color: "text-purple-light" },
    { key: "tasksDone", label: "Tasks Done", value: stats.tasksDone, icon: CheckCircle2, color: "text-green" },
    { key: "pendingRevenue", label: "Pending Revenue", value: stats.pendingRevenue, icon: DollarSign, color: "text-yellow" },
    { key: "overdueInvoices", label: "Overdue Invoices", value: stats.overdueInvoices, icon: DollarSign, color: "text-yellow" },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-in opacity-0">
        <h1 className="text-2xl font-bold text-text-primary">{client.name}</h1>
        <p className="text-sm text-text-secondary mt-1">{client.company} &middot; {client.industry} &middot; Overview</p>
        <p className="text-xs text-text-muted mt-2">Click any value to edit it</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const val = stats[kpi.key as keyof typeof stats];
          const isEditing = editingField === kpi.key;
          return (
            <div key={kpi.key} className={`card p-5 animate-in opacity-0 animate-delay-${i + 1}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                {!isEditing && (
                  <button onClick={() => startEdit(kpi.key, val)} className="text-text-muted hover:text-purple transition-colors cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                    className="flex-1 bg-bg-surface border border-purple/30 rounded-lg px-3 py-2 text-xl font-bold text-text-primary focus:outline-none focus:border-purple/60"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="p-1.5 rounded-lg bg-green-soft text-green hover:bg-green/20 transition-colors cursor-pointer"><Check className="w-4 h-4" /></button>
                  <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-bg-surface text-text-muted hover:text-text-secondary transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="text-2xl font-bold text-text-primary cursor-pointer hover:text-purple transition-colors" onClick={() => startEdit(kpi.key, val)}>{val}</p>
              )}
              <p className="text-xs text-text-muted mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="card p-5 animate-in opacity-0 animate-delay-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Quick Stats</h2>
        <div className="space-y-3">
          {quickStats.map((item) => {
            const isEditing = editingField === item.key;
            return (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                <span className="text-xs text-text-secondary flex items-center gap-2">
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} /> {item.label}
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                      className="w-24 bg-bg-surface border border-purple/30 rounded px-2 py-1 text-sm font-semibold text-text-primary text-right focus:outline-none focus:border-purple/60"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-green cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={cancelEdit} className="text-text-muted cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <span
                    className="text-sm font-semibold text-text-primary cursor-pointer hover:text-purple transition-colors flex items-center gap-1.5"
                    onClick={() => startEdit(item.key, item.value)}
                  >
                    {item.value}
                    <Pencil className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CEODashboard({ client }: Props) {
  if (milestonesByClient[client.id]) {
    return <MilestoneOverview client={client} />;
  }
  return <KpiOverview client={client} />;
}
