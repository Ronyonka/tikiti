import type { TicketPriority, TicketStatus } from "./api";

export const statusLabels: Record<TicketStatus, string> = { open: "Open", in_progress: "In progress", closed: "Closed" };
export const priorityLabels: Record<TicketPriority, string> = { low: "Low", medium: "Medium", high: "High" };
export function getStatusLabel(status: TicketStatus): string { return statusLabels[status]; }
export function getPriorityLabel(priority: TicketPriority): string { return priorityLabels[priority]; }
