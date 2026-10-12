import { Router } from "express";
import { createTicketHandler } from "../handlers/tickets.js";

const ticketsRouter = Router();

ticketsRouter.post("/", createTicketHandler);

export { ticketsRouter };
