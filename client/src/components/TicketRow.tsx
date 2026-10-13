import type { Ticket } from "../api";
import { formatDate } from "../format";
import { PriorityBadge, StatusBadge } from "./Badge";
import "./TicketRow.css";
export function TicketRow({ ticket }: { ticket: Ticket }) { return <li className="ticket-row"><h2>{ticket.title}</h2>{ticket.description ? <p className="ticket-description">{ticket.description}</p> : null}<div className="ticket-meta"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /><time dateTime={ticket.created_at}>{formatDate(ticket.created_at)}</time></div></li>; }
