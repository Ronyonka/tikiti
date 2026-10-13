import type { TicketPriority, TicketStatus } from "../api";
import { getPriorityLabel, getStatusLabel } from "../labels";
import "./Badge.css";
export function StatusBadge({ status }: { status: TicketStatus }) { return <span className={`badge status-badge status-${status}`}>{getStatusLabel(status)}</span>; }
export function PriorityBadge({ priority }: { priority: TicketPriority }) { return <span className={`badge priority-badge priority-${priority}`}>{getPriorityLabel(priority)}</span>; }
