"use client";

import { useState, useRef, useCallback } from "react";
import { FileText, Download, Receipt, ScrollText, PenTool, X, Loader2 } from "lucide-react";
import type { Client } from "@/lib/types";

interface Props { client: Client }

type DocTab = "invoice" | "proposal" | "contract";

function generatePDF(element: HTMLElement, filename: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <html><head><title>${filename}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Inter, system-ui, -apple-system, sans-serif; padding: 48px; color: #1A1A2E; line-height: 1.6; }
      .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #5E17EB; }
      .brand { font-size: 22px; font-weight: 700; color: #5E17EB; }
      .brand-sub { font-size: 11px; color: #9090A7; margin-top: 2px; }
      .doc-title { font-size: 28px; font-weight: 700; text-align: right; }
      .doc-meta { font-size: 11px; color: #9090A7; text-align: right; margin-top: 4px; }
      .section { margin: 24px 0; }
      .section-title { font-size: 12px; font-weight: 700; color: #5E17EB; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; border-bottom: 1px solid #E4E2EC; padding-bottom: 6px; }
      .field-row { display: flex; gap: 40px; margin-bottom: 8px; }
      .field-label { font-size: 11px; color: #9090A7; text-transform: uppercase; letter-spacing: 0.5px; }
      .field-value { font-size: 14px; font-weight: 500; margin-top: 2px; }
      .content-block { font-size: 13px; line-height: 1.8; color: #333; white-space: pre-wrap; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th { text-align: left; font-size: 11px; color: #9090A7; text-transform: uppercase; padding: 10px 12px; border-bottom: 2px solid #E4E2EC; letter-spacing: 0.5px; }
      td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #E4E2EC; }
      .total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #5E17EB; border-bottom: none; }
      .amount { text-align: right; }
      .signature-section { margin-top: 48px; display: flex; gap: 60px; }
      .sig-block { flex: 1; }
      .sig-line { border-bottom: 1px solid #1A1A2E; margin-top: 48px; margin-bottom: 6px; }
      .sig-label { font-size: 11px; color: #9090A7; }
      .sig-name { font-size: 13px; font-weight: 600; margin-top: 4px; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E4E2EC; font-size: 11px; color: #9090A7; text-align: center; }
      @media print { body { padding: 32px; } @page { margin: 0.5in; } }
    </style></head><body>
    ${element.innerHTML}
    <script>window.print();</script>
    </body></html>
  `);
  printWindow.document.close();
}

function InvoiceGenerator({ client }: { client: Client }) {
  const [form, setForm] = useState({ billTo: client.name, company: client.company, period: "", amount: String(client.rate), description: "Monthly Salary", notes: "" });
  const [generated, setGenerated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
  const today = new Date();
  const dueDate = new Date(today.getTime() + 15 * 86400000);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input type="text" value={form.billTo} onChange={(e) => setForm((p) => ({ ...p, billTo: e.target.value }))} placeholder="Bill to *" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <input type="text" value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} placeholder="Company" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <input type="text" value={form.period} onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))} placeholder="Period (e.g. April 2026)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <input type="text" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Amount ($)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <input type="text" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => setGenerated(true)} className="px-4 py-2.5 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">Preview Invoice</button>
        {generated && <button onClick={() => ref.current && generatePDF(ref.current, `Invoice-${form.billTo}`)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green text-white text-sm font-medium hover:bg-green/90 transition-colors cursor-pointer"><Download className="w-4 h-4" /> Download PDF</button>}
      </div>

      {generated && (
        <div ref={ref} className="bg-white border border-border-subtle rounded-xl p-8 max-w-2xl mx-auto mt-4">
          <div className="doc-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px", paddingBottom: "24px", borderBottom: "3px solid #5E17EB" }}>
            <div><p style={{ fontSize: "22px", fontWeight: 700, color: "#5E17EB" }}>System-BuiltBy AJ</p><p style={{ fontSize: "11px", color: "#9090A7" }}>GHL Agency Services</p></div>
            <div style={{ textAlign: "right" }}><p style={{ fontSize: "28px", fontWeight: 700 }}>INVOICE</p><p style={{ fontSize: "11px", color: "#9090A7" }}>{invoiceNo}</p><p style={{ fontSize: "11px", color: "#9090A7" }}>Date: {today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
          </div>
          <div style={{ display: "flex", gap: "60px", marginBottom: "24px" }}>
            <div><p style={{ fontSize: "11px", color: "#9090A7", textTransform: "uppercase", letterSpacing: "1px" }}>Bill To</p><p style={{ fontSize: "14px", fontWeight: 600, marginTop: "4px" }}>{form.billTo}</p><p style={{ fontSize: "13px", color: "#5A5A72" }}>{form.company}</p></div>
            <div><p style={{ fontSize: "11px", color: "#9090A7", textTransform: "uppercase", letterSpacing: "1px" }}>Due Date</p><p style={{ fontSize: "14px", fontWeight: 600, marginTop: "4px" }}>{dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", margin: "24px 0" }}>
            <thead><tr style={{ borderBottom: "2px solid #E4E2EC" }}><th style={{ textAlign: "left", fontSize: "11px", color: "#9090A7", padding: "10px 0", textTransform: "uppercase" }}>Description</th><th style={{ textAlign: "left", fontSize: "11px", color: "#9090A7", padding: "10px 0", textTransform: "uppercase" }}>Period</th><th style={{ textAlign: "right", fontSize: "11px", color: "#9090A7", padding: "10px 0", textTransform: "uppercase" }}>Amount</th></tr></thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #E4E2EC" }}><td style={{ padding: "12px 0", fontSize: "13px" }}>{form.description}</td><td style={{ padding: "12px 0", fontSize: "13px", color: "#5A5A72" }}>{form.period}</td><td style={{ padding: "12px 0", fontSize: "14px", textAlign: "right", fontWeight: 600 }}>${parseInt(form.amount || "0").toLocaleString()}</td></tr>
              <tr><td colSpan={2} style={{ padding: "12px 0", fontWeight: 700 }}>Total</td><td style={{ padding: "12px 0", fontSize: "18px", textAlign: "right", fontWeight: 700, color: "#5E17EB", borderTop: "2px solid #5E17EB" }}>${parseInt(form.amount || "0").toLocaleString()}</td></tr>
            </tbody>
          </table>
          {form.notes && <p style={{ fontSize: "12px", color: "#9090A7" }}>Notes: {form.notes}</p>}
          <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #E4E2EC", fontSize: "11px", color: "#9090A7", textAlign: "center" }}>Payment is due within 15 days. Thank you for your business.</div>
        </div>
      )}
    </div>
  );
}

function ProposalGenerator({ client }: { client: Client }) {
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState(false);
  const [content, setContent] = useState("");
  const [form, setForm] = useState({ projectName: "", timeline: "", budget: String(client.rate) });
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();

  const generate = () => {
    const lines = prompt.split("\n").filter(Boolean);
    const scopeItems = lines.length > 0 ? lines : ["GHL CRM setup and configuration", "Sales funnel design and development", "Automation workflow implementation", "Lead nurture email sequences", "Monthly reporting and optimization"];
    const body = `PROJECT OVERVIEW\n\nThis proposal outlines the scope of work for ${form.projectName || client.company + " project"} as discussed. Our goal is to deliver a complete GoHighLevel system that drives leads, automates follow-up, and closes deals on autopilot.\n\nSCOPE OF WORK\n\n${scopeItems.map((item, i) => `${i + 1}. ${item}`).join("\n")}\n\nTIMELINE\n\n${form.timeline || "2-4 weeks from project kickoff"}\n\nINVESTMENT\n\nTotal Project Investment: $${parseInt(form.budget || "0").toLocaleString()}\n\nPayment Terms:\n- 50% deposit to begin ($${Math.round(parseInt(form.budget || "0") / 2).toLocaleString()})\n- 50% upon completion ($${Math.round(parseInt(form.budget || "0") / 2).toLocaleString()})\n\nWHAT'S INCLUDED\n\n- All GHL setup and configuration\n- Funnel design and copywriting\n- Automation workflow building\n- 2 rounds of revisions\n- 30-day post-launch support\n\nWHAT'S NOT INCLUDED\n\n- Ad spend budget\n- Content creation (photos/videos)\n- Third-party software subscriptions\n- Additional revisions beyond scope`;
    setContent(body);
    setGenerated(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input type="text" value={form.projectName} onChange={(e) => setForm((p) => ({ ...p, projectName: e.target.value }))} placeholder="Project name" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <input type="text" value={form.timeline} onChange={(e) => setForm((p) => ({ ...p, timeline: e.target.value }))} placeholder="Timeline (e.g. 2-4 weeks)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <input type="text" value={form.budget} onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))} placeholder="Budget ($)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
      </div>

      <div>
        <label className="text-xs text-text-muted block mb-1.5">Describe the scope of work (one item per line)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={"GHL CRM setup and configuration\nSales funnel design and development\nAutomation workflow implementation\nLead nurture email sequences\nMonthly reporting and optimization"}
          rows={6}
          className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={generate} className="px-4 py-2.5 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">Generate Proposal</button>
        {generated && <button onClick={() => ref.current && generatePDF(ref.current, `Proposal-${client.name}`)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green text-white text-sm font-medium hover:bg-green/90 transition-colors cursor-pointer"><Download className="w-4 h-4" /> Download PDF</button>}
      </div>

      {generated && (
        <div ref={ref} className="bg-white border border-border-subtle rounded-xl p-8 max-w-2xl mx-auto mt-4">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px", paddingBottom: "24px", borderBottom: "3px solid #5E17EB" }}>
            <div><p style={{ fontSize: "22px", fontWeight: 700, color: "#5E17EB" }}>System-BuiltBy AJ</p><p style={{ fontSize: "11px", color: "#9090A7" }}>GHL Agency Services</p></div>
            <div style={{ textAlign: "right" }}><p style={{ fontSize: "28px", fontWeight: 700 }}>PROPOSAL</p><p style={{ fontSize: "11px", color: "#9090A7" }}>Date: {today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "11px", color: "#9090A7", textTransform: "uppercase", letterSpacing: "1px" }}>Prepared For</p>
            <p style={{ fontSize: "16px", fontWeight: 600, marginTop: "4px" }}>{client.name}</p>
            <p style={{ fontSize: "13px", color: "#5A5A72" }}>{client.company}</p>
          </div>

          <div style={{ whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.8", color: "#333" }}>
            {content.split("\n").map((line, i) => {
              if (line === line.toUpperCase() && line.length > 3) return <p key={i} style={{ fontSize: "12px", fontWeight: 700, color: "#5E17EB", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "24px", marginBottom: "8px", borderBottom: "1px solid #E4E2EC", paddingBottom: "6px" }}>{line}</p>;
              return <p key={i} style={{ margin: line ? "4px 0" : "12px 0" }}>{line}</p>;
            })}
          </div>

          {/* Signatures */}
          <div style={{ marginTop: "48px", display: "flex", gap: "60px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "11px", color: "#9090A7", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Accepted By (Client)</p>
              <div style={{ borderBottom: "1px solid #1A1A2E", marginTop: "48px", marginBottom: "6px" }} />
              <p style={{ fontSize: "13px", fontWeight: 600 }}>{client.name}</p>
              <p style={{ fontSize: "11px", color: "#9090A7" }}>Date: _______________</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "11px", color: "#9090A7", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Prepared By</p>
              <div style={{ borderBottom: "1px solid #1A1A2E", marginTop: "48px", marginBottom: "6px" }} />
              <p style={{ fontSize: "13px", fontWeight: 600 }}>Allen Bactad</p>
              <p style={{ fontSize: "11px", color: "#9090A7" }}>System-BuiltBy AJ</p>
            </div>
          </div>

          <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #E4E2EC", fontSize: "11px", color: "#9090A7", textAlign: "center" }}>This proposal is valid for 30 days from the date above.</div>
        </div>
      )}
    </div>
  );
}

function ContractGenerator({ client }: { client: Client }) {
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState(false);
  const [content, setContent] = useState("");
  const [form, setForm] = useState({ projectName: "", startDate: "", endDate: "", amount: String(client.rate), paymentTerms: "Monthly" });
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();

  const generate = () => {
    const tasks = prompt.split("\n").filter(Boolean);
    const taskList = tasks.length > 0 ? tasks : ["GoHighLevel CRM setup and configuration", "Sales funnel design, development, and deployment", "Automation workflow creation and testing", "Ongoing optimization and monthly reporting"];
    const body = `This Service Agreement ("Agreement") is entered into as of ${form.startDate || today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} by and between:

SERVICE PROVIDER
Allen Bactad, operating as System-BuiltBy AJ
("Provider")

CLIENT
${client.name}, representing ${client.company}
("Client")

1. SCOPE OF SERVICES

The Provider agrees to perform the following services for the Client:

${taskList.map((t, i) => `   ${i + 1}.${i + 1} ${t}`).join("\n")}

2. TERM

This Agreement shall commence on ${form.startDate || "the date of signing"} and continue ${form.endDate ? `until ${form.endDate}` : "on a month-to-month basis"}, unless terminated by either party with 30 days written notice.

3. COMPENSATION

Client agrees to pay Provider:
- Amount: $${parseInt(form.amount || "0").toLocaleString()} ${form.paymentTerms === "Monthly" ? "per month" : "per project"}
- Payment Schedule: ${form.paymentTerms}
- Payment Due: Within 15 days of invoice date
- Late Payment: A fee of 1.5% per month will be applied to overdue amounts

4. INTELLECTUAL PROPERTY

All work product created under this Agreement shall be owned by the Client upon full payment. Provider retains the right to showcase the work in their portfolio.

5. CONFIDENTIALITY

Both parties agree to maintain the confidentiality of proprietary information shared during the course of this engagement. This includes but is not limited to: business strategies, customer data, pricing, and trade secrets.

6. TERMINATION

Either party may terminate this Agreement with 30 days written notice. Upon termination:
- Client shall pay for all work completed up to the termination date
- Provider shall deliver all completed work product
- Any prepaid amounts for undelivered work shall be refunded

7. LIABILITY

Provider's total liability under this Agreement shall not exceed the total fees paid by Client in the preceding 3 months. Provider is not liable for indirect, incidental, or consequential damages.

8. DISPUTE RESOLUTION

Any disputes arising from this Agreement shall be resolved through mediation first, and if unresolved, through binding arbitration.

9. ENTIRE AGREEMENT

This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, negotiations, and discussions.`;
    setContent(body);
    setGenerated(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input type="text" value={form.projectName} onChange={(e) => setForm((p) => ({ ...p, projectName: e.target.value }))} placeholder="Project / Service name" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <input type="text" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} placeholder="Start date (e.g. May 1, 2026)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <input type="text" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} placeholder="End date (leave blank for ongoing)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <input type="text" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Amount ($)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        <select value={form.paymentTerms} onChange={(e) => setForm((p) => ({ ...p, paymentTerms: e.target.value }))} className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer focus:outline-none">
          <option value="Monthly">Monthly</option>
          <option value="Bi-weekly">Bi-weekly</option>
          <option value="Per project">Per project</option>
          <option value="50/50 split">50% upfront / 50% completion</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-text-muted block mb-1.5">Describe the tasks / services covered (one per line)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={"GoHighLevel CRM setup and configuration\nSales funnel design, development, and deployment\nAutomation workflow creation and testing\nOngoing optimization and monthly reporting"}
          rows={5}
          className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={generate} className="px-4 py-2.5 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">Generate Contract</button>
        {generated && <button onClick={() => ref.current && generatePDF(ref.current, `Contract-${client.name}`)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green text-white text-sm font-medium hover:bg-green/90 transition-colors cursor-pointer"><Download className="w-4 h-4" /> Download PDF</button>}
      </div>

      {generated && (
        <div ref={ref} className="bg-white border border-border-subtle rounded-xl p-8 max-w-2xl mx-auto mt-4">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px", paddingBottom: "24px", borderBottom: "3px solid #5E17EB" }}>
            <div><p style={{ fontSize: "22px", fontWeight: 700, color: "#5E17EB" }}>System-BuiltBy AJ</p><p style={{ fontSize: "11px", color: "#9090A7" }}>GHL Agency Services</p></div>
            <div style={{ textAlign: "right" }}><p style={{ fontSize: "24px", fontWeight: 700 }}>SERVICE AGREEMENT</p><p style={{ fontSize: "11px", color: "#9090A7" }}>Date: {today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
          </div>

          <div style={{ whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.8", color: "#333" }}>
            {content.split("\n").map((line, i) => {
              if (/^\d+\.\s/.test(line)) return <p key={i} style={{ fontSize: "13px", fontWeight: 700, color: "#5E17EB", marginTop: "20px", marginBottom: "8px" }}>{line}</p>;
              if (line === line.toUpperCase() && line.length > 3 && !line.startsWith(" ")) return <p key={i} style={{ fontSize: "11px", fontWeight: 600, color: "#9090A7", textTransform: "uppercase", letterSpacing: "1px", marginTop: "12px" }}>{line}</p>;
              return <p key={i} style={{ margin: line.trim() ? "3px 0" : "8px 0" }}>{line}</p>;
            })}
          </div>

          {/* Signatures */}
          <div style={{ marginTop: "48px", display: "flex", gap: "60px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "11px", color: "#9090A7", textTransform: "uppercase", letterSpacing: "1px" }}>CLIENT</p>
              <div style={{ borderBottom: "1px solid #1A1A2E", marginTop: "56px", marginBottom: "6px" }} />
              <p style={{ fontSize: "12px", fontWeight: 600 }}>{client.name}</p>
              <p style={{ fontSize: "11px", color: "#9090A7" }}>{client.company}</p>
              <p style={{ fontSize: "11px", color: "#9090A7", marginTop: "8px" }}>Date: _______________</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "11px", color: "#9090A7", textTransform: "uppercase", letterSpacing: "1px" }}>SERVICE PROVIDER</p>
              <div style={{ borderBottom: "1px solid #1A1A2E", marginTop: "56px", marginBottom: "6px" }} />
              <p style={{ fontSize: "12px", fontWeight: 600 }}>Allen Bactad</p>
              <p style={{ fontSize: "11px", color: "#9090A7" }}>System-BuiltBy AJ</p>
              <p style={{ fontSize: "11px", color: "#9090A7", marginTop: "8px" }}>Date: _______________</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Documents({ client }: Props) {
  const [activeTab, setActiveTab] = useState<DocTab>("invoice");

  const tabs: { id: DocTab; label: string; icon: React.ElementType }[] = [
    { id: "invoice", label: "Invoice", icon: Receipt },
    { id: "proposal", label: "Proposal", icon: ScrollText },
    { id: "contract", label: "Contract", icon: PenTool },
  ];

  return (
    <div className="space-y-5">
      <div className="animate-in opacity-0">
        <h1 className="text-2xl font-bold text-text-primary">Documents</h1>
        <p className="text-sm text-text-secondary mt-1">{client.name} &middot; Generate invoices, proposals, and contracts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-card border border-border-subtle rounded-lg p-1 w-fit animate-in opacity-0 animate-delay-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === tab.id ? "bg-purple-soft text-purple" : "text-text-muted hover:bg-bg-card-hover hover:text-text-primary"}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card p-5 animate-in opacity-0 animate-delay-2">
        {activeTab === "invoice" && <InvoiceGenerator client={client} />}
        {activeTab === "proposal" && <ProposalGenerator client={client} />}
        {activeTab === "contract" && <ContractGenerator client={client} />}
      </div>
    </div>
  );
}
