"use client";

import { useState, useRef } from "react";
import { DollarSign, AlertTriangle, CheckCircle2, Clock, Plus, X, FileText, Download, Calendar } from "lucide-react";
import type { PaymentStatus, Client } from "@/lib/types";

interface Props { client: Client }

type PaySchedule = "Monthly" | "Bi-weekly";

interface SalaryRecord {
  id: string;
  period: string;
  amount: number;
  status: PaymentStatus;
  paySchedule: PaySchedule;
  paidDate: string;
  notes: string;
}

interface GeneratedInvoice {
  invoiceNo: string;
  billTo: string;
  company: string;
  period: string;
  amount: number;
  date: string;
  dueDate: string;
  notes: string;
}

const statusConfig: Record<PaymentStatus, { color: string; icon: React.ElementType; label: string }> = {
  Paid: { color: "bg-green-soft text-green", icon: CheckCircle2, label: "Paid" },
  Pending: { color: "bg-yellow-soft text-yellow", icon: Clock, label: "Pending" },
  Overdue: { color: "bg-yellow-soft text-yellow", icon: AlertTriangle, label: "Overdue" },
};

const initialRecords: SalaryRecord[] = [
  { id: "s1", period: "April 2026 (1st half)", amount: 1250, status: "Paid", paySchedule: "Bi-weekly", paidDate: "2026-04-15", notes: "" },
  { id: "s2", period: "April 2026 (2nd half)", amount: 1250, status: "Pending", paySchedule: "Bi-weekly", paidDate: "", notes: "Due Apr 30" },
  { id: "s3", period: "March 2026", amount: 2500, status: "Paid", paySchedule: "Monthly", paidDate: "2026-03-31", notes: "" },
  { id: "s4", period: "February 2026", amount: 2500, status: "Paid", paySchedule: "Monthly", paidDate: "2026-02-28", notes: "" },
  { id: "s5", period: "January 2026", amount: 2500, status: "Paid", paySchedule: "Monthly", paidDate: "2026-01-31", notes: "" },
];

export default function InvoiceTracker({ client }: Props) {
  const [records, setRecords] = useState<SalaryRecord[]>(initialRecords);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({ period: "", amount: "", paySchedule: "Monthly" as PaySchedule, notes: "" });
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<GeneratedInvoice | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({ billTo: client.name, company: client.company, period: "", amount: "", notes: "" });
  const invoiceRef = useRef<HTMLDivElement>(null);

  const totalPaid = records.filter((r) => r.status === "Paid").reduce((sum, r) => sum + r.amount, 0);
  const totalPending = records.filter((r) => r.status === "Pending").reduce((sum, r) => sum + r.amount, 0);
  const totalOverdue = records.filter((r) => r.status === "Overdue").reduce((sum, r) => sum + r.amount, 0);
  const monthlySalary = client.rate;

  const addRecord = () => {
    if (!newRecord.period.trim()) return;
    const record: SalaryRecord = {
      id: `s${Date.now()}`,
      period: newRecord.period.trim(),
      amount: parseInt(newRecord.amount) || monthlySalary,
      status: "Pending",
      paySchedule: newRecord.paySchedule,
      paidDate: "",
      notes: newRecord.notes.trim(),
    };
    setRecords((prev) => [record, ...prev]);
    setNewRecord({ period: "", amount: "", paySchedule: "Monthly", notes: "" });
    setShowAddForm(false);
  };

  const updateStatus = (id: string, status: PaymentStatus) => {
    setRecords((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      return { ...r, status, paidDate: status === "Paid" ? new Date().toISOString().split("T")[0] : r.paidDate };
    }));
  };

  const generateInvoice = () => {
    const inv: GeneratedInvoice = {
      invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
      billTo: invoiceForm.billTo,
      company: invoiceForm.company,
      period: invoiceForm.period,
      amount: parseInt(invoiceForm.amount) || monthlySalary,
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      notes: invoiceForm.notes,
    };
    setGeneratedInvoice(inv);
  };

  const printInvoice = () => {
    if (!invoiceRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Invoice</title>
      <style>
        body { font-family: Inter, system-ui, sans-serif; padding: 40px; color: #1A1A2E; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: 700; color: #5E17EB; }
        .subtitle { font-size: 12px; color: #9090A7; }
        .invoice-no { text-align: right; }
        .invoice-no h2 { font-size: 28px; color: #1A1A2E; margin: 0; }
        .invoice-no p { font-size: 12px; color: #9090A7; margin: 4px 0; }
        .section { margin: 24px 0; }
        .section-title { font-size: 11px; color: #9090A7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .section p { margin: 4px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th { text-align: left; font-size: 11px; color: #9090A7; text-transform: uppercase; padding: 8px 12px; border-bottom: 2px solid #E4E2EC; }
        td { padding: 12px; font-size: 14px; border-bottom: 1px solid #E4E2EC; }
        .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #5E17EB; border-bottom: none; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E4E2EC; font-size: 12px; color: #9090A7; }
        .amount { text-align: right; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${invoiceRef.current.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4 animate-in opacity-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Salary & Invoices</h1>
          <p className="text-sm text-text-secondary mt-1">{client.name} &middot; {client.rateLabel} ({client.engagement})</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGenerator(!showGenerator)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm font-medium text-text-primary hover:border-purple/20 transition-colors cursor-pointer">
            <FileText className="w-4 h-4 text-purple" /> Generate Invoice
          </button>
          <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> Add Pay Period
          </button>
        </div>
      </div>

      {/* Add Record Form */}
      {showAddForm && (
        <div className="card p-4 border-l-4 border-l-purple animate-in opacity-0">
          <div className="flex items-center gap-3 flex-wrap">
            <input type="text" value={newRecord.period} onChange={(e) => setNewRecord((p) => ({ ...p, period: e.target.value }))} placeholder="Period (e.g. May 2026)" className="flex-1 min-w-[160px] bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" autoFocus />
            <input type="text" value={newRecord.amount} onChange={(e) => setNewRecord((p) => ({ ...p, amount: e.target.value }))} placeholder={`Amount (default $${monthlySalary})`} className="w-40 bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <select value={newRecord.paySchedule} onChange={(e) => setNewRecord((p) => ({ ...p, paySchedule: e.target.value as PaySchedule }))} className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary cursor-pointer focus:outline-none">
              <option value="Monthly">Monthly</option>
              <option value="Bi-weekly">Bi-weekly</option>
            </select>
            <button onClick={addRecord} className="px-4 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">Add</button>
            <button onClick={() => setShowAddForm(false)} className="p-2 text-text-muted hover:text-text-secondary cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Invoice Generator */}
      {showGenerator && (
        <div className="card p-5 border-l-4 border-l-green animate-in opacity-0">
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-green" /> Invoice Generator</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <input type="text" value={invoiceForm.billTo} onChange={(e) => setInvoiceForm((p) => ({ ...p, billTo: e.target.value }))} placeholder="Bill to" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={invoiceForm.company} onChange={(e) => setInvoiceForm((p) => ({ ...p, company: e.target.value }))} placeholder="Company" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={invoiceForm.period} onChange={(e) => setInvoiceForm((p) => ({ ...p, period: e.target.value }))} placeholder="Period (e.g. April 2026)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={invoiceForm.amount} onChange={(e) => setInvoiceForm((p) => ({ ...p, amount: e.target.value }))} placeholder={`Amount (default $${monthlySalary})`} className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={invoiceForm.notes} onChange={(e) => setInvoiceForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <div className="flex gap-2">
              <button onClick={generateInvoice} className="flex-1 px-4 py-2 rounded-lg bg-green text-white text-sm font-medium hover:bg-green/90 transition-colors cursor-pointer">Preview</button>
              <button onClick={() => { setShowGenerator(false); setGeneratedInvoice(null); }} className="p-2 text-text-muted hover:text-text-secondary cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Invoice Preview */}
          {generatedInvoice && (
            <div className="mt-4">
              <div ref={invoiceRef} className="bg-white border border-border-subtle rounded-xl p-8 max-w-2xl mx-auto">
                <div className="header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
                  <div>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "#5E17EB" }}>System-BuiltBy AJ</p>
                    <p style={{ fontSize: "12px", color: "#9090A7" }}>GHL Agency Services</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "24px", fontWeight: 700, color: "#1A1A2E" }}>INVOICE</p>
                    <p style={{ fontSize: "12px", color: "#9090A7" }}>{generatedInvoice.invoiceNo}</p>
                    <p style={{ fontSize: "12px", color: "#9090A7" }}>Date: {new Date(generatedInvoice.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "40px", marginBottom: "24px" }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "#9090A7", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Bill To</p>
                    <p style={{ fontSize: "14px", fontWeight: 600 }}>{generatedInvoice.billTo}</p>
                    <p style={{ fontSize: "13px", color: "#5A5A72" }}>{generatedInvoice.company}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "#9090A7", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Due Date</p>
                    <p style={{ fontSize: "14px", fontWeight: 600 }}>{new Date(generatedInvoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", margin: "24px 0" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E4E2EC" }}>
                      <th style={{ textAlign: "left", fontSize: "11px", color: "#9090A7", padding: "8px 0", textTransform: "uppercase" }}>Description</th>
                      <th style={{ textAlign: "left", fontSize: "11px", color: "#9090A7", padding: "8px 0", textTransform: "uppercase" }}>Period</th>
                      <th style={{ textAlign: "right", fontSize: "11px", color: "#9090A7", padding: "8px 0", textTransform: "uppercase" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #E4E2EC" }}>
                      <td style={{ padding: "12px 0", fontSize: "14px" }}>Monthly Salary</td>
                      <td style={{ padding: "12px 0", fontSize: "14px", color: "#5A5A72" }}>{generatedInvoice.period}</td>
                      <td style={{ padding: "12px 0", fontSize: "14px", textAlign: "right", fontWeight: 600 }}>${generatedInvoice.amount.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ padding: "12px 0", fontSize: "14px", fontWeight: 700 }}>Total</td>
                      <td style={{ padding: "12px 0", fontSize: "18px", textAlign: "right", fontWeight: 700, color: "#5E17EB" }}>${generatedInvoice.amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {generatedInvoice.notes && (
                  <p style={{ fontSize: "12px", color: "#9090A7", marginTop: "16px" }}>Notes: {generatedInvoice.notes}</p>
                )}

                <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #E4E2EC", fontSize: "11px", color: "#9090A7" }}>
                  <p>Thank you for your business. Payment is due within 15 days.</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-4">
                <button onClick={printInvoice} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">
                  <Download className="w-4 h-4" /> Print / Save PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-in opacity-0 animate-delay-1">
        <div className="card p-3 text-center">
          <DollarSign className="w-4 h-4 mx-auto mb-1.5 text-purple" />
          <p className="text-lg font-bold text-text-primary">${monthlySalary.toLocaleString()}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Monthly Rate</p>
        </div>
        <div className="card p-3 text-center">
          <CheckCircle2 className="w-4 h-4 mx-auto mb-1.5 text-green" />
          <p className="text-lg font-bold text-green">${totalPaid.toLocaleString()}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Paid</p>
        </div>
        <div className="card p-3 text-center">
          <Clock className="w-4 h-4 mx-auto mb-1.5 text-yellow" />
          <p className="text-lg font-bold text-yellow">${totalPending.toLocaleString()}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Pending</p>
        </div>
        <div className="card p-3 text-center">
          <AlertTriangle className="w-4 h-4 mx-auto mb-1.5 text-yellow" />
          <p className="text-lg font-bold text-yellow">${totalOverdue.toLocaleString()}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Overdue</p>
        </div>
      </div>

      {/* Salary Records */}
      <div className="card overflow-hidden animate-in opacity-0 animate-delay-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-surface">
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Period</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Amount</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Schedule</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Paid Date</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Notes</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const cfg = statusConfig[record.status];
                return (
                  <tr key={record.id} className="border-b border-border-subtle hover:bg-bg-card-hover transition-colors">
                    <td className="px-4 py-3 text-sm text-text-primary font-medium">{record.period}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-text-primary">${record.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select value={record.status} onChange={(e) => updateStatus(record.id, e.target.value as PaymentStatus)}
                        className={`badge border-0 cursor-pointer focus:outline-none ${cfg.color}`}>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${record.paySchedule === "Monthly" ? "bg-purple-soft text-purple" : "bg-green-soft text-green"}`}>{record.paySchedule}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{record.paidDate ? new Date(record.paidDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{record.notes || "—"}</td>
                    <td className="px-4 py-3"><button onClick={() => setRecords((prev) => prev.filter((r) => r.id !== record.id))} className="text-text-muted hover:text-yellow cursor-pointer"><X className="w-3.5 h-3.5" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
