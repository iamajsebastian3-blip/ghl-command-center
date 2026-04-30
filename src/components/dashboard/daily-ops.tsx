"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Flame,
  BookOpen,
  Play,
  Pause,
  Square,
} from "lucide-react";
import { defaultDailyLog, dailyLogByClient } from "@/lib/mock-data";
import type { Client } from "@/lib/types";

interface Props { client: Client }

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

export default function DailyOps({ client }: Props) {
  const [log, setLog] = useState(dailyLogByClient[client.id] ?? defaultDailyLog);
  const [newItem, setNewItem] = useState({ field: "", value: "" });

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeInStamp, setTimeInStamp] = useState<string>("");
  const [sessions, setSessions] = useState<{ start: string; end: string; seconds: number }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = () => {
    if (timerState === "idle" || timerState === "stopped") {
      setElapsedSeconds(0);
      setSessions([]);
      setTimeInStamp(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
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
    setSessions((prev) => [...prev, { start: timeInStamp, end: endStamp, seconds: elapsedSeconds }]);
    setTimerState("stopped");
    setLog((prev) => ({
      ...prev,
      timeIn: timeInStamp,
      timeOut: endStamp,
    }));
  };

  useEffect(() => {
    return () => stopInterval();
  }, [stopInterval]);

  const totalSessionSeconds = sessions.reduce((sum, s) => sum + s.seconds, 0) + (timerState !== "stopped" ? elapsedSeconds : 0);

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
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple" /> Time Tracker
        </h2>

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
              {timerState === "stopped" && `Total: ${formatMinutes(totalSessionSeconds)}`}
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
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Total</p>
              <p className="text-sm font-semibold text-green">{timerState === "stopped" ? formatMinutes(totalSessionSeconds) : "—"}</p>
            </div>
          </div>
        </div>

        {/* Session History */}
        {sessions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <p className="text-xs text-text-muted mb-2">Sessions</p>
            <div className="space-y-1">
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1">
                  <span className="text-text-secondary">Session {i + 1}: {s.start} - {s.end}</span>
                  <span className="text-text-primary font-medium">{formatMinutes(s.seconds)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((section, sIdx) => (
          <div key={section.key} className={`card p-5 animate-in opacity-0 animate-delay-${sIdx + 2} ${section.key === "nextDayPlan" ? "lg:col-span-2" : ""}`}>
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
