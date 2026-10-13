import type { TicketStatus } from "../api";
import { getStatusLabel } from "../labels";
import "./Filters.css";
export function Filters({ status, onStatusChange }: { status: TicketStatus | ""; onStatusChange: (status: TicketStatus | "") => void }) { return <div className="filters"><label htmlFor="status-filter">Filter by status</label><select id="status-filter" value={status} onChange={(event) => onStatusChange(event.target.value as TicketStatus | "")}><option value="">All</option><option value="open">{getStatusLabel("open")}</option><option value="in_progress">{getStatusLabel("in_progress")}</option><option value="closed">{getStatusLabel("closed")}</option></select></div>; }
