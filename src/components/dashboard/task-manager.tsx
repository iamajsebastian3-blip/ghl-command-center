"use client";

import { useState } from "react";
import { ListChecks, LayoutGrid, Plus, X, Search, CircleDashed, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import type { Task, TaskStatus, TaskPriority, Client } from "@/lib/types";
import { defaultTasks, tasksByClient } from "@/lib/mock-data";
import { usePersistedState } from "@/lib/use-persisted-state";

interface Props { client: Client }

const TASKS_KEY = (clientId: string) => `tasks:${clientId}`;

type ViewMode = "list" | "board";

const priorityColors: Record<TaskPriority, string> = {
  Urgent: "bg-yellow-soft text-yellow",
  High: "bg-purple-soft text-purple",
  Medium: "bg-bg-elevated text-text-secondary",
  Low: "bg-bg-elevated text-text-muted",
};

const statusColumns: TaskStatus[] = ["To Do", "In Progress", "Done"];

const statusStyle: Record<TaskStatus, { pill: string; dot: string; icon: React.ElementType }> = {
  "To Do":       { pill: "bg-yellow-soft text-yellow",   dot: "bg-yellow",   icon: CircleDashed },
  "In Progress": { pill: "bg-purple-soft text-purple",   dot: "bg-purple",   icon: Loader2 },
  "Done":        { pill: "bg-green-soft text-green",     dot: "bg-green",    icon: CheckCircle2 },
};

function TaskCard({ task, onStatusChange, onRemove }: { task: Task; onStatusChange: (id: string, s: TaskStatus) => void; onRemove: (id: string) => void }) {
  return (
    <div className="card p-4 group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary">{task.name}</p>
        <button onClick={() => onRemove(task.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-yellow transition-all cursor-pointer shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="mt-3">
        <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
      </div>
      <div className="flex gap-1 mt-3 pt-3 border-t border-border-subtle">
        {statusColumns.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(task.id, status)}
            className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-colors cursor-pointer ${
              task.status === status
                ? statusStyle[status].pill
                : "text-text-muted hover:bg-bg-elevated"
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TaskManager({ client }: Props) {
  const seed = tasksByClient[client.id] ?? defaultTasks;
  const [tasks, setTasks] = usePersistedState<Task[]>(TASKS_KEY(client.id), seed);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "All">("All");
  const [search, setSearch] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Medium");

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addTask = () => {
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      id: `t${Date.now()}`,
      name: newTaskName.trim(),
      status: "To Do",
      priority: newTaskPriority,
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskName("");
    setShowAddForm(false);
  };

  const counts = {
    All: tasks.length,
    "To Do": tasks.filter((t) => t.status === "To Do").length,
    "In Progress": tasks.filter((t) => t.status === "In Progress").length,
    "Done": tasks.filter((t) => t.status === "Done").length,
  };

  const filtered = tasks.filter((t) => {
    const sOK = filterStatus === "All" || t.status === filterStatus;
    const qOK = !search.trim() || t.name.toLowerCase().includes(search.toLowerCase());
    return sOK && qOK;
  });

  const statusCards: { key: TaskStatus | "All"; label: string; count: number; tone: string }[] = [
    { key: "To Do",       label: "To Do",       count: counts["To Do"],       tone: "text-yellow" },
    { key: "In Progress", label: "In Progress", count: counts["In Progress"], tone: "text-purple" },
    { key: "Done",        label: "Done",        count: counts["Done"],        tone: "text-green" },
    { key: "All",         label: "All Tasks",   count: counts.All,            tone: "text-text-secondary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4 animate-in opacity-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-sm text-text-secondary mt-1">{client.name} · Launch tasks &amp; deliverables</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm("Reset tasks to the original launch list? This will wipe your edits for this client.")) {
                setTasks(seed);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-elevated text-xs cursor-pointer"
            title="Reset to default launch tasks"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* Status count cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-in opacity-0 animate-delay-1">
        {statusCards.map((s) => {
          const active = filterStatus === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key === filterStatus ? "All" : s.key)}
              className={`card p-4 text-left cursor-pointer transition-all ${active ? "ring-2 ring-purple/30" : ""}`}
            >
              <div className="flex items-center gap-2">
                {s.key !== "All" && <span className={`w-2 h-2 rounded-full ${statusStyle[s.key as TaskStatus].dot}`} />}
                <span className={`text-xs font-medium ${s.tone}`}>{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-text-primary mt-2">{s.count}</p>
              <p className="text-[11px] text-text-muted mt-1">{s.count === 1 ? "task" : "tasks"}</p>
            </button>
          );
        })}
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="card p-4 border-l-4 border-l-purple animate-in opacity-0">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Task name..."
              className="flex-1 min-w-[200px] bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40"
              autoFocus
            />
            <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)} className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer focus:outline-none">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
            <button onClick={addTask} className="px-4 py-2.5 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">Add</button>
            <button onClick={() => setShowAddForm(false)} className="p-2.5 rounded-lg text-text-muted hover:text-text-secondary transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Search + view toggle */}
      <div className="flex items-center gap-3 flex-wrap animate-in opacity-0 animate-delay-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-bg-card border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40"
          />
        </div>
        <div className="flex gap-1 bg-bg-card border border-border-subtle rounded-lg p-1">
          {(["list", "board"] as ViewMode[]).map((mode) => {
            const icons = { list: ListChecks, board: LayoutGrid };
            const Icon = icons[mode];
            return (
              <button key={mode} onClick={() => setViewMode(mode)} className={`p-2 rounded-md transition-colors cursor-pointer ${viewMode === mode ? "bg-purple-soft text-purple" : "text-text-muted hover:bg-bg-elevated"}`}>
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div className="card overflow-hidden animate-in opacity-0 animate-delay-3">
          <div className="hidden md:flex items-center gap-4 px-5 py-3 bg-bg-surface border-b border-border-subtle text-xs font-medium text-text-muted uppercase tracking-wider">
            <span className="flex-1">Task</span>
            <span className="w-24">Priority</span>
            <span className="w-32">Status</span>
            <span className="w-6"></span>
          </div>
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-text-muted">No tasks match your filters</p>
            </div>
          ) : (
            filtered.map((task) => (
              <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-card-hover transition-colors group border-b border-border-subtle last:border-b-0 flex-wrap md:flex-nowrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{task.name}</p>
                </div>
                <div className="w-24"><span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span></div>
                <div className="w-32">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className={`badge cursor-pointer border-0 outline-none focus:outline-none w-full ${statusStyle[task.status].pill}`}
                  >
                    {statusColumns.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button onClick={() => removeTask(task.id)} className="w-6 text-text-muted opacity-0 group-hover:opacity-100 hover:text-yellow transition-all cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Board View */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in opacity-0 animate-delay-3">
          {statusColumns.map((status) => {
            const cfg = statusStyle[status];
            const cols = filtered.filter((t) => t.status === status);
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <h3 className="text-sm font-semibold text-text-primary">{status}</h3>
                  <span className="text-xs text-text-muted ml-auto">{cols.length}</span>
                </div>
                <div className="space-y-3">
                  {cols.map((task) => <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onRemove={removeTask} />)}
                  {cols.length === 0 && <div className="card p-8 text-center"><p className="text-xs text-text-muted">No tasks</p></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
