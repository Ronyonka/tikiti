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

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const result = await pool.query<Ticket>(
    `INSERT INTO tickets (title, description, status, priority)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, status, priority, created_at`,
    [input.title, input.description ?? null, input.status, input.priority],
  );

  return result.rows[0];
}
