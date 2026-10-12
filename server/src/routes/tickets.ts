import { Router } from "express";
import { createTicketHandler, listTicketsHandler, updateTicketHandler } from "../handlers/tickets.js";

const ticketsRouter = Router();

ticketsRouter.post("/", createTicketHandler);
ticketsRouter.get("/", listTicketsHandler);
ticketsRouter.patch("/:id", updateTicketHandler);

export { ticketsRouter };
