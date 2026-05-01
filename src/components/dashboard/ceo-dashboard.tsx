"use client";

import { useState, useEffect, useMemo } from "react";
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
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import type { Client, MilestoneStatus, Milestone } from "@/lib/types";
import { milestonesByClient } from "@/lib/mock-data";

interface Props { client: Client }

interface EditableField {
  key: string;
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

const statusStyle: Record<MilestoneStatus, { badge: string; icon: React.ElementType; dot: string; ring: string }> = {
  Completed:     { badge: "bg-green-soft text-green",        icon: CheckCircle2, dot: "bg-green",       ring: "stroke-green" },
  "In Progress": { badge: "bg-purple-soft text-purple",      icon: Loader2,      dot: "bg-purple",      ring: "stroke-purple" },
  "Not Started": { badge: "bg-bg-elevated text-text-muted",  icon: CircleDashed, dot: "bg-text-muted/40", ring: "stroke-border-subtle" },
};

// localStorage helpers - shared with daily-ops
interface StoredSession { id: string; date: string; start: string; end: string; startEpoch: number; seconds: number }
const HISTORY_KEY = (clientId: string) => `time-sessions:${clientId}`;
function loadSessions(clientId: string): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY(clientId));
    return raw ? (JSON.parse(raw) as StoredSession[]) : [];
  } catch { return []; }
}
function formatHrsMins(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------- Donut chart (SVG) ----------
function DonutProgress({ percent, completed, inProgress, notStarted }: { percent: number; completed: number; inProgress: number; notStarted: number }) {
  const size = 180;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - percent / 100);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#donut-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <defs>
          <linearGradient id="donut-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--purple)" />
            <stop offset="100%" stopColor="var(--purple-light)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold text-text-primary">{percent}%</p>
        <p className="text-[11px] text-text-muted uppercase tracking-wider mt-1">Complete</p>
      </div>
    </div>
  );
}

// ---------- Compact milestone card with collapsible steps ----------
function MilestoneRow({ milestone, expanded, onToggleExpand, onToggleStep }: {
  milestone: Milestone;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStep: (stepId: string) => void;
}) {
  const cfg = statusStyle[milestone.status];
  const StatusIcon = cfg.icon;
  const done = milestone.steps.filter((s) => s.done).length;
  const total = milestone.steps.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="border border-border-subtle rounded-xl p-4 hover:border-purple/20 transition-colors">
      <button onClick={onToggleExpand} className="w-full text-left flex items-center gap-4 cursor-pointer">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${cfg.badge}`}>
          {milestone.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text-primary">{milestone.title}</p>
            <span className={`badge ${cfg.badge} flex items-center gap-1.5`}>
              <StatusIcon className={`w-3 h-3 ${milestone.status === "In Progress" ? "animate-spin" : ""}`} />
              {milestone.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(milestone.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span>·</span>
            <span>{done}/{total} steps</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-bg-elevated mt-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple to-purple-light transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-text-primary">{pct}%</p>
          {expanded ? <ChevronUp className="w-4 h-4 text-text-muted ml-auto" /> : <ChevronDown className="w-4 h-4 text-text-muted ml-auto" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <p className="text-xs text-text-secondary mb-3 italic">{milestone.intent}</p>
          <div className="space-y-1">
            {milestone.steps.map((s) => (
              <button
                key={s.id}
                onClick={() => onToggleStep(s.id)}
                className="w-full flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-bg-surface transition-colors text-left cursor-pointer group"
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
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Output</p>
            <p className="text-xs text-text-secondary italic">{milestone.output}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MilestoneOverview({ client }: { client: Client }) {
  const initial = milestonesByClient[client.id] ?? [];
  const [milestones, setMilestones] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(initial[1]?.id ?? null);
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  useEffect(() => {
    setSessions(loadSessions(client.id));
  }, [client.id]);

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

  // Aggregate stats
  const totalSteps = milestones.reduce((n, m) => n + m.steps.length, 0);
  const doneSteps = milestones.reduce((n, m) => n + m.steps.filter((s) => s.done).length, 0);
  const completedM = milestones.filter((m) => m.status === "Completed").length;
  const inProgressM = milestones.filter((m) => m.status === "In Progress").length;
  const notStartedM = milestones.filter((m) => m.status === "Not Started").length;
  const progressPct = totalSteps === 0 ? 0 : Math.round((doneSteps / totalSteps) * 100);

  const launchDate = milestones[milestones.length - 1]?.targetDate;
  const daysToLaunch = launchDate
    ? Math.max(0, Math.ceil((new Date(launchDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Time tracker stats
  const weekTotal = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return sessions.filter((s) => s.startEpoch >= cutoff).reduce((sum, s) => sum + s.seconds, 0);
  }, [sessions]);
  const todayTotal = useMemo(() => {
    const today = todayKey();
    return sessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.seconds, 0);
  }, [sessions]);

  const greeting = (() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  })();
  const firstName = client.name.split(" ").slice(1, 2).join(" ") || client.name.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="card p-6 animate-in opacity-0 relative overflow-hidden">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            {client.image && (
              <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-yellow/30 shrink-0">
                <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{client.company}</p>
              <h1 className="text-2xl font-bold text-text-primary mt-1">
                {greeting}, {firstName} <span className="inline-block">👋</span>
              </h1>
              <p className="text-sm text-text-secondary mt-1">Here&apos;s where the Coach Circle PH grand launch stands today.</p>
            </div>
          </div>
          {client.logo && (
            <div className="w-20 h-20 rounded-xl bg-black flex items-center justify-center shrink-0 p-2.5">
              <img src={client.logo} alt={`${client.company} logo`} className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* Mini stat bars - one per milestone */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {milestones.map((m) => {
            const done = m.steps.filter((s) => s.done).length;
            const pct = m.steps.length === 0 ? 0 : Math.round((done / m.steps.length) * 100);
            const cfg = statusStyle[m.status];
            return (
              <div key={m.id} className="bg-bg-surface rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider">M{m.number}</span>
                  <span className="text-xs font-bold text-text-primary">{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${cfg.dot}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[11px] font-medium text-text-secondary mt-2 truncate">{m.title.split(" ").slice(0, 3).join(" ")}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI row + Donut + Time tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile / brand card */}
        <div className="card p-5 animate-in opacity-0 animate-delay-1">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-4">Founder</p>
          {client.image && (
            <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-bg-surface">
              <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
            </div>
          )}
          <p className="text-base font-bold text-text-primary">{client.name}</p>
          <p className="text-xs text-text-secondary mt-0.5">{client.industry}</p>
          <div className="mt-4 pt-4 border-t border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Engagement</span>
              <span className="badge bg-purple-soft text-purple">{client.engagement}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Schedule</span>
              <span className="text-xs font-medium text-text-secondary">{client.schedule}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Rate</span>
              <span className="text-xs font-semibold text-text-primary">{client.rateLabel}</span>
            </div>
          </div>
        </div>

        {/* Donut + breakdown */}
        <div className="card p-5 animate-in opacity-0 animate-delay-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple" /> Launch Progress
            </p>
            <span className="text-xs text-text-muted">{daysToLaunch !== null ? `${daysToLaunch}d left` : "—"}</span>
          </div>
          <div className="flex justify-center my-2">
            <DonutProgress percent={progressPct} completed={completedM} inProgress={inProgressM} notStarted={notStartedM} />
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green" /> Completed</span>
              <span className="font-semibold text-text-primary">{completedM} / {milestones.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple" /> In Progress</span>
              <span className="font-semibold text-text-primary">{inProgressM} / {milestones.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-text-muted/40" /> Not Started</span>
              <span className="font-semibold text-text-primary">{notStartedM} / {milestones.length}</span>
            </div>
          </div>
        </div>

        {/* Time tracker widget */}
        <div className="card p-5 animate-in opacity-0 animate-delay-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple" /> Time Tracker
            </p>
            <span className="text-xs text-text-muted">Last 7 days</span>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-4xl font-bold text-text-primary">{formatHrsMins(weekTotal)}</p>
            <p className="text-xs text-text-muted">tracked</p>
          </div>
          <p className="text-xs text-text-secondary mt-1">Today: <span className="font-semibold text-purple">{formatHrsMins(todayTotal)}</span></p>

          <div className="mt-5 pt-4 border-t border-border-subtle">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Recent sessions</p>
            {sessions.length === 0 ? (
              <p className="text-xs text-text-muted italic">No sessions logged yet — start the timer in Daily Ops.</p>
            ) : (
              <div className="space-y-1.5">
                {sessions.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">
                      {new Date(s.date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {s.start}
                    </span>
                    <span className="font-medium text-text-primary">{formatHrsMins(s.seconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="w-9 h-9 rounded-lg bg-purple-soft text-purple flex items-center justify-center mb-2">
            <Flag className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-text-primary">{completedM}/{milestones.length}</p>
          <p className="text-[11px] text-text-muted">Milestones</p>
        </div>
        <div className="card p-4">
          <div className="w-9 h-9 rounded-lg bg-green-soft text-green flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-text-primary">{doneSteps}/{totalSteps}</p>
          <p className="text-[11px] text-text-muted">Steps</p>
        </div>
        <div className="card p-4">
          <div className="w-9 h-9 rounded-lg bg-yellow-soft text-yellow flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-text-primary">{progressPct}%</p>
          <p className="text-[11px] text-text-muted">Progress</p>
        </div>
        <div className="card p-4">
          <div className="w-9 h-9 rounded-lg bg-purple-soft text-purple-light flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-text-primary">{daysToLaunch !== null ? daysToLaunch : "—"}</p>
          <p className="text-[11px] text-text-muted">Days to launch</p>
        </div>
      </div>

      {/* Launch Roadmap (compact) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Flag className="w-4 h-4 text-purple" /> Launch Roadmap
          </h2>
          <p className="text-xs text-text-muted">Click a milestone to expand</p>
        </div>
        <div className="space-y-3">
          {milestones.map((m) => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              expanded={expanded === m.id}
              onToggleExpand={() => setExpanded((cur) => (cur === m.id ? null : m.id))}
              onToggleStep={(sid) => toggleStep(m.id, sid)}
            />
          ))}
        </div>
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
