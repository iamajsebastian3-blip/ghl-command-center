// DB row types — kept in sync with supabase/schema.sql by hand.
// (Could be regenerated with `supabase gen types typescript` later.)

export interface ClientRow {
  id: string;
  slug: string;
  name: string;
  company: string;
  industry: string | null;
  status: string;
  engagement: string;
  schedule: string | null;
  rate: number | null;
  rate_label: string | null;
  joined_date: string | null;
  avatar: string | null;
  image: string | null;
  logo: string | null;
  brand_color: string | null;
  created_at: string;
}
export type ClientInsert = {
  slug: string;
  name: string;
  company: string;
  industry?: string | null;
  status?: string;
  engagement?: string;
  schedule?: string | null;
  rate?: number | null;
  rate_label?: string | null;
  joined_date?: string | null;
  avatar?: string | null;
  image?: string | null;
  logo?: string | null;
  brand_color?: string | null;
};
export type ClientUpdate = Partial<ClientInsert>;

export interface TaskRow {
  id: string;
  client_id: string;
  name: string;
  status: "To Do" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High" | "Urgent";
  position: number;
  created_at: string;
  updated_at: string;
}
export type TaskInsert = {
  client_id: string;
  name: string;
  status?: TaskRow["status"];
  priority?: TaskRow["priority"];
  position?: number;
};
export type TaskUpdate = Partial<Omit<TaskRow, "id" | "client_id" | "created_at">>;

export interface TaskCommentRow {
  id: string;
  task_id: string;
  author: "you" | "client";
  body: string;
  created_at: string;
}
export type TaskCommentInsert = {
  task_id: string;
  author: "you" | "client";
  body?: string;
};

export interface CommentAttachmentRow {
  id: string;
  comment_id: string;
  type: "url" | "image";
  url: string;
  label: string | null;
  filename: string | null;
  size: number | null;
  mime_type: string | null;
  created_at: string;
}
export type CommentAttachmentInsert = {
  comment_id: string;
  type: "url" | "image";
  url: string;
  label?: string | null;
  filename?: string | null;
  size?: number | null;
  mime_type?: string | null;
};

export interface DailyLogNodeRow {
  id: string;
  title: string;
  children: DailyLogNodeRow[];
}
export interface DailyLogRow {
  client_id: string;
  log_date: string;
  time_in: string | null;
  time_out: string | null;
  tasks_completed: DailyLogNodeRow[];
  pending_tasks: DailyLogNodeRow[];
  priorities: DailyLogNodeRow[];
  blockers: DailyLogNodeRow[];
  next_day_plan: DailyLogNodeRow[];
  updated_at: string;
}
export type DailyLogUpsert = {
  client_id: string;
  log_date?: string;
  time_in?: string | null;
  time_out?: string | null;
  tasks_completed?: DailyLogNodeRow[];
  pending_tasks?: DailyLogNodeRow[];
  priorities?: DailyLogNodeRow[];
  blockers?: DailyLogNodeRow[];
  next_day_plan?: DailyLogNodeRow[];
};

export interface TimeSessionRow {
  id: string;
  client_id: string;
  session_date: string;
  start_label: string;
  end_label: string;
  start_epoch: number;
  end_epoch: number | null;
  seconds: number;
  created_at: string;
}
export type TimeSessionInsert = {
  client_id: string;
  session_date: string;
  start_label: string;
  end_label: string;
  start_epoch: number;
  end_epoch?: number | null;
  seconds?: number;
};

export interface MilestoneRow {
  id: string;
  client_id: string;
  number: number;
  title: string;
  target_date: string | null;
  intent: string;
  output: string;
  status: "Not Started" | "In Progress" | "Completed";
  steps: { id: string; label: string; done: boolean }[];
  position: number;
  created_at: string;
  updated_at: string;
}
export type MilestoneInsert = {
  client_id: string;
  number: number;
  title: string;
  target_date?: string | null;
  intent?: string;
  output?: string;
  status?: MilestoneRow["status"];
  steps?: MilestoneRow["steps"];
  position?: number;
};
export type MilestoneUpdate = Partial<Omit<MilestoneRow, "id" | "client_id" | "created_at">>;

export interface ClientFileRow {
  id: string;
  client_id: string;
  name: string;
  category: "Brand Kit" | "Images" | "Documents" | "Videos" | "Other";
  type: "image" | "pdf" | "video" | "link" | "other";
  url: string;
  thumbnail: string | null;
  size_label: string;
  notes: string;
  storage_path: string | null;
  created_at: string;
}
export type ClientFileInsert = {
  client_id: string;
  name: string;
  category?: ClientFileRow["category"];
  type?: ClientFileRow["type"];
  url?: string;
  thumbnail?: string | null;
  size_label?: string;
  notes?: string;
  storage_path?: string | null;
};

export type Database = {
  public: {
    Tables: {
      clients:             { Row: ClientRow;             Insert: ClientInsert;             Update: ClientUpdate };
      tasks:               { Row: TaskRow;               Insert: TaskInsert;               Update: TaskUpdate };
      task_comments:       { Row: TaskCommentRow;        Insert: TaskCommentInsert;        Update: Partial<TaskCommentRow> };
      comment_attachments: { Row: CommentAttachmentRow;  Insert: CommentAttachmentInsert;  Update: Partial<CommentAttachmentRow> };
      daily_logs:          { Row: DailyLogRow;           Insert: DailyLogUpsert;           Update: Partial<DailyLogRow> };
      time_sessions:       { Row: TimeSessionRow;        Insert: TimeSessionInsert;        Update: Partial<TimeSessionRow> };
      milestones:          { Row: MilestoneRow;          Insert: MilestoneInsert;          Update: MilestoneUpdate };
      client_files:        { Row: ClientFileRow;         Insert: ClientFileInsert;         Update: Partial<ClientFileRow> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
