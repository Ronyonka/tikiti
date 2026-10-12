import type { Request, Response } from "express";
import { z } from "zod";
import { createTicket, listTickets } from "../db/tickets.js";

const statusSchema = z.enum(["open", "in_progress", "closed"]);
const prioritySchema = z.enum(["low", "medium", "high"]);

const createTicketSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().nullable().optional(),
    status: statusSchema.default("open"),
    priority: prioritySchema.default("medium"),
  })
  .strict();

const listTicketsSchema = z
  .object({
    status: statusSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export async function createTicketHandler(request: Request, response: Response): Promise<void> {
  const parsed = createTicketSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: "Invalid request body",
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      })),
    });
    return;
  }

  const ticket = await createTicket(parsed.data);
  response.status(201).json(ticket);
}

export async function listTicketsHandler(request: Request, response: Response): Promise<void> {
  const parsed = listTicketsSchema.safeParse(request.query);

  if (!parsed.success) {
    response.status(400).json({
      error: "Invalid query parameters",
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "query",
        message: issue.message,
      })),
    });
    return;
  }

  const result = await listTickets(parsed.data);
  response.status(200).json({
    data: result.data,
    page: parsed.data.page,
    limit: parsed.data.limit,
    total: result.total,
  });
}
