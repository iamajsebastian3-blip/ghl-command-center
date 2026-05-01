"use client";

import {
  LayoutDashboard,
  CalendarClock,
  ListChecks,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import type { ViewType, Client } from "@/lib/types";

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggle: () => void;
  client: Client;
  onBack?: () => void;
  badge?: string;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "daily-ops", label: "Daily Ops", icon: CalendarClock },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "files", label: "Files & Assets", icon: FolderOpen },
];

export default function Sidebar({ activeView, onViewChange, collapsed, onToggle, client, onBack, badge }: SidebarProps) {
  return (
    <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col bg-bg-card border-r border-border-subtle transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[240px]"}`}>
      <div className="px-4 py-4 border-b border-border-subtle">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-xs text-text-muted hover:text-purple transition-colors cursor-pointer mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            {!collapsed && <span>All Clients</span>}
          </button>
        )}
        {badge && !collapsed && (
          <div className="mb-3">
            <span className="badge bg-green-soft text-green text-[10px]">{badge}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          {client.image ? (
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-border-subtle">
              <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-purple-soft flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-purple">{client.avatar}</span>
            </div>
          )}
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-text-primary truncate">{client.name}</p>
              <p className="text-[11px] text-text-muted truncate">{client.company}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive ? "bg-purple-soft text-purple" : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-purple" : ""}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border-subtle">
        <button onClick={onToggle} className="w-full flex items-center justify-center py-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-card-hover transition-colors cursor-pointer">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
