import type { Request, Response } from "express";
import { z } from "zod";
import { createTicket } from "../db/tickets.js";

const createTicketSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().nullable().optional(),
    status: z.enum(["open", "in_progress", "closed"]).default("open"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
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
