"use client";

import { useState } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Workflow,
  Target,
  CheckCircle2,
  ArrowUpRight,
  Pencil,
  Check,
  X,
} from "lucide-react";
import type { Client } from "@/lib/types";

interface Props { client: Client }

interface EditableField {
  key: string;
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

export default function CEODashboard({ client }: Props) {
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
