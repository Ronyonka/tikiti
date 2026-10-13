import { Router } from "express";
import {
  createTicketHandler,
  listTicketsHandler,
  ticketStatsHandler,
  updateTicketHandler,
} from "../handlers/tickets.js";

const ticketsRouter = Router();

ticketsRouter.post("/", createTicketHandler);
ticketsRouter.get("/", listTicketsHandler);
ticketsRouter.get("/stats", ticketStatsHandler);
ticketsRouter.patch("/:id", updateTicketHandler);

export { ticketsRouter };
