"use client";

import { useState, useRef, useTransition } from "react";
import {
  FolderOpen,
  Upload,
  Image,
  FileText,
  Film,
  File,
  Palette,
  Plus,
  X,
  Trash2,
  Search,
  Grid3X3,
  List,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import type { Client, FileItem, FileCategory } from "@/lib/types";
import { useClientFiles } from "@/lib/hooks/use-client-files";
import {
  uploadClientFileAction,
  addClientFileLinkAction,
  deleteClientFileAction,
} from "@/app/actions/client-files";

interface Props { client: Client; clientMode?: boolean }

type ViewMode = "grid" | "list";

const categoryConfig: Record<FileCategory, { icon: React.ElementType; color: string; bg: string }> = {
  "Brand Kit": { icon: Palette,  color: "text-purple",       bg: "bg-purple-soft" },
  "Images":    { icon: Image,    color: "text-green",        bg: "bg-green-soft" },
  "Documents": { icon: FileText, color: "text-yellow",       bg: "bg-yellow-soft" },
  "Videos":    { icon: Film,     color: "text-purple-light", bg: "bg-purple-soft" },
  "Other":     { icon: File,     color: "text-text-muted",   bg: "bg-bg-surface" },
};

const allCategories: FileCategory[] = ["Brand Kit", "Images", "Documents", "Videos", "Other"];

function FileCard({
  file, onRemove, viewMode, clientMode,
}: { file: FileItem; onRemove: (id: string) => void; viewMode: ViewMode; clientMode: boolean }) {
  const cfg = categoryConfig[file.category];
  const Icon = cfg.icon;
  const typeIcon = file.type === "image" ? Image : file.type === "pdf" ? FileText : file.type === "video" ? Film : file.type === "link" ? LinkIcon : File;
  const TypeIcon = typeIcon;

  if (viewMode === "list") {
    return (
      <div className="flex items-center gap-4 px-4 py-3 hover:bg-bg-card-hover transition-colors group border-b border-border-subtle">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
          <TypeIcon className={`w-4 h-4 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
          <p className="text-[11px] text-text-muted">{file.notes || file.category}</p>
        </div>
        <span className={`badge ${cfg.bg} ${cfg.color} shrink-0`}>{file.category}</span>
        <span className="text-xs text-text-muted shrink-0 w-16 text-right">{file.size}</span>
        <span className="text-xs text-text-muted shrink-0 w-16 text-right">{new Date(file.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-text-muted hover:text-purple hover:bg-purple-soft transition-colors cursor-pointer"><ExternalLink className="w-3.5 h-3.5" /></a>}
          {!clientMode && <button onClick={() => onRemove(file.id)} className="p-1.5 rounded-md text-text-muted hover:text-yellow hover:bg-yellow-soft transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
        </div>
      </div>
    );
  }

  const previewUrl = file.thumbnail || (file.type === "image" ? file.url : "");

  return (
    <div className="card p-4 group">
      {previewUrl ? (
        <a href={file.url || previewUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-28 rounded-lg overflow-hidden mb-3 bg-bg-surface">
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        </a>
      ) : (
        <div className={`w-full h-28 rounded-lg ${cfg.bg} flex items-center justify-center mb-3`}>
          <TypeIcon className={`w-8 h-8 ${cfg.color} opacity-40`} />
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary truncate">{file.name}</p>
          <p className="text-[11px] text-text-muted mt-0.5">{file.category} &middot; {file.size}</p>
          {file.notes && <p className="text-[11px] text-text-secondary mt-1 truncate">{file.notes}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border-subtle">
        <span className="text-[10px] text-text-muted">{new Date(file.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-text-muted hover:text-purple cursor-pointer"><ExternalLink className="w-3.5 h-3.5" /></a>}
          {!clientMode && <button onClick={() => onRemove(file.id)} className="p-1 rounded text-text-muted hover:text-yellow cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
        </div>
      </div>
    </div>
  );
}

export default function Files({ client, clientMode = false }: Props) {
  const { files, loading } = useClientFiles(client.id);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<FileCategory | "All">("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFile, setNewFile] = useState({
    name: "",
    category: "Brand Kit" as FileCategory,
    type: "link" as FileItem["type"],
    url: "",
    notes: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = files.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.notes.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || f.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const addLinkOrEntry = () => {
    if (clientMode) return;
    if (!newFile.name.trim()) return;
    setActionError(null);
    startTransition(async () => {
      const result = await addClientFileLinkAction({
        clientId: client.id,
        name: newFile.name,
        category: newFile.category,
        type: newFile.type,
        url: newFile.url,
        notes: newFile.notes,
      });
      if (!result.ok) { setActionError(result.error); return; }
      setNewFile({ name: "", category: "Brand Kit", type: "link", url: "", notes: "" });
      setShowAddForm(false);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (clientMode) return;
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    setActionError(null);
    setUploading(true);
    const fd = new FormData();
    fd.set("clientId", client.id);
    Array.from(uploadedFiles).forEach((f) => fd.append("files", f));
    const result = await uploadClientFileAction(fd);
    setUploading(false);
    if (!result.ok) setActionError(result.error);
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    if (clientMode) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteClientFileAction(id);
      if (!result.ok) setActionError(result.error);
    });
  };

  const categoryCounts = allCategories.map((cat) => ({
    category: cat,
    count: files.filter((f) => f.category === cat).length,
    ...categoryConfig[cat],
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4 animate-in opacity-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Files & Assets</h1>
          <p className="text-sm text-text-secondary mt-1">{client.name} &middot; Brand kits, images, documents, and more</p>
        </div>
        {!clientMode && (
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.mp4,.mov,.svg,.webm" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm font-medium text-text-primary hover:border-purple/20 transition-colors cursor-pointer disabled:opacity-50">
              {uploading ? <Loader2 className="w-4 h-4 text-purple animate-spin" /> : <Upload className="w-4 h-4 text-purple" />} Upload Files
            </button>
            <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">
              <Plus className="w-4 h-4" /> Add Link
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="card p-3 border border-red-500/30 bg-red-500/5">
          <p className="text-xs text-red-500">{actionError}</p>
        </div>
      )}

      {showAddForm && !clientMode && (
        <div className="card p-4 border-l-4 border-l-purple animate-in opacity-0">
          <p className="text-sm font-semibold text-text-primary mb-3">Add File / Link</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input type="text" value={newFile.name} onChange={(e) => setNewFile((p) => ({ ...p, name: e.target.value }))} placeholder="Name *" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" autoFocus />
            <select value={newFile.category} onChange={(e) => setNewFile((p) => ({ ...p, category: e.target.value as FileCategory }))} className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer focus:outline-none">
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={newFile.type} onChange={(e) => setNewFile((p) => ({ ...p, type: e.target.value as FileItem["type"] }))} className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer focus:outline-none">
              <option value="link">External Link</option>
              <option value="image">Image</option>
              <option value="pdf">PDF / Document</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
            <input type="text" value={newFile.url} onChange={(e) => setNewFile((p) => ({ ...p, url: e.target.value }))} placeholder="URL or link" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={newFile.notes} onChange={(e) => setNewFile((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <div className="flex gap-2">
              <button onClick={addLinkOrEntry} className="flex-1 px-4 py-2.5 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">Add</button>
              <button onClick={() => setShowAddForm(false)} className="px-3 py-2.5 text-text-muted hover:text-text-secondary cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-in opacity-0 animate-delay-1">
        {categoryCounts.map(({ category, count, icon: Icon, color, bg }) => (
          <button
            key={category}
            onClick={() => setFilterCategory(filterCategory === category ? "All" : category)}
            className={`card p-3 text-center cursor-pointer transition-all ${filterCategory === category ? "ring-1 ring-purple/20 shadow-sm" : ""}`}
          >
            <div className={`w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-lg font-bold text-text-primary">{count}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">{category}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 animate-in opacity-0 animate-delay-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..."
            className="w-full bg-bg-card border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
        </div>
        <div className="flex gap-1 bg-bg-card border border-border-subtle rounded-lg p-1">
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-md transition-colors cursor-pointer ${viewMode === "grid" ? "bg-purple-soft text-purple" : "text-text-muted hover:bg-bg-card-hover"}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-md transition-colors cursor-pointer ${viewMode === "list" ? "bg-purple-soft text-purple" : "text-text-muted hover:bg-bg-card-hover"}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {filterCategory !== "All" && (
        <div className="flex items-center gap-2 animate-in opacity-0">
          <span className="text-xs text-text-muted">Filtered by:</span>
          <span className={`badge ${categoryConfig[filterCategory].bg} ${categoryConfig[filterCategory].color}`}>{filterCategory}</span>
          <button onClick={() => setFilterCategory("All")} className="text-xs text-text-muted hover:text-purple cursor-pointer">Clear</button>
        </div>
      )}

      <div className="animate-in opacity-0 animate-delay-3">
        {loading ? (
          <div className="card p-12 text-center">
            <Loader2 className="w-5 h-5 text-purple animate-spin mx-auto" />
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((file) => (
              <FileCard key={file.id} file={file} onRemove={removeFile} viewMode="grid" clientMode={clientMode} />
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-2.5 bg-bg-surface border-b border-border-subtle">
              <span className="w-9" />
              <span className="flex-1 text-xs text-text-muted font-medium">Name</span>
              <span className="text-xs text-text-muted font-medium w-24">Category</span>
              <span className="text-xs text-text-muted font-medium w-16 text-right">Size</span>
              <span className="text-xs text-text-muted font-medium w-16 text-right">Date</span>
              <span className="w-16" />
            </div>
            {filtered.map((file) => (
              <FileCard key={file.id} file={file} onRemove={removeFile} viewMode="list" clientMode={clientMode} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="card p-12 text-center">
            <FolderOpen className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No files found</p>
            {!clientMode && <p className="text-xs text-text-muted mt-1">Upload files or add link entries</p>}
          </div>
        )}
      </div>
    </div>
  );
}
