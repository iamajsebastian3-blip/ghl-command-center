"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { defaultDailyLog, dailyLogByClient } from "@/lib/mock-data";
import type { Client } from "@/lib/types";

interface Props { client: Client }

type TimerState = "idle" | "running" | "paused" | "stopped";

interface StoredSession {
  id: string;
  date: string;        // YYYY-MM-DD (local)
  start: string;       // local 12-hour time
  end: string;
  startEpoch: number;
  seconds: number;
  note?: string;
}

const HISTORY_KEY = (clientId: string) => `time-sessions:${clientId}`;

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

function loadHistory(clientId: string): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY(clientId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredSession[];
  } catch {
    return [];
  }
}

function saveHistory(clientId: string, history: StoredSession[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_KEY(clientId), JSON.stringify(history));
}

export default function DailyOps({ client }: Props) {
  const [log, setLog] = useState(dailyLogByClient[client.id] ?? defaultDailyLog);
  const [newItem, setNewItem] = useState({ field: "", value: "" });

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeInStamp, setTimeInStamp] = useState<string>("");
  const [startEpoch, setStartEpoch] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistent history
  const [history, setHistory] = useState<StoredSession[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Manual entry form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDate, setManualDate] = useState(todayKey());
  const [manualLogin, setManualLogin] = useState("");
  const [manualLogout, setManualLogout] = useState("");
  const [manualError, setManualError] = useState("");

  // Hydrate history on client mount + when client changes.
  useEffect(() => {
    setHistory(loadHistory(client.id));
  }, [client.id]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = () => {
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
    setTimerState("paused");
    stopInterval();
  };

  const endTimer = () => {
    stopInterval();
    const endStamp = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const entry: StoredSession = {
      id: `s-${Date.now()}`,
      date: todayKey(),
      start: timeInStamp,
      end: endStamp,
      startEpoch,
      seconds: elapsedSeconds,
    };
    setHistory((prev) => {
      const next = [entry, ...prev];
      saveHistory(client.id, next);
      return next;
    });
    setTimerState("stopped");
    setLog((prev) => ({ ...prev, timeIn: timeInStamp, timeOut: endStamp }));
  };

  const deleteSession = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveHistory(client.id, next);
      return next;
    });
  };

  const addManualEntry = () => {
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
    const entry: StoredSession = {
      id: `s-${Date.now()}`,
      date: manualDate,
      start: startDt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      end: endDt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      startEpoch: startDt.getTime(),
      seconds,
    };
    setHistory((prev) => {
      const next = [entry, ...prev];
      saveHistory(client.id, next);
      return next;
    });
    setManualLogin("");
    setManualLogout("");
    setShowManualForm(false);
  };

  useEffect(() => {
    return () => stopInterval();
  }, [stopInterval]);

  // Grouping: sessions by date (descending), with daily totals.
  const grouped = useMemo(() => {
    const sorted = [...history].sort((a, b) => b.startEpoch - a.startEpoch);
    const map = new Map<string, { sessions: StoredSession[]; total: number }>();
    for (const s of sorted) {
      const existing = map.get(s.date) ?? { sessions: [], total: 0 };
      existing.sessions.push(s);
      existing.total += s.seconds;
      map.set(s.date, existing);
    }
    return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
  }, [history]);

  const todayTotal = (grouped.find((g) => g.date === todayKey())?.total ?? 0) + (timerState === "running" || timerState === "paused" ? elapsedSeconds : 0);

  // Last 7 days total
  const weekTotal = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return history.filter((s) => s.startEpoch >= cutoff).reduce((sum, s) => sum + s.seconds, 0)
      + (timerState === "running" || timerState === "paused" ? elapsedSeconds : 0);
  }, [history, elapsedSeconds, timerState]);

  const visibleGroups = showAllHistory ? grouped : grouped.slice(0, 5);

  const addItem = (field: "tasksCompleted" | "pendingTasks" | "priorities" | "blockers" | "nextDayPlan") => {
    if (!newItem.value.trim() || newItem.field !== field) return;
    setLog((prev) => ({ ...prev, [field]: [...prev[field], newItem.value.trim()] }));
    setNewItem({ field: "", value: "" });
  };

  const removeItem = (field: "tasksCompleted" | "pendingTasks" | "priorities" | "blockers" | "nextDayPlan", index: number) => {
    setLog((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const sections: {
    key: "tasksCompleted" | "pendingTasks" | "priorities" | "blockers" | "nextDayPlan";
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

  return (
    <div className="space-y-6">
      <div className="animate-in opacity-0">
        <h1 className="text-2xl font-bold text-text-primary">Daily Operations</h1>
        <p className="text-sm text-text-secondary mt-1">{client.name} &middot; Daily log</p>
      </div>

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
          {/* Timer Display */}
          <div className="text-center">
            <p className={`text-4xl font-mono font-bold tracking-wider ${timerState === "running" ? "text-green" : timerState === "paused" ? "text-yellow" : "text-text-primary"}`}>
              {formatTime(elapsedSeconds)}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {timerState === "idle" && "Ready to start"}
              {timerState === "running" && "Running..."}
              {timerState === "paused" && "Paused"}
              {timerState === "stopped" && `Saved: ${formatMinutes(elapsedSeconds)}`}
            </p>
          </div>

          {/* Controls */}
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

          {/* Time In / Out Display */}
          <div className="flex gap-6 ml-auto">
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Time In</p>
              <p className="text-sm font-semibold text-text-primary">{timeInStamp || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Time Out</p>
              <p className="text-sm font-semibold text-text-primary">{timerState === "stopped" ? log.timeOut : "—"}</p>
            </div>
          </div>
        </div>

        {/* Manual entry */}
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
                  <input
                    type="date"
                    value={manualDate}
                    max={todayKey()}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="bg-bg-surface border border-border-subtle rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-purple/40"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5 text-green" />
                  <input
                    type="time"
                    value={manualLogin}
                    onChange={(e) => setManualLogin(e.target.value)}
                    className="bg-bg-surface border border-border-subtle rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-purple/40"
                  />
                </div>
                <span className="text-text-muted text-xs">→</span>
                <div className="flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5 text-purple" />
                  <input
                    type="time"
                    value={manualLogout}
                    onChange={(e) => setManualLogout(e.target.value)}
                    className="bg-bg-surface border border-border-subtle rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-purple/40"
                  />
                </div>
                <button
                  onClick={addManualEntry}
                  className="px-3 py-2 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple-light transition-colors cursor-pointer"
                >
                  Save entry
                </button>
                <button
                  onClick={() => { setShowManualForm(false); setManualError(""); }}
                  className="p-2 rounded-lg text-text-muted hover:text-text-secondary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {manualError && <p className="text-xs text-yellow mt-2">{manualError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Session History */}
      <div className="card p-5 animate-in opacity-0 animate-delay-2">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <History className="w-4 h-4 text-purple" /> Session History
            <span className="text-xs text-text-muted font-normal">({history.length} {history.length === 1 ? "session" : "sessions"} logged)</span>
          </h2>
          {grouped.length > 5 && (
            <button onClick={() => setShowAllHistory((v) => !v)} className="text-xs text-purple hover:text-purple-light cursor-pointer font-medium">
              {showAllHistory ? "Show recent" : `Show all ${grouped.length} days`}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No sessions logged yet</p>
            <p className="text-xs text-text-muted mt-1">Hit Start above to log your first session.</p>
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
                        <button onClick={() => deleteSession(s.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-yellow transition-all cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                    <button onClick={() => removeItem(section.key, idx)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-yellow transition-all cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Always-visible input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem.field === section.key ? newItem.value : ""}
                onFocus={() => setNewItem((prev) => ({ ...prev, field: section.key }))}
                onChange={(e) => setNewItem({ field: section.key, value: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addItem(section.key)}
                placeholder={`+ Add ${section.label.toLowerCase()}...`}
                className="flex-1 bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40"
              />
              {newItem.field === section.key && newItem.value.trim() && (
                <button onClick={() => addItem(section.key)} className="px-3 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">Add</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
