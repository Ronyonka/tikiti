import request from "supertest";
import { describe, expect, it } from "vitest";
import { pool } from "../src/db/pool.js";
import { app } from "../src/app.js";

async function seedTicket(title: string, status: string, createdAt: string): Promise<void> {
  await pool.query(
    `INSERT INTO tickets (title, status, created_at)
     VALUES ($1, $2, $3)`,
    [title, status, createdAt],
  );
}

describe("GET /tickets", () => {
  it("returns an empty page for an empty table", async () => {
    const response = await request(app).get("/tickets");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [], page: 1, limit: 20, total: 0 });
  });

  it("returns tickets newest first", async () => {
    await seedTicket("Older", "open", "2025-01-01T00:00:00Z");
    await seedTicket("Newer", "open", "2025-01-02T00:00:00Z");

    const response = await request(app).get("/tickets");

    expect(response.status).toBe(200);
    expect(response.body.data.map((ticket: { title: string }) => ticket.title)).toEqual(["Newer", "Older"]);
  });

  it("filters by status and reports the filtered total", async () => {
    await seedTicket("Open ticket", "open", "2025-01-01T00:00:00Z");
    await seedTicket("Closed ticket", "closed", "2025-01-02T00:00:00Z");
    await seedTicket("Another open ticket", "open", "2025-01-03T00:00:00Z");

    const response = await request(app).get("/tickets?status=open");

    expect(response.status).toBe(200);
    expect(response.body.data.map((ticket: { title: string }) => ticket.title)).toEqual([
      "Another open ticket",
      "Open ticket",
    ]);
    expect(response.body.total).toBe(2);
  });

  it("paginates with the real total", async () => {
    for (let index = 1; index <= 5; index += 1) {
      await seedTicket(`Ticket ${index}`, "open", `2025-01-0${index}T00:00:00Z`);
    }

    const response = await request(app).get("/tickets?limit=2&page=2");

    expect(response.status).toBe(200);
    expect(response.body.data.map((ticket: { title: string }) => ticket.title)).toEqual(["Ticket 3", "Ticket 2"]);
    expect(response.body).toMatchObject({ page: 2, limit: 2, total: 5 });
  });

  it("returns an empty page with the real total beyond the last page", async () => {
    await seedTicket("Ticket 1", "open", "2025-01-01T00:00:00Z");
    await seedTicket("Ticket 2", "open", "2025-01-02T00:00:00Z");

    const response = await request(app).get("/tickets?page=3&limit=2");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ data: [], page: 3, limit: 2, total: 2 });
  });

  it("rejects an invalid status", async () => {
    const response = await request(app).get("/tickets?status=pending");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid query parameters");
  });

  it.each([
    ["page", "0"],
    ["page", "-1"],
    ["page", "abc"],
    ["limit", "0"],
    ["limit", "-1"],
    ["limit", "abc"],
    ["limit", "101"],
  ])("rejects invalid %s=%s", async (parameter, value) => {
    const response = await request(app).get(`/tickets?${parameter}=${value}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid query parameters");
  });
});
