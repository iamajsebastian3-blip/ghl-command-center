"use client";

import { useState, useRef, ChangeEvent, useTransition } from "react";
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
import { useTasks } from "@/lib/hooks/use-tasks";
import { useTaskComments } from "@/lib/hooks/use-task-comments";
import {
  createTaskAction,
  updateTaskStatusAction,
  deleteTaskAction,
  deleteAllTasksAction,
} from "@/app/actions/tasks";
import { addCommentAction, addClientCommentAction, deleteCommentAction } from "@/app/actions/comments";

interface Props { client: Client; readOnly?: boolean; clientMode?: boolean; slug?: string }

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB — uploads go to Supabase Storage

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

function CommentItem({ comment, onRemove, canDelete }: { comment: TaskComment; onRemove: () => void; canDelete?: boolean }) {
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
        {canDelete && (
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-yellow transition-all cursor-pointer shrink-0"
            title="Delete comment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

type CommentsMode = "owner" | "client" | "view";

interface CommentsPanelProps {
  taskId: string;
  comments: TaskComment[];
  onDeleted: (id: string) => void;
  mode: CommentsMode;
  slug?: string;
}

interface PendingUrl { id: string; url: string }
interface PendingImage { id: string; file: File; previewUrl: string }

function CommentsPanel({ taskId, comments, onDeleted, mode, slug }: CommentsPanelProps) {
  const isOwner = mode === "owner";
  const isClient = mode === "client";
  const canCompose = isOwner || isClient;
  const canDelete = isOwner;
  const [author, setAuthor] = useState<CommentAuthor>(isClient ? "client" : "you");
  const [body, setBody] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [pendingUrls, setPendingUrls] = useState<PendingUrl[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...comments].sort((a, b) => a.createdAt - b.createdAt);

  const addUrl = () => {
    const v = urlInput.trim();
    if (!v) return;
    setPendingUrls((prev) => [...prev, { id: `u-${Date.now()}`, url: v }]);
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
      setUploadError(`Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — keep it under 5 MB.`);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPendingImages((prev) => [...prev, { id: `i-${Date.now()}`, file, previewUrl }]);
    e.target.value = "";
  };

  const removePendingUrl = (id: string) => setPendingUrls((prev) => prev.filter((p) => p.id !== id));
  const removePendingImage = (id: string) =>
    setPendingImages((prev) => {
      const out = prev.filter((p) => p.id !== id);
      const removed = prev.find((p) => p.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return out;
    });

  const submit = async () => {
    if (submitting) return;
    if (!body.trim() && pendingUrls.length === 0 && pendingImages.length === 0) return;
    setSubmitting(true);
    setUploadError("");

    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("body", body.trim());
    fd.set("urls", JSON.stringify(pendingUrls.map(({ url }) => ({ url }))));
    pendingImages.forEach(({ file }) => fd.append("files", file));

    let result: { ok: true } | { ok: false; error: string };
    if (isClient) {
      if (!slug) {
        setSubmitting(false);
        setUploadError("Missing client slug — cannot post comment.");
        return;
      }
      fd.set("slug", slug);
      result = await addClientCommentAction(fd);
    } else {
      fd.set("author", author);
      result = await addCommentAction(fd);
    }
    setSubmitting(false);
    if (!result.ok) {
      setUploadError(result.error);
      return;
    }
    pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setBody("");
    setPendingUrls([]);
    setPendingImages([]);
  };

  const onDeleteComment = async (id: string) => {
    const result = await deleteCommentAction(id);
    if (result.ok) onDeleted(id);
  };

  return (
    <div className="bg-bg-surface px-5 py-4 border-t border-border-subtle">
      {sorted.length > 0 ? (
        <div className="space-y-2 mb-3">
          {sorted.map((c) => (
            <CommentItem key={c.id} comment={c} onRemove={() => onDeleteComment(c.id)} canDelete={canDelete} />
          ))}
        </div>
      ) : !canCompose ? (
        <p className="text-xs text-text-muted">No comments yet.</p>
      ) : null}

      {!canCompose ? null : (
      <div className="card p-3" onClick={(e) => e.stopPropagation()}>
        {isOwner && (
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
        )}
        {isClient && (
        <div className="flex items-center gap-2 mb-2">
          <span className="badge bg-yellow-soft text-yellow">Posting as Client (Lish)</span>
        </div>
        )}

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            isClient
              ? (comments.length === 0
                  ? "Leave feedback or notes on this task..."
                  : "Reply with feedback...")
              : (comments.length === 0
                  ? "Add the first comment, feedback, or progress note for this task..."
                  : "Add a comment...")
          }
          className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40 resize-none"
          rows={2}
        />

        {(pendingUrls.length > 0 || pendingImages.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {pendingImages.map((p) => (
              <div key={p.id} className="bg-bg-elevated rounded-lg p-1.5 pr-2 flex items-center gap-2 text-xs border border-border-subtle">
                <img src={p.previewUrl} alt="" className="w-9 h-9 rounded object-cover" />
                <span className="max-w-[180px] truncate text-text-secondary">{p.file.name}</span>
                <button
                  onClick={() => removePendingImage(p.id)}
                  className="text-text-muted hover:text-yellow cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {pendingUrls.map((p) => (
              <div key={p.id} className="bg-bg-elevated rounded-lg p-1.5 pr-2 flex items-center gap-2 text-xs border border-border-subtle">
                <Link2 className="w-4 h-4 text-purple ml-1" />
                <span className="max-w-[180px] truncate text-text-secondary">{p.url}</span>
                <button
                  onClick={() => removePendingUrl(p.id)}
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
            disabled={submitting || (!body.trim() && pendingUrls.length === 0 && pendingImages.length === 0)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple text-white text-xs font-medium hover:bg-purple-light cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Posting…</> : <><Send className="w-3.5 h-3.5" /> Post comment</>}
          </button>
        </div>
        {uploadError && <p className="text-xs text-yellow mt-2">{uploadError}</p>}
      </div>
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange, onRemove, commentCount, readOnly }: { task: Task; onStatusChange: (id: string, s: TaskStatus) => void; onRemove: (id: string) => void; commentCount: number; readOnly?: boolean }) {
  return (
    <div className="card p-4 group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary">{task.name}</p>
        {!readOnly && (
          <button onClick={() => onRemove(task.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-yellow transition-all cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
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
            onClick={() => !readOnly && onStatusChange(task.id, status)}
            disabled={readOnly}
            className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-colors ${readOnly ? "cursor-default" : "cursor-pointer"} ${
              task.status === status
                ? statusStyle[status].pill
                : `text-text-muted ${readOnly ? "" : "hover:bg-bg-elevated"}`
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TaskManager({ client, readOnly: readOnlyProp = false, clientMode = false, slug }: Props) {
  // In clientMode, tasks themselves are still read-only — only commenting is allowed.
  const readOnly = readOnlyProp || clientMode;
  const commentsMode: CommentsMode = clientMode ? "client" : (readOnlyProp ? "view" : "owner");
  const { tasks, loading, error: loadError } = useTasks(client.id);
  const { comments } = useTaskComments(client.id);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Medium");
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleStatusChange = (id: string, status: TaskStatus) => {
    if (readOnly) return;
    setActionError(null);
    startTransition(async () => {
      const result = await updateTaskStatusAction(id, status);
      if (!result.ok) setActionError(result.error);
    });
  };

  const removeTask = (id: string) => {
    if (readOnly) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteTaskAction(id);
      if (!result.ok) setActionError(result.error);
    });
    // Comments cascade-delete in DB via foreign key.
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const addTask = () => {
    if (readOnly) return;
    const name = newTaskName.trim();
    if (!name) return;
    setActionError(null);
    startTransition(async () => {
      const result = await createTaskAction({
        clientId: client.id,
        name,
        priority: newTaskPriority,
      });
      if (!result.ok) setActionError(result.error);
    });
    setNewTaskName("");
    setShowAddForm(false);
  };

  const resetAll = () => {
    if (readOnly) return;
    if (!confirm("Delete all tasks AND comments for this client? This cannot be undone.")) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteAllTasksAction(client.id);
      if (!result.ok) setActionError(result.error);
    });
    setExpanded(new Set());
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const commentCountFor = (taskId: string) => comments.filter((c) => c.taskId === taskId).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4 animate-in opacity-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-sm text-text-secondary mt-1">{client.name} · Launch tasks &amp; deliverables</p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-elevated text-xs cursor-pointer"
              title="Delete all tasks for this client"
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
        )}
      </div>

      {(loadError || actionError) && (
        <div className="card p-3 border border-red-500/30 bg-red-500/5">
          <p className="text-xs text-red-500">{loadError || actionError}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-purple animate-spin" />
        </div>
      )}

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
      {showAddForm && !readOnly && (
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
                      {readOnly ? (
                        <span className={`badge inline-flex w-full ${statusStyle[task.status].pill}`}>{task.status}</span>
                      ) : (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className={`badge cursor-pointer border-0 outline-none focus:outline-none w-full ${statusStyle[task.status].pill}`}
                        >
                          {statusColumns.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                    {readOnly ? (
                      <span className="w-6" />
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                        className="w-6 text-text-muted opacity-0 group-hover:opacity-100 hover:text-yellow transition-all cursor-pointer"
                        title="Delete task"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <CommentsPanel
                      taskId={task.id}
                      comments={taskComments}
                      onDeleted={() => { /* realtime subscription will refresh */ }}
                      mode={commentsMode}
                      slug={slug}
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
                      readOnly={readOnly}
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
