import request from "supertest";
import { describe, expect, it } from "vitest";
import { pool } from "../src/db/pool.js";
import { app } from "../src/app.js";

type SeededTicket = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: Date;
};

async function seedTicket(overrides: Partial<SeededTicket> = {}): Promise<SeededTicket> {
  const result = await pool.query<SeededTicket>(
     `INSERT INTO tickets (title, description, status, priority, created_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, description, status, priority, created_at`,
    [
      overrides.title ?? "Original title",
      overrides.description ?? "Original description",
      overrides.status ?? "open",
      overrides.priority ?? "medium",
      overrides.created_at ?? "2025-01-01T00:00:00Z",
    ],
  );

  return result.rows[0];
}

describe("PATCH /tickets/:id", () => {
  it("updates status only and leaves priority unchanged", async () => {
    const ticket = await seedTicket({ priority: "high" });

    const response = await request(app).patch(`/tickets/${ticket.id}`).send({ status: "closed" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: ticket.id, status: "closed", priority: "high" });
  });

  it("updates priority only and leaves status unchanged", async () => {
    const ticket = await seedTicket({ status: "in_progress" });

    const response = await request(app).patch(`/tickets/${ticket.id}`).send({ priority: "low" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: ticket.id, status: "in_progress", priority: "low" });
  });

  it("updates status and priority together", async () => {
    const ticket = await seedTicket();

    const response = await request(app)
      .patch(`/tickets/${ticket.id}`)
      .send({ status: "in_progress", priority: "high" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: ticket.id, status: "in_progress", priority: "high" });
  });

  it("persists the change", async () => {
    const ticket = await seedTicket();

    await request(app).patch(`/tickets/${ticket.id}`).send({ status: "closed" });
    const result = await pool.query<{ status: string }>("SELECT status FROM tickets WHERE id = $1", [ticket.id]);

    expect(result.rows).toEqual([{ status: "closed" }]);
  });

  it("does not change title, description, or created_at", async () => {
    const ticket = await seedTicket();

    const response = await request(app).patch(`/tickets/${ticket.id}`).send({ priority: "high" });
    const result = await pool.query<SeededTicket>(
      "SELECT title, description, created_at FROM tickets WHERE id = $1",
      [ticket.id],
    );

    expect(response.body).toMatchObject({
      title: ticket.title,
      description: ticket.description,
      created_at: ticket.created_at.toISOString(),
    });
    expect(result.rows[0]).toEqual({
      title: ticket.title,
      description: ticket.description,
      created_at: ticket.created_at,
    });
  });

  it("returns 404 for an unknown but well-formed uuid", async () => {
    const response = await request(app)
      .patch("/tickets/00000000-0000-4000-8000-000000000000")
      .send({ status: "closed" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket not found", details: [] });
  });

  it("returns 400 for a malformed id", async () => {
    const response = await request(app).patch("/tickets/abc").send({ status: "closed" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid request parameters");
  });

  it("rejects invalid status and priority values", async () => {
    const ticket = await seedTicket();

    const invalidStatus = await request(app).patch(`/tickets/${ticket.id}`).send({ status: "pending" });
    const invalidPriority = await request(app).patch(`/tickets/${ticket.id}`).send({ priority: "urgent" });

    expect(invalidStatus.status).toBe(400);
    expect(invalidPriority.status).toBe(400);
  });

  it("rejects an empty body", async () => {
    const ticket = await seedTicket();

    const response = await request(app).patch(`/tickets/${ticket.id}`).send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid request body");
  });

  it("rejects title and does not modify the ticket", async () => {
    const ticket = await seedTicket();

    const response = await request(app).patch(`/tickets/${ticket.id}`).send({ title: "Changed title" });
    const result = await pool.query<{ title: string; status: string; priority: string }>(
      "SELECT title, status, priority FROM tickets WHERE id = $1",
      [ticket.id],
    );

    expect(response.status).toBe(400);
    expect(result.rows[0]).toEqual({ title: ticket.title, status: ticket.status, priority: ticket.priority });
  });
});
