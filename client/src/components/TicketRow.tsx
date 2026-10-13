import { useState } from "react";
import { ApiError, updateTicketStatus, type Ticket, type TicketStatus } from "../api";
import { formatDate } from "../format";
import { PriorityBadge, StatusBadge } from "./Badge";
import "./TicketRow.css";
export function TicketRow({ ticket, onStatusUpdated }: { ticket: Ticket; onStatusUpdated: () => void }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (status: TicketStatus) => {
    setUpdating(true);
    try {
      await updateTicketStatus(ticket.id, status);
      setError(null);
      onStatusUpdated();
    } catch (requestError: unknown) {
      setError(requestError instanceof ApiError ? requestError.message : requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setUpdating(false);
    }
  };

  return <li className="ticket-row"><h2>{ticket.title}</h2>{ticket.description ? <p className="ticket-description">{ticket.description}</p> : null}<div className="ticket-meta"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /><time dateTime={ticket.created_at}>{formatDate(ticket.created_at)}</time><select aria-label={`Status for ${ticket.title}`} value={ticket.status} disabled={updating} onChange={(event) => void handleStatusChange(event.target.value as TicketStatus)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="closed">Closed</option></select></div>{error ? <p className="ticket-status-error">{error}</p> : null}</li>;
}
