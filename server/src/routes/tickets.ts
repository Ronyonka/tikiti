import { Router } from "express";
import { createTicketHandler, listTicketsHandler } from "../handlers/tickets.js";

const ticketsRouter = Router();

ticketsRouter.post("/", createTicketHandler);
ticketsRouter.get("/", listTicketsHandler);

export { ticketsRouter };
