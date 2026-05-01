"use client";

import { useState, useRef } from "react";
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
  Download,
  Trash2,
  Search,
  Grid3X3,
  List,
  ExternalLink,
  Link,
} from "lucide-react";
import type { Client, FileItem, FileCategory } from "@/lib/types";
import { filesByClient } from "@/lib/mock-data";
import { usePersistedState } from "@/lib/use-persisted-state";

interface Props { client: Client }

type ViewMode = "grid" | "list";

const categoryConfig: Record<FileCategory, { icon: React.ElementType; color: string; bg: string }> = {
  "Brand Kit": { icon: Palette, color: "text-purple", bg: "bg-purple-soft" },
  "Images": { icon: Image, color: "text-green", bg: "bg-green-soft" },
  "Documents": { icon: FileText, color: "text-yellow", bg: "bg-yellow-soft" },
  "Videos": { icon: Film, color: "text-purple-light", bg: "bg-purple-soft" },
  "Other": { icon: File, color: "text-text-muted", bg: "bg-bg-surface" },
};

const allCategories: FileCategory[] = ["Brand Kit", "Images", "Documents", "Videos", "Other"];

const defaultFiles: FileItem[] = [
  { id: "f1", name: "Logo - Primary (Purple)", category: "Brand Kit", type: "image", url: "", thumbnail: "", size: "245 KB", uploadedAt: "2026-04-10", notes: "Main logo on dark bg" },
  { id: "f2", name: "Logo - White", category: "Brand Kit", type: "image", url: "", thumbnail: "", size: "180 KB", uploadedAt: "2026-04-10", notes: "For light backgrounds" },
  { id: "f3", name: "Brand Colors & Fonts", category: "Brand Kit", type: "pdf", url: "", size: "1.2 MB", uploadedAt: "2026-04-10", notes: "Purple #5E17EB, Yellow #FBBF24, Inter font" },
  { id: "f4", name: "Hero Banner - Homepage", category: "Images", type: "image", url: "", thumbnail: "", size: "890 KB", uploadedAt: "2026-04-12", notes: "1920x1080" },
  { id: "f5", name: "Team Photo", category: "Images", type: "image", url: "", thumbnail: "", size: "2.1 MB", uploadedAt: "2026-04-08", notes: "" },
  { id: "f6", name: "Client Testimonial Video", category: "Videos", type: "video", url: "", size: "48 MB", uploadedAt: "2026-04-05", notes: "30 sec for funnel" },
  { id: "f7", name: "Service Agreement Template", category: "Documents", type: "pdf", url: "", size: "340 KB", uploadedAt: "2026-03-20", notes: "Editable template" },
  { id: "f8", name: "Ad Creatives - Facebook", category: "Images", type: "image", url: "", thumbnail: "", size: "1.5 MB", uploadedAt: "2026-04-14", notes: "5 variations, 1080x1080" },
  { id: "f9", name: "Google Drive - Project Folder", category: "Other", type: "link", url: "#", size: "—", uploadedAt: "2026-04-01", notes: "Shared folder with all deliverables" },
];

function FileCard({ file, onRemove, viewMode }: { file: FileItem; onRemove: (id: string) => void; viewMode: ViewMode }) {
  const cfg = categoryConfig[file.category];
  const Icon = cfg.icon;
  const typeIcon = file.type === "image" ? Image : file.type === "pdf" ? FileText : file.type === "video" ? Film : file.type === "link" ? Link : File;
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
          {file.type === "link" && <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-text-muted hover:text-purple hover:bg-purple-soft transition-colors cursor-pointer"><ExternalLink className="w-3.5 h-3.5" /></a>}
          <button onClick={() => onRemove(file.id)} className="p-1.5 rounded-md text-text-muted hover:text-yellow hover:bg-yellow-soft transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    );
  }

  const previewUrl = file.thumbnail || (file.type === "image" ? file.url : "");

  return (
    <div className="card p-4 group">
      {/* Thumbnail area */}
      {previewUrl ? (
        <div className="w-full h-28 rounded-lg overflow-hidden mb-3 bg-bg-surface">
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        </div>
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
          {file.type === "link" && <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-text-muted hover:text-purple cursor-pointer"><ExternalLink className="w-3.5 h-3.5" /></a>}
          <button onClick={() => onRemove(file.id)} className="p-1 rounded text-text-muted hover:text-yellow cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

export default function Files({ client }: Props) {
  const seedFiles = filesByClient[client.id] ?? defaultFiles;
  const [files, setFiles] = usePersistedState<FileItem[]>(`files:${client.id}`, seedFiles);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<FileCategory | "All">("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFile, setNewFile] = useState({ name: "", category: "Brand Kit" as FileCategory, type: "image" as FileItem["type"], url: "", size: "", notes: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = files.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.notes.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || f.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const addFile = () => {
    if (!newFile.name.trim()) return;
    const file: FileItem = {
      id: `f${Date.now()}`,
      name: newFile.name.trim(),
      category: newFile.category,
      type: newFile.type,
      url: newFile.url.trim(),
      size: newFile.size.trim() || "—",
      uploadedAt: new Date().toISOString().split("T")[0],
      notes: newFile.notes.trim(),
    };
    setFiles((prev) => [file, ...prev]);
    setNewFile({ name: "", category: "Brand Kit", type: "image", url: "", size: "", notes: "" });
    setShowAddForm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;
    Array.from(uploadedFiles).forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      let type: FileItem["type"] = "other";
      let category: FileCategory = "Other";
      if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) { type = "image"; category = "Images"; }
      else if (["pdf", "doc", "docx", "txt"].includes(ext)) { type = "pdf"; category = "Documents"; }
      else if (["mp4", "mov", "avi", "webm"].includes(ext)) { type = "video"; category = "Videos"; }

      const sizeKB = Math.round(f.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

      const fileItem: FileItem = {
        id: `f${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        category,
        type,
        url: URL.createObjectURL(f),
        size: sizeStr,
        uploadedAt: new Date().toISOString().split("T")[0],
        notes: "",
      };
      setFiles((prev) => [fileItem, ...prev]);
    });
    e.target.value = "";
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
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.mp4,.mov,.svg" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm font-medium text-text-primary hover:border-purple/20 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-purple" /> Upload Files
          </button>
          <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* Add Entry Form */}
      {showAddForm && (
        <div className="card p-4 border-l-4 border-l-purple animate-in opacity-0">
          <p className="text-sm font-semibold text-text-primary mb-3">Add File / Link</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input type="text" value={newFile.name} onChange={(e) => setNewFile((p) => ({ ...p, name: e.target.value }))} placeholder="Name *" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" autoFocus />
            <select value={newFile.category} onChange={(e) => setNewFile((p) => ({ ...p, category: e.target.value as FileCategory }))} className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer focus:outline-none">
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={newFile.type} onChange={(e) => setNewFile((p) => ({ ...p, type: e.target.value as FileItem["type"] }))} className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer focus:outline-none">
              <option value="image">Image</option>
              <option value="pdf">PDF / Document</option>
              <option value="video">Video</option>
              <option value="link">External Link</option>
              <option value="other">Other</option>
            </select>
            <input type="text" value={newFile.url} onChange={(e) => setNewFile((p) => ({ ...p, url: e.target.value }))} placeholder="URL or link (optional)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <input type="text" value={newFile.notes} onChange={(e) => setNewFile((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple/40" />
            <div className="flex gap-2">
              <button onClick={addFile} className="flex-1 px-4 py-2.5 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple-light transition-colors cursor-pointer">Add</button>
              <button onClick={() => setShowAddForm(false)} className="px-3 py-2.5 text-text-muted hover:text-text-secondary cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Category Summary */}
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

      {/* Search + View Toggle */}
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

      {/* Filter pills */}
      {filterCategory !== "All" && (
        <div className="flex items-center gap-2 animate-in opacity-0">
          <span className="text-xs text-text-muted">Filtered by:</span>
          <span className={`badge ${categoryConfig[filterCategory].bg} ${categoryConfig[filterCategory].color}`}>{filterCategory}</span>
          <button onClick={() => setFilterCategory("All")} className="text-xs text-text-muted hover:text-purple cursor-pointer">Clear</button>
        </div>
      )}

      {/* Files */}
      <div className="animate-in opacity-0 animate-delay-3">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((file) => (
              <FileCard key={file.id} file={file} onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))} viewMode="grid" />
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
              <FileCard key={file.id} file={file} onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))} viewMode="list" />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <FolderOpen className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No files found</p>
            <p className="text-xs text-text-muted mt-1">Upload files or add entries manually</p>
          </div>
        )}
      </div>
    </div>
  );
}
