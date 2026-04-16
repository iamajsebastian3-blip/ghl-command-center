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

export type PipelineStage =
  | "Nurturing"
  | "New Lead"
  | "Offer Presented"
  | "Engaged Prospect"
  | "Qualified"
  | "Call Booked"
  | "Deal Negotiation"
  | "Closed Won"
  | "Closed Lost";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: PipelineStage;
  value: number;
  source: string;
  lastContact: string;
  notes: string;
}

export type PaymentStatus = "Paid" | "Pending" | "Overdue";

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

export type ViewType = "dashboard" | "daily-ops" | "tasks" | "crm" | "invoices" | "documents" | "files";
