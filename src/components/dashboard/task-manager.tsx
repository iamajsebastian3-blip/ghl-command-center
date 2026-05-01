"use client";

import { useState, useRef, ChangeEvent } from "react";
import {
  ListChecks,
  LayoutGrid,
  Plus,
  X,
  Search,
  CircleDashed,
  Loader2,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  MessageSquare,
  Link2,
  Image as ImageIcon,
  Send,
  ExternalLink,
} from "lucide-react";
import type { Task, TaskStatus, TaskPriority, Client, TaskComment, CommentAttachment, CommentAuthor } from "@/lib/types";
import { defaultTasks, tasksByClient } from "@/lib/mock-data";
import { usePersistedState } from "@/lib/use-persisted-state";

interface Props { client: Client }

const TASKS_KEY = (clientId: string) => `tasks:${clientId}`;
const COMMENTS_KEY = (clientId: string) => `task-comments:${clientId}`;
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

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

function formatRelativeTime(epoch: number) {
  const diff = Date.now() - epoch;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(epoch).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isImageUrl(url: string) {
  if (url.startsWith("data:image/")) return true;
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
}

function AttachmentDisplay({ attachment }: { attachment: CommentAttachment }) {
  if (attachment.type === "image" || isImageUrl(attachment.url)) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={attachment.url}
          alt={attachment.filename || "attachment"}
          className="max-w-[220px] max-h-[160px] rounded-lg border border-border-subtle hover:border-purple/40 transition-colors object-cover"
        />
      </a>
    );
  }
  let displayUrl = attachment.url;
  try {
    const u = new URL(attachment.url);
    displayUrl = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
  } catch { /* not a real URL — show as-is */ }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated text-xs hover:bg-bg-card-hover border border-border-subtle transition-colors max-w-full"
    >
      <Link2 className="w-3.5 h-3.5 text-purple shrink-0" />
      <span className="truncate text-text-primary font-medium max-w-[260px]">{displayUrl}</span>
      <ExternalLink className="w-3 h-3 text-text-muted shrink-0" />
    </a>
  );
}

function CommentItem({ comment, onRemove }: { comment: TaskComment; onRemove: () => void }) {
  const isYou = comment.author === "you";
  return (
    <div className="card p-3 group">
      <div className="flex items-start gap-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isYou ? "bg-purple-soft text-purple" : "bg-yellow-soft text-yellow"}`}>
          {isYou ? "AJ" : "CL"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-text-primary">{isYou ? "You (AJ)" : "Client (Lish)"}</span>
            <span className="text-[10px] text-text-muted">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          {comment.body && (
            <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">{comment.body}</p>
          )}
          {comment.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {comment.attachments.map((a) => <AttachmentDisplay key={a.id} attachment={a} />)}
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-yellow transition-all cursor-pointer shrink-0"
          title="Delete comment"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

interface CommentsPanelProps {
  taskId: string;
  comments: TaskComment[];
  onAdd: (c: TaskComment) => void;
  onRemove: (id: string) => void;
}

function CommentsPanel({ taskId, comments, onAdd, onRemove }: CommentsPanelProps) {
  const [author, setAuthor] = useState<CommentAuthor>("you");
  const [body, setBody] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [pending, setPending] = useState<CommentAttachment[]>([]);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...comments].sort((a, b) => a.createdAt - b.createdAt);

  const addUrl = () => {
    const v = urlInput.trim();
    if (!v) return;
    setPending((prev) => [...prev, { id: `att-${Date.now()}`, type: "url", url: v }]);
    setUrlInput("");
    setShowUrlInput(false);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files (PNG, JPG, GIF, WebP) are supported.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError(`Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — keep it under 1.5 MB so it fits in browser storage.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPending((prev) => [
        ...prev,
        {
          id: `att-${Date.now()}`,
          type: "image",
          url: dataUrl,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
        },
      ]);
    };
    reader.onerror = () => setUploadError("Couldn't read that file.");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const submit = () => {
    if (!body.trim() && pending.length === 0) return;
    onAdd({
      id: `c-${Date.now()}`,
      taskId,
      author,
      body: body.trim(),
      createdAt: Date.now(),
      attachments: pending,
    });
    setBody("");
    setPending([]);
    setUploadError("");
  };

  return (
    <div className="bg-bg-surface px-5 py-4 border-t border-border-subtle">
      {sorted.length > 0 && (
        <div className="space-y-2 mb-3">
          {sorted.map((c) => (
            <CommentItem key={c.id} comment={c} onRemove={() => onRemove(c.id)} />
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="card p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-text-muted">Posting as</span>
          <button
            onClick={() => setAuthor("you")}
            className={`badge cursor-pointer transition-colors ${author === "you" ? "bg-purple-soft text-purple" : "bg-bg-elevated text-text-muted hover:bg-bg-card-hover"}`}
          >
            You (AJ)
          </button>
          <button
            onClick={() => setAuthor("client")}
            className={`badge cursor-pointer transition-colors ${author === "client" ? "bg-yellow-soft text-yellow" : "bg-bg-elevated text-text-muted hover:bg-bg-card-hover"}`}
          >
            Client (Lish)
          </button>
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            comments.length === 0
              ? "Add the first comment, feedback, or progress note for this task..."
              : "Add a comment..."
          }
          className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40 resize-none"
          rows={2}
        />

        {pending.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {pending.map((a) => (
              <div key={a.id} className="bg-bg-elevated rounded-lg p-1.5 pr-2 flex items-center gap-2 text-xs border border-border-subtle">
                {a.type === "image" ? (
                  <img src={a.url} alt="" className="w-9 h-9 rounded object-cover" />
                ) : (
                  <Link2 className="w-4 h-4 text-purple ml-1" />
                )}
                <span className="max-w-[180px] truncate text-text-secondary">{a.filename || a.url}</span>
                <button
                  onClick={() => setPending((prev) => prev.filter((p) => p.id !== a.id))}
                  className="text-text-muted hover:text-yellow cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showUrlInput && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
              placeholder="Paste a URL — Loom, Drive, Notion, screenshot link, anything..."
              className="flex-1 bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40"
              autoFocus
            />
            <button onClick={addUrl} className="px-3 py-2 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple-light cursor-pointer">Add</button>
            <button onClick={() => { setShowUrlInput(false); setUrlInput(""); }} className="p-2 rounded-lg text-text-muted hover:text-text-secondary cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={() => setShowUrlInput((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-text-secondary hover:text-purple hover:bg-bg-elevated text-xs cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" /> Add URL
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-text-secondary hover:text-purple hover:bg-bg-elevated text-xs cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Attach screenshot
          </button>
          <button
            onClick={submit}
            disabled={!body.trim() && pending.length === 0}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple-light cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" /> Post comment
          </button>
        </div>
        {uploadError && <p className="text-xs text-yellow mt-2">{uploadError}</p>}
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onRemove, commentCount }: { task: Task; onStatusChange: (id: string, s: TaskStatus) => void; onRemove: (id: string) => void; commentCount: number }) {
  return (
    <div className="card p-4 group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary">{task.name}</p>
        <button onClick={() => onRemove(task.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-yellow transition-all cursor-pointer shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
        {commentCount > 0 && (
          <span className="badge bg-bg-elevated text-text-secondary flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {commentCount}
          </span>
        )}
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
  const [comments, setComments] = usePersistedState<TaskComment[]>(COMMENTS_KEY(client.id), []);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Medium");

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setComments((prev) => prev.filter((c) => c.taskId !== id));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addComment = (c: TaskComment) => setComments((prev) => [...prev, c]);
  const removeComment = (id: string) => setComments((prev) => prev.filter((c) => c.id !== id));

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

  const commentCountFor = (taskId: string) => comments.filter((c) => c.taskId === taskId).length;

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
              if (confirm("Reset tasks AND comments to the original launch list? This will wipe your edits and all comments for this client.")) {
                setTasks(seed);
                setComments([]);
                setExpanded(new Set());
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
            <span className="w-4"></span>
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
            filtered.map((task) => {
              const isExpanded = expanded.has(task.id);
              const taskComments = comments.filter((c) => c.taskId === task.id);
              return (
                <div key={task.id} className="border-b border-border-subtle last:border-b-0">
                  <div
                    onClick={() => toggleExpand(task.id)}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-card-hover transition-colors group cursor-pointer flex-wrap md:flex-nowrap"
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{task.name}</p>
                      {taskComments.length > 0 && (
                        <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {taskComments.length} {taskComments.length === 1 ? "comment" : "comments"}
                        </p>
                      )}
                    </div>
                    <div className="w-24" onClick={(e) => e.stopPropagation()}>
                      <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
                    </div>
                    <div className="w-32" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className={`badge cursor-pointer border-0 outline-none focus:outline-none w-full ${statusStyle[task.status].pill}`}
                      >
                        {statusColumns.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                      className="w-6 text-text-muted opacity-0 group-hover:opacity-100 hover:text-yellow transition-all cursor-pointer"
                      title="Delete task"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isExpanded && (
                    <CommentsPanel
                      taskId={task.id}
                      comments={taskComments}
                      onAdd={addComment}
                      onRemove={removeComment}
                    />
                  )}
                </div>
              );
            })
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
                  {cols.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onRemove={removeTask}
                      commentCount={commentCountFor(task.id)}
                    />
                  ))}
                  {cols.length === 0 && <div className="card p-8 text-center"><p className="text-xs text-text-muted">No tasks</p></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "board" && (
        <p className="text-xs text-text-muted text-center -mt-2">Switch to list view to add comments to a task.</p>
      )}
    </div>
  );
}
