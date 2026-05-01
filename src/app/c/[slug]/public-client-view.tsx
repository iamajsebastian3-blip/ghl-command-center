"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import CEODashboard from "@/components/dashboard/ceo-dashboard";
import DailyOps from "@/components/dashboard/daily-ops";
import TaskManager from "@/components/dashboard/task-manager";
import Files from "@/components/dashboard/files";
import type { Client, ViewType } from "@/lib/types";

export default function PublicClientView({ client, slug }: { client: Client; slug: string }) {
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-bg-surface">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        client={client}
        badge="Live · comments enabled"
      />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        <div className="p-6 lg:p-8 max-w-[1400px]">
          {activeView === "dashboard" && <CEODashboard client={client} clientMode />}
          {activeView === "daily-ops" && <DailyOps client={client} clientMode />}
          {activeView === "tasks" && <TaskManager client={client} clientMode slug={slug} />}
          {activeView === "files" && <Files client={client} clientMode />}
        </div>
      </main>
    </div>
  );
}
