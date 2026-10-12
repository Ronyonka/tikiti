import express from "express";
import { ticketsRouter } from "./routes/tickets.js";

const app = express();

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/tickets", ticketsRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => {
  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    response.status(400).json({
      error: "Malformed JSON",
      details: [],
    });
    return;
  }

  if (response.headersSent) {
    next(error);
    return;
  }

  console.error(error);
  response.status(500).json({
    error: "Internal server error",
    details: [],
  });
});

export { app };
