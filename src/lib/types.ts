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
export type TaskTag = "Funnel" | "Automation" | "Ads" | "CRM" | "Design" | "Dev" | "Support";

export interface Task {
  id: string;
  name: string;
  assignedTo: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  tags: TaskTag[];
}

export interface DailyLog {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string;
  tasksCompleted: string[];
  pendingTasks: string[];
  priorities: string[];
  blockers: string[];
  nextDayPlan: string[];
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
