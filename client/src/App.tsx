import { useCallback, useEffect, useRef, useState } from "react";
import { getStats, listTickets, type Stats, type Ticket, type TicketStatus } from "./api";
import { Filters } from "./components/Filters";
import { Pagination } from "./components/Pagination";
import { StatsRow } from "./components/StatsRow";
import { TicketRow } from "./components/TicketRow";
import "./App.css";

const PAGE_SIZE = 10;

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reloadAll = useCallback(() => {
    const ticketsController = new AbortController();
    const statsController = new AbortController();
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError(null);
    setStatsError(null);

    listTickets({ status: status || undefined, page, limit: PAGE_SIZE }, { signal: ticketsController.signal })
      .then((response) => {
        if (currentRequestId !== requestId.current) return;
        setTickets(response.data);
        setTotal(response.total);
      })
      .catch((requestError: unknown) => {
        if (currentRequestId !== requestId.current) return;
        setError(requestError instanceof Error ? requestError.message : "Request failed");
      })
      .finally(() => {
        if (currentRequestId === requestId.current) setLoading(false);
      });

    getStats({ signal: statsController.signal })
      .then((nextStats) => {
        if (currentRequestId === requestId.current) setStats(nextStats);
      })
      .catch((requestError: unknown) => {
        if (currentRequestId !== requestId.current) return;
        setStatsError(requestError instanceof Error ? requestError.message : "Request failed");
      });

    return () => { ticketsController.abort(); statsController.abort(); };
  }, [page, status]);

  useEffect(() => reloadAll(), [reloadAll]);

  const handleStatusChange = (nextStatus: TicketStatus | "") => {
    setStatus(nextStatus);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="app-shell">
      <header className="app-header"><h1>Tickets</h1></header>
      <StatsRow stats={stats} />
      {statsError ? <p className="stats-error">Stats unavailable: {statsError}</p> : null}
      <section className="ticket-controls" aria-label="Ticket controls">
        <Filters status={status} onStatusChange={handleStatusChange} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </section>
      {loading ? <p className="loading-state">Loading tickets</p> : null}
      {error ? <div className="request-error" role="alert"><p>{error}</p><button type="button" onClick={reloadAll}>Retry</button></div> : null}
      {!loading && !error && tickets.length === 0 ? <p className="empty-state">{status ? "No tickets with this status" : "No tickets yet"}</p> : null}
      {!loading && !error && tickets.length > 0 ? <ul className="ticket-list">{tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}</ul> : null}
    </main>
  );
}

export default App;
