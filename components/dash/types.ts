import type { AgentId } from "@/lib/agents";

export type Company = { id: string; name: string; goal: string };
export type Run = { id: string; companyId: string; agentId: AgentId; task: string; output: string; status: "done" | "pending" | "approved" | "rejected"; at: string };
export type TaskItem = { id: string; companyId: string; title: string; col: "todo" | "doing" | "done" };
export type Revenue = { id: string; companyId: string; amountInr: number; note: string; at: string };
export const uid = () => crypto.randomUUID();
