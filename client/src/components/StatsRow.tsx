import type { Stats } from "../api";
import { getStatusLabel } from "../labels";
import "./StatsRow.css";
const statuses = ["open", "in_progress", "closed"] as const;
export function StatsRow({ stats }: { stats: Stats | null }) { return <section className="stats-row" aria-label="Ticket statistics">{statuses.map((status) => <article className={`stat-tile stat-${status}`} key={status}><span className="stat-label">{getStatusLabel(status)}</span><strong>{stats?.[status] ?? 0}</strong></article>)}</section>; }
