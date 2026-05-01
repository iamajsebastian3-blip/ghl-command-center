"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Fragment, useTransition } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Flame,
  BookOpen,
  Play,
  Pause,
  Square,
  History,
  Trash2,
  Calendar,
  Plus,
  LogIn,
  LogOut,
  Printer,
} from "lucide-react";
import type { Client, DailyLog } from "@/lib/types";
import { useDailyLog } from "@/lib/hooks/use-daily-log";
import { useTimeSessions } from "@/lib/hooks/use-time-sessions";
import { upsertDailyLogAction } from "@/app/actions/daily-log";
import { createTimeSessionAction, deleteTimeSessionAction } from "@/app/actions/time-sessions";

interface Props { client: Client; clientMode?: boolean }

type TimerState = "idle" | "running" | "paused" | "stopped";

function formatTime(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatMinutes(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY_LOG = (clientId: string): DailyLog => ({
  id: clientId,
  date: todayKey(),
  timeIn: "",
  timeOut: "",
  tasksCompleted: [],
  pendingTasks: [],
  priorities: [],
  blockers: [],
  nextDayPlan: [],
});

export default function DailyOps({ client, clientMode = false }: Props) {
  const { log: serverLog } = useDailyLog(client.id);
  const { sessions } = useTimeSessions(client.id);

  const log: DailyLog = serverLog ?? EMPTY_LOG(client.id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [newItem, setNewItem] = useState({ field: "", value: "" });

  // Timer state — local only
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeInStamp, setTimeInStamp] = useState<string>("");
  const [startEpoch, setStartEpoch] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showAllHistory, setShowAllHistory] = useState(false);

  // Manual entry form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDate, setManualDate] = useState(todayKey());
  const [manualLogin, setManualLogin] = useState("");
  const [manualLogout, setManualLogout] = useState("");
  const [manualError, setManualError] = useState("");

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = () => {
    if (clientMode) return;
    if (timerState === "idle" || timerState === "stopped") {
      setElapsedSeconds(0);
      const now = new Date();
      setTimeInStamp(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
      setStartEpoch(now.getTime());
    }
    setTimerState("running");
    stopInterval();
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    if (clientMode) return;
    setTimerState("paused");
    stopInterval();
  };

  const endTimer = () => {
    if (clientMode) return;
    stopInterval();
    const endStamp = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const seconds = elapsedSeconds;
    setTimerState("stopped");

    setActionError(null);
    startTransition(async () => {
      const result = await createTimeSessionAction({
        client_id: client.id,
        session_date: todayKey(),
        start_label: timeInStamp,
        end_label: endStamp,
        start_epoch: startEpoch,
        end_epoch: Date.now(),
        seconds,
      });
      if (!result.ok) { setActionError(result.error); return; }
      // Mirror to daily_log time_in/time_out
      upsertDailyLogAction({
        client_id: client.id,
        time_in: timeInStamp,
        time_out: endStamp,
      });
    });
  };

  const deleteSession = (id: string) => {
    if (clientMode) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteTimeSessionAction(id);
      if (!result.ok) setActionError(result.error);
    });
  };

  const addManualEntry = () => {
    if (clientMode) return;
    setManualError("");
    if (!manualDate || !manualLogin || !manualLogout) {
      setManualError("Fill in date, login, and logout times.");
      return;
    }
    const startDt = new Date(`${manualDate}T${manualLogin}`);
    const endDt = new Date(`${manualDate}T${manualLogout}`);
    if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime())) {
      setManualError("Couldn't read those times — try again.");
      return;
    }
    const seconds = Math.floor((endDt.getTime() - startDt.getTime()) / 1000);
    if (seconds <= 0) {
      setManualError("Logout must be after login.");
      return;
    }
    const startLabel = startDt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const endLabel = endDt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    startTransition(async () => {
      const result = await createTimeSessionAction({
        client_id: client.id,
        session_date: manualDate,
        start_label: startLabel,
        end_label: endLabel,
        start_epoch: startDt.getTime(),
        end_epoch: endDt.getTime(),
        seconds,
      });
      if (!result.ok) {
        setManualError(result.error);
        return;
      }
      setManualLogin("");
      setManualLogout("");
      setShowManualForm(false);
    });
  };

  useEffect(() => {
    return () => stopInterval();
  }, [stopInterval]);

  // Grouping: sessions by date (descending), with daily totals.
  const grouped = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.startEpoch - a.startEpoch);
    const map = new Map<string, { sessions: typeof sessions; total: number }>();
    for (const s of sorted) {
      const existing = map.get(s.date) ?? { sessions: [] as typeof sessions, total: 0 };
      existing.sessions.push(s);
      existing.total += s.seconds;
      map.set(s.date, existing);
    }
    return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
  }, [sessions]);

  const todayTotal = (grouped.find((g) => g.date === todayKey())?.total ?? 0)
    + (timerState === "running" || timerState === "paused" ? elapsedSeconds : 0);

  const weekTotal = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return sessions.filter((s) => s.startEpoch >= cutoff).reduce((sum, s) => sum + s.seconds, 0)
      + (timerState === "running" || timerState === "paused" ? elapsedSeconds : 0);
  }, [sessions, elapsedSeconds, timerState]);

  const visibleGroups = showAllHistory ? grouped : grouped.slice(0, 5);

  type LogField = "tasksCompleted" | "pendingTasks" | "priorities" | "blockers" | "nextDayPlan";
  const fieldToCol: Record<LogField, "tasks_completed" | "pending_tasks" | "priorities" | "blockers" | "next_day_plan"> = {
    tasksCompleted: "tasks_completed",
    pendingTasks: "pending_tasks",
    priorities: "priorities",
    blockers: "blockers",
    nextDayPlan: "next_day_plan",
  };

  const persistLogList = (field: LogField, next: string[]) => {
    setActionError(null);
    startTransition(async () => {
      const result = await upsertDailyLogAction({
        client_id: client.id,
        [fieldToCol[field]]: next,
      });
      if (!result.ok) setActionError(result.error);
    });
  };

  const addItem = (field: LogField) => {
    if (clientMode) return;
    if (!newItem.value.trim() || newItem.field !== field) return;
    const next = [...log[field], newItem.value.trim()];
    persistLogList(field, next);
    setNewItem({ field: "", value: "" });
  };

  const removeItem = (field: LogField, index: number) => {
    if (clientMode) return;
    const next = log[field].filter((_, i) => i !== index);
    persistLogList(field, next);
  };

  const sections: {
    key: LogField;
    label: string;
    icon: React.ElementType;
    color: string;
    dotColor: string;
    emptyText: string;
  }[] = [
    { key: "tasksCompleted", label: "Tasks Completed Today", icon: CheckCircle2, color: "text-green", dotColor: "bg-green", emptyText: "No tasks completed yet" },
    { key: "pendingTasks", label: "Pending Tasks", icon: Clock, color: "text-yellow", dotColor: "bg-yellow", emptyText: "All caught up!" },
    { key: "priorities", label: "Today's Priorities", icon: Flame, color: "text-purple", dotColor: "bg-purple", emptyText: "No priorities set" },
    { key: "blockers", label: "Blockers & Notes", icon: AlertCircle, color: "text-yellow", dotColor: "bg-yellow", emptyText: "No blockers" },
    { key: "nextDayPlan", label: "Next Day Plan", icon: BookOpen, color: "text-purple-light", dotColor: "bg-purple-light", emptyText: "Plan not set yet" },
  ];

  // Total seconds across all logged history (for the printable timesheet footer)
  const totalAllSeconds = sessions.reduce((sum, s) => sum + s.seconds, 0);
  const generatedAt = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  const periodStart = grouped.length > 0 ? grouped[grouped.length - 1].date : null;
  const periodEnd = grouped.length > 0 ? grouped[0].date : null;
  const periodLabel = periodStart && periodEnd
    ? (periodStart === periodEnd
        ? new Date(periodStart + "T00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : `${new Date(periodStart + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(periodEnd + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`)
    : "—";

  return (
    <>
      {/* Hidden printable timesheet */}
      <div className="print-timesheet">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "16px", borderBottom: "2px solid #6366F1" }}>
          <div>
            <h1>Timesheet</h1>
            <h2>{client.company} · {client.name}</h2>
            <p style={{ fontSize: "11px", color: "#94A3B8", margin: "4px 0 0 0" }}>Period: {periodLabel}</p>
          </div>
          <div style={{ textAlign: "right", fontSize: "10px", color: "#475569" }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Service Provider</p>
            <p style={{ margin: "2px 0 0 0" }}>System-BuiltBy AJ</p>
            <p style={{ margin: "8px 0 0 0", fontSize: "9px", color: "#94A3B8" }}>Generated {generatedAt}</p>
          </div>
        </header>

        {sessions.length === 0 ? (
          <p style={{ marginTop: "30px", color: "#94A3B8", fontSize: "12px" }}>No sessions logged.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Login</th>
                <th>Logout</th>
                <th style={{ textAlign: "right" }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {grouped.slice().reverse().map((g) => {
                const dateLabel = new Date(g.date + "T00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                return (
                  <Fragment key={g.date}>
                    <tr className="day-row">
                      <td colSpan={3}>{dateLabel}</td>
                      <td style={{ textAlign: "right" }}>{formatMinutes(g.total)}</td>
                    </tr>
                    {g.sessions.slice().reverse().map((s) => (
                      <tr key={s.id}>
                        <td style={{ paddingLeft: "20px", color: "#94A3B8" }}>session</td>
                        <td>{s.start}</td>
                        <td>{s.end}</td>
                        <td style={{ textAlign: "right" }}>{formatMinutes(s.seconds)}</td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="totals">
          <span>{sessions.length} {sessions.length === 1 ? "session" : "sessions"} across {grouped.length} {grouped.length === 1 ? "day" : "days"}</span>
          <span>Total: <strong>{formatMinutes(totalAllSeconds)}</strong></span>
        </div>

        <div className="signature">
          <div className="sig-block">
            <span style={{ fontWeight: 600 }}>Service provider</span><br />
            System-BuiltBy AJ — Date: ________________
          </div>
          <div className="sig-block">
            <span style={{ fontWeight: 600 }}>Client approval</span><br />
            {client.name} — Date: ________________
          </div>
        </div>

        <div className="footer">Generated by GHL Command Center · {generatedAt}</div>
      </div>

    <div className="space-y-6">
      <div className="animate-in opacity-0">
        <h1 className="text-2xl font-bold text-text-primary">Daily Operations</h1>
        <p className="text-sm text-text-secondary mt-1">{client.name} &middot; Daily log</p>
      </div>

      {actionError && (
        <div className="card p-3 border border-red-500/30 bg-red-500/5">
          <p className="text-xs text-red-500">{actionError}</p>
        </div>
      )}

      {/* Timer Section */}
      <div className="card p-5 animate-in opacity-0 animate-delay-1">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple" /> Time Tracker
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-text-muted">Today</span>
            <span className="font-semibold text-text-primary">{formatMinutes(todayTotal)}</span>
            <span className="text-border-subtle">|</span>
            <span className="text-text-muted">7 days</span>
            <span className="font-semibold text-purple">{formatMinutes(weekTotal)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <p className={`text-4xl font-mono font-bold tracking-wider ${timerState === "running" ? "text-green" : timerState === "paused" ? "text-yellow" : "text-text-primary"}`}>
              {formatTime(elapsedSeconds)}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {clientMode && timerState === "idle" && "Read-only view"}
              {!clientMode && timerState === "idle" && "Ready to start"}
              {timerState === "running" && "Running..."}
              {timerState === "paused" && "Paused"}
              {timerState === "stopped" && `Saved: ${formatMinutes(elapsedSeconds)}`}
            </p>
          </div>

          {!clientMode && (
          <div className="flex items-center gap-2">
            {(timerState === "idle" || timerState === "stopped") && (
              <button onClick={startTimer} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-soft text-green font-medium text-sm hover:bg-green/20 transition-colors cursor-pointer">
                <Play className="w-4 h-4" /> Start
              </button>
            )}
            {timerState === "running" && (
              <>
                <button onClick={pauseTimer} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-soft text-yellow font-medium text-sm hover:bg-yellow/20 transition-colors cursor-pointer">
                  <Pause className="w-4 h-4" /> Pause
                </button>
                <button onClick={endTimer} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-soft text-purple font-medium text-sm hover:bg-purple/20 transition-colors cursor-pointer">
                  <Square className="w-4 h-4" /> End
                </button>
              </>
            )}
            {timerState === "paused" && (
              <>
                <button onClick={startTimer} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-soft text-green font-medium text-sm hover:bg-green/20 transition-colors cursor-pointer">
                  <Play className="w-4 h-4" /> Resume
                </button>
                <button onClick={endTimer} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-soft text-purple font-medium text-sm hover:bg-purple/20 transition-colors cursor-pointer">
                  <Square className="w-4 h-4" /> End
                </button>
              </>
            )}
          </div>
          )}

          <div className="flex gap-6 ml-auto">
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Time In</p>
              <p className="text-sm font-semibold text-text-primary">{timeInStamp || log.timeIn || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Time Out</p>
              <p className="text-sm font-semibold text-text-primary">{log.timeOut || "—"}</p>
            </div>
          </div>
        </div>

        {!clientMode && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          {!showManualForm ? (
            <button onClick={() => { setShowManualForm(true); setManualError(""); }} className="text-xs text-purple hover:text-purple-light flex items-center gap-1.5 cursor-pointer font-medium">
              <Plus className="w-3.5 h-3.5" /> Add manual entry (login / logout)
            </button>
          ) : (
            <div>
              <p className="text-xs text-text-muted mb-2">Log a session manually — useful for backlog days you forgot to time-track.</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <input type="date" value={manualDate} max={todayKey()} onChange={(e) => setManualDate(e.target.value)}
                    className="bg-bg-surface border border-border-subtle rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-purple/40" />
                </div>
                <div className="flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5 text-green" />
                  <input type="time" value={manualLogin} onChange={(e) => setManualLogin(e.target.value)}
                    className="bg-bg-surface border border-border-subtle rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-purple/40" />
                </div>
                <span className="text-text-muted text-xs">→</span>
                <div className="flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5 text-purple" />
                  <input type="time" value={manualLogout} onChange={(e) => setManualLogout(e.target.value)}
                    className="bg-bg-surface border border-border-subtle rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-purple/40" />
                </div>
                <button onClick={addManualEntry} className="px-3 py-2 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple-light transition-colors cursor-pointer">Save entry</button>
                <button onClick={() => { setShowManualForm(false); setManualError(""); }} className="p-2 rounded-lg text-text-muted hover:text-text-secondary cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              {manualError && <p className="text-xs text-yellow mt-2">{manualError}</p>}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Session History */}
      <div className="card p-5 animate-in opacity-0 animate-delay-2">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <History className="w-4 h-4 text-purple" /> Session History
            <span className="text-xs text-text-muted font-normal">({sessions.length} {sessions.length === 1 ? "session" : "sessions"} logged)</span>
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} disabled={sessions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple-light transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Open the print dialog with a clean timesheet — pick 'Save as PDF'">
              <Printer className="w-3.5 h-3.5" /> Export PDF
            </button>
            {grouped.length > 5 && (
              <button onClick={() => setShowAllHistory((v) => !v)} className="text-xs text-purple hover:text-purple-light cursor-pointer font-medium">
                {showAllHistory ? "Show recent" : `Show all ${grouped.length} days`}
              </button>
            )}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No sessions logged yet</p>
            {!clientMode && <p className="text-xs text-text-muted mt-1">Hit Start above to log your first session.</p>}
          </div>
        ) : (
          <div className="space-y-5">
            {visibleGroups.map((group) => {
              const dateLabel = new Date(group.date + "T00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
              const isToday = group.date === todayKey();
              return (
                <div key={group.date}>
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <p className="text-xs font-semibold text-text-primary flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      {dateLabel}
                      {isToday && <span className="badge bg-green-soft text-green">Today</span>}
                    </p>
                    <span className="text-xs font-semibold text-purple">{formatMinutes(group.total)}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {group.sessions.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-bg-surface transition-colors group">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple shrink-0" />
                        <span className="text-sm text-text-secondary flex-1">{s.start} → {s.end}</span>
                        <span className="text-sm font-medium text-text-primary">{formatMinutes(s.seconds)}</span>
                        {!clientMode && (
                          <button onClick={() => deleteSession(s.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-yellow transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((section, sIdx) => (
          <div key={section.key} className={`card p-5 animate-in opacity-0 animate-delay-${Math.min(sIdx + 3, 6)} ${section.key === "nextDayPlan" ? "lg:col-span-2" : ""}`}>
            <div className="flex items-center gap-2 mb-4">
              <section.icon className={`w-4 h-4 ${section.color}`} />
              <h2 className="text-sm font-semibold text-text-primary">{section.label}</h2>
              <span className="ml-auto badge bg-bg-surface text-text-muted">{log[section.key].length}</span>
            </div>

            <div className="space-y-1 mb-3">
              {log[section.key].length === 0 ? (
                <p className="text-xs text-text-muted italic py-2">{section.emptyText}</p>
              ) : (
                log[section.key].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-bg-surface group hover:bg-bg-elevated transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${section.dotColor}`} />
                    <span className="text-sm text-text-primary flex-1">{item}</span>
                    {!clientMode && (
                      <button onClick={() => removeItem(section.key, idx)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-yellow transition-all cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {!clientMode && (
            <div className="flex gap-2">
              <input type="text" value={newItem.field === section.key ? newItem.value : ""}
                onFocus={() => setNewItem((prev) => ({ ...prev, field: section.key }))}
                onChange={(e) => setNewItem({ field: section.key, value: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addItem(section.key)}
                placeholder={`+ Add ${section.label.toLowerCase()}...`}
                className="flex-1 bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
              {newItem.field === section.key && newItem.value.trim() && (
                <button onClick={() => addItem(section.key)} className="px-3 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">Add</button>
              )}
            </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
