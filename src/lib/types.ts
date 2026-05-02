export type EngagementType = "Full-time" | "Part-time" | "Project-based";

export interface Client {
  id: string;
  name: string;
  company: string;
  industry: string;
  status: "Active" | "Onboarding" | "Paused";
  engagement: EngagementType;
  schedule: string;
  rate: number;
  rateLabel: string;
  joinedDate: string;
  avatar: string;
  image?: string;
  logo?: string;
  brandColor?: string;
}

export type TaskStatus = "To Do" | "In Progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
}

export type CommentAuthor = "you" | "client";

export interface CommentAttachment {
  id: string;
  type: "url" | "image";
  url: string;       // external URL or data URL (base64 image)
  label?: string;
  filename?: string; // for uploaded images
  size?: number;     // bytes (uploaded images)
  mimeType?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  author: CommentAuthor;
  body: string;
  createdAt: number; // epoch ms
  attachments: CommentAttachment[];
}

export interface DailyLogNode {
  id: string;
  title: string;
  children: DailyLogNode[];
}

export interface DailyLog {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string;
  tasksCompleted: DailyLogNode[];
  pendingTasks: DailyLogNode[];
  priorities: DailyLogNode[];
  blockers: DailyLogNode[];
  nextDayPlan: DailyLogNode[];
}

export type ViewType = "dashboard" | "daily-ops" | "tasks" | "files";

export type FileCategory = "Brand Kit" | "Images" | "Documents" | "Videos" | "Other";
export type FileItemType = "image" | "pdf" | "video" | "link" | "other";

export interface FileItem {
  id: string;
  name: string;
  category: FileCategory;
  type: FileItemType;
  url: string;
  thumbnail?: string;
  size: string;
  uploadedAt: string;
  notes: string;
}

export type MilestoneStatus = "Not Started" | "In Progress" | "Completed";

export interface Milestone {
  id: string;
  number: number;
  title: string;
  targetDate: string;
  intent: string;
  output: string;
  status: MilestoneStatus;
  steps: { id: string; label: string; done: boolean }[];
}
