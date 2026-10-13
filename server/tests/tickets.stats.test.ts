import request from "supertest";
import { describe, expect, it } from "vitest";
import { pool } from "../src/db/pool.js";
import { app } from "../src/app.js";

async function seedTicket(status: "open" | "in_progress" | "closed"): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO tickets (title, status)
     VALUES ($1, $2)
     RETURNING id`,
    [`${status} ticket`, status],
  );

  return result.rows[0].id;
}

describe("GET /tickets/stats", () => {
  it("returns zero for every status when the table is empty", async () => {
    const response = await request(app).get("/tickets/stats");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ open: 0, in_progress: 0, closed: 0 });
  });

  it("returns the correct count for each status", async () => {
    await seedTicket("open");
    await seedTicket("open");
    await seedTicket("in_progress");
    await seedTicket("closed");
    await seedTicket("closed");
    await seedTicket("closed");

    const response = await request(app).get("/tickets/stats");

    expect(response.body).toEqual({ open: 2, in_progress: 1, closed: 3 });
  });

  it("includes a status with no tickets as zero", async () => {
    await seedTicket("open");
    await seedTicket("closed");

    const response = await request(app).get("/tickets/stats");

    expect(response.body).toEqual({ open: 1, in_progress: 0, closed: 1 });
  });

  it("returns counts as numbers", async () => {
    await seedTicket("open");

    const response = await request(app).get("/tickets/stats");

    expect(typeof response.body.open).toBe("number");
    expect(typeof response.body.in_progress).toBe("number");
    expect(typeof response.body.closed).toBe("number");
  });

  it("reflects a status update", async () => {
    const ticketId = await seedTicket("open");

    await request(app).patch(`/tickets/${ticketId}`).send({ status: "closed" });
    const response = await request(app).get("/tickets/stats");

    expect(response.body).toEqual({ open: 0, in_progress: 0, closed: 1 });
  });
});
