"use client";

import { useState } from "react";
import { ListChecks, LayoutGrid, Calendar, GripVertical, Plus, X } from "lucide-react";
import type { Task, TaskStatus, TaskPriority, TaskTag, Client } from "@/lib/types";
import { defaultTasks, tasksByClient } from "@/lib/mock-data";

interface Props { client: Client }

type ViewMode = "list" | "board" | "calendar";

const priorityColors: Record<TaskPriority, string> = {
  Urgent: "bg-yellow-soft text-yellow",
  High: "bg-purple-soft text-purple",
  Medium: "bg-bg-surface text-text-secondary",
  Low: "bg-bg-surface text-text-muted",
};

const statusColumns: TaskStatus[] = ["To Do", "In Progress", "Done"];
const tagColors: Record<TaskTag, string> = {
  Funnel: "bg-purple-soft text-purple",
  Automation: "bg-green-soft text-green",
  Ads: "bg-yellow-soft text-yellow",
  CRM: "bg-purple-soft text-purple-light",
  Design: "bg-purple-soft text-purple",
  Dev: "bg-green-soft text-green",
  Support: "bg-yellow-soft text-yellow",
};

function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (id: string, status: TaskStatus) => void }) {
  return (
    <div className="card p-4 group">
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 mt-0.5 shrink-0 cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{task.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-text-muted">{task.assignedTo}</span>
            <span className="text-xs text-text-muted">&middot;</span>
            <span className="text-xs text-text-muted">{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
            {task.tags.map((tag) => <span key={tag} className={`badge ${tagColors[tag]}`}>{tag}</span>)}
          </div>
        </div>
      </div>
      <div className="flex gap-1 mt-3 pt-3 border-t border-border-subtle">
        {statusColumns.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(task.id, status)}
            className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-colors cursor-pointer ${
              task.status === status
                ? status === "Done" ? "bg-green-soft text-green" : status === "In Progress" ? "bg-purple-soft text-purple" : "bg-bg-surface text-text-muted"
                : "text-text-muted hover:bg-bg-card-hover"
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
  const [tasks, setTasks] = useState<Task[]>(tasksByClient[client.id] ?? defaultTasks);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [filterTag, setFilterTag] = useState<TaskTag | "All">("All");

  // New task form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskTag, setNewTaskTag] = useState<TaskTag>("Funnel");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Medium");

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const addTask = () => {
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      id: `t${Date.now()}`,
      name: newTaskName.trim(),
      assignedTo: "AJ",
      status: "To Do",
      priority: newTaskPriority,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      tags: [newTaskTag],
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskName("");
    setShowAddForm(false);
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredTasks = filterTag === "All" ? tasks : tasks.filter((t) => t.tags.includes(filterTag));
  const availableTags: TaskTag[] = ["Funnel", "Automation"];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4 animate-in opacity-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-sm text-text-secondary mt-1">{client.name} &middot; Funnel & Automation tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
          <div className="flex items-center gap-1 bg-bg-card border border-border-subtle rounded-lg p-1">
            {(["list", "board", "calendar"] as ViewMode[]).map((mode) => {
              const icons = { list: ListChecks, board: LayoutGrid, calendar: Calendar };
              const Icon = icons[mode];
              return (
                <button key={mode} onClick={() => setViewMode(mode)} className={`p-2 rounded-md transition-colors cursor-pointer ${viewMode === mode ? "bg-purple-soft text-purple" : "text-text-muted hover:bg-bg-card-hover"}`}>
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
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
            <select value={newTaskTag} onChange={(e) => setNewTaskTag(e.target.value as TaskTag)} className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer focus:outline-none">
              <option value="Funnel">Funnel</option>
              <option value="Automation">Automation</option>
            </select>
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

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap animate-in opacity-0 animate-delay-1">
        <button onClick={() => setFilterTag("All")} className={`badge cursor-pointer transition-colors ${filterTag === "All" ? "bg-purple-soft text-purple" : "bg-bg-surface text-text-muted hover:bg-bg-elevated"}`}>All</button>
        {availableTags.map((tag) => (
          <button key={tag} onClick={() => setFilterTag(tag)} className={`badge cursor-pointer transition-colors ${filterTag === tag ? tagColors[tag] : "bg-bg-surface text-text-muted hover:bg-bg-elevated"}`}>{tag}</button>
        ))}
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in opacity-0 animate-delay-2">
          {statusColumns.map((status) => {
            const columnTasks = filteredTasks.filter((t) => t.status === status);
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2 h-2 rounded-full ${status === "Done" ? "bg-green" : status === "In Progress" ? "bg-purple" : "bg-text-muted"}`} />
                  <h3 className="text-sm font-semibold text-text-primary">{status}</h3>
                  <span className="text-xs text-text-muted ml-auto">{columnTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {columnTasks.map((task) => <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />)}
                  {columnTasks.length === 0 && <div className="card p-8 text-center"><p className="text-xs text-text-muted">No tasks</p></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="card overflow-hidden animate-in opacity-0 animate-delay-2">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-surface">
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Task</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Priority</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Due</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Tag</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className="border-b border-border-subtle hover:bg-bg-card-hover transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary">{task.name}</td>
                  <td className="px-4 py-3">
                    <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)} className="bg-bg-surface border border-border-subtle rounded px-2 py-1 text-xs text-text-primary cursor-pointer focus:outline-none">
                      {statusColumns.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3"><span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span></td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td className="px-4 py-3"><div className="flex gap-1">{task.tags.map((tag) => <span key={tag} className={`badge ${tagColors[tag]}`}>{tag}</span>)}</div></td>
                  <td className="px-4 py-3"><button onClick={() => removeTask(task.id)} className="text-text-muted hover:text-yellow cursor-pointer"><X className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="card p-5 animate-in opacity-0 animate-delay-2">
          <div className="space-y-4">
            {Array.from(new Set(filteredTasks.map((t) => t.dueDate))).sort().map((date) => (
              <div key={date}>
                <p className="text-xs text-text-muted font-medium mb-2">{new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
                <div className="space-y-1 pl-4 border-l-2 border-purple/15">
                  {filteredTasks.filter((t) => t.dueDate === date).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === "Done" ? "bg-green" : "bg-purple"}`} />
                      <span className={`text-sm ${task.status === "Done" ? "text-text-muted line-through" : "text-text-primary"}`}>{task.name}</span>
                      <span className={`badge ml-auto ${priorityColors[task.priority]}`}>{task.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
