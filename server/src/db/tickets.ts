import { pool } from "./pool.js";

export type Ticket = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high";
  created_at: Date;
};

type CreateTicketInput = Omit<Ticket, "id" | "created_at" | "description"> & {
  description?: string | null;
};

export type ListTicketsInput = {
  status?: Ticket["status"];
  page: number;
  limit: number;
};

export type ListTicketsResult = {
  data: Ticket[];
  total: number;
};

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const result = await pool.query<Ticket>(
    `INSERT INTO tickets (title, description, status, priority)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, status, priority, created_at`,
    [input.title, input.description ?? null, input.status, input.priority],
  );

  return result.rows[0];
}

export async function listTickets(input: ListTicketsInput): Promise<ListTicketsResult> {
  const filterValues = input.status ? [input.status] : [];
  const whereClause = filterValues.length > 0 ? "WHERE status = $1" : "";
  const limitParameter = filterValues.length + 1;
  const offsetParameter = filterValues.length + 2;
  const values = [...filterValues, input.limit, (input.page - 1) * input.limit];

  const [ticketsResult, countResult] = await Promise.all([
    pool.query<Ticket>(
      `SELECT id, title, description, status, priority, created_at
       FROM tickets
       ${whereClause}
       ORDER BY created_at DESC, id DESC
       LIMIT $${limitParameter} OFFSET $${offsetParameter}`,
      values,
    ),
    pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM tickets
       ${whereClause}`,
      filterValues,
    ),
  ]);

  return {
    data: ticketsResult.rows,
    total: Number(countResult.rows[0].total),
  };
}
