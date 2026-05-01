"use server";

import { requireOwner } from "@/lib/auth";
import {
  createTask as dbCreateTask,
  updateTask as dbUpdateTask,
  deleteTask as dbDeleteTask,
  deleteAllTasksForClient as dbDeleteAll,
} from "@/lib/db/tasks";
import type { TaskRow } from "@/lib/supabase/types";

type TaskStatus = "To Do" | "In Progress" | "Done";
type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface CreateTaskInput {
  clientId: string;
  name: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export async function createTaskAction(input: CreateTaskInput) {
  await requireOwner();
  const name = input.name?.trim();
  if (!name) return { ok: false as const, error: "Task name is required" };
  try {
    const row = await dbCreateTask({
      client_id: input.clientId,
      name,
      status: input.status ?? "To Do",
      priority: input.priority ?? "Medium",
    });
    return { ok: true as const, task: row as TaskRow };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateTaskStatusAction(id: string, status: TaskStatus) {
  await requireOwner();
  try {
    await dbUpdateTask(id, { status });
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateTaskPriorityAction(id: string, priority: TaskPriority) {
  await requireOwner();
  try {
    await dbUpdateTask(id, { priority });
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function renameTaskAction(id: string, name: string) {
  await requireOwner();
  const trimmed = name?.trim();
  if (!trimmed) return { ok: false as const, error: "Task name cannot be empty" };
  try {
    await dbUpdateTask(id, { name: trimmed });
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteTaskAction(id: string) {
  await requireOwner();
  try {
    await dbDeleteTask(id);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteAllTasksAction(clientId: string) {
  await requireOwner();
  try {
    await dbDeleteAll(clientId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
