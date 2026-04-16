"use client";

import { useState } from "react";
import ClientSelector from "@/components/client-selector";
import Sidebar from "@/components/sidebar";
import CEODashboard from "@/components/dashboard/ceo-dashboard";
import DailyOps from "@/components/dashboard/daily-ops";
import TaskManager from "@/components/dashboard/task-manager";
import CRMDashboard from "@/components/dashboard/crm-dashboard";
import InvoiceTracker from "@/components/dashboard/invoice-tracker";
import Documents from "@/components/dashboard/documents";
import Files from "@/components/dashboard/files";
import type { ViewType, Client } from "@/lib/types";

const viewComponents: Record<ViewType, React.ComponentType<{ client: Client }>> = {
  dashboard: CEODashboard,
  "daily-ops": DailyOps,
  tasks: TaskManager,
  crm: CRMDashboard,
  invoices: InvoiceTracker,
  documents: Documents,
  files: Files,
};

export default function Home() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!selectedClient) {
    return <ClientSelector onSelectClient={setSelectedClient} />;
  }

  const ActiveComponent = viewComponents[activeView];

  return (
    <div className="min-h-screen bg-bg-surface">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        client={selectedClient}
        onBack={() => { setSelectedClient(null); setActiveView("dashboard"); }}
      />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        <div className="p-6 lg:p-8 max-w-[1400px]">
          <ActiveComponent client={selectedClient} />
        </div>
      </main>
    </div>
  );
}
