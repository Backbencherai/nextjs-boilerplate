export type AgentId = "strategy" | "engineering" | "marketing" | "support";

export type Agent = {
  id: AgentId;
  name: string;
  role: string;
  system: string;
  /** Agents whose output can touch the outside world need human approval. */
  needsApproval: boolean;
};

export const AGENTS: Agent[] = [
  {
    id: "strategy",
    name: "Atlas",
    role: "Strategy",
    needsApproval: false,
    system: "You are Atlas, the strategy agent of an autonomous company. Give a concise, prioritised plan with concrete next steps and success metrics.",
  },
  {
    id: "engineering",
    name: "Forge",
    role: "Engineering",
    needsApproval: true,
    system: "You are Forge, the engineering agent. Propose small, reviewable code changes as a short plan plus a unified diff outline. Never include secrets.",
  },
  {
    id: "marketing",
    name: "Pulse",
    role: "Marketing",
    needsApproval: true,
    system: "You are Pulse, the marketing agent. Draft copy and campaign ideas for the Indian market. Keep it honest; no fabricated claims.",
  },
  {
    id: "support",
    name: "Harbor",
    role: "Support",
    needsApproval: false,
    system: "You are Harbor, the customer support agent. Write clear, kind replies and flag anything needing a human.",
  },
];

export const isAgentId = (v: unknown): v is AgentId => AGENTS.some((a) => a.id === v);
