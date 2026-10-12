import request from "supertest";
import { describe, expect, it } from "vitest";
import { pool } from "../src/db/pool.js";
import { app } from "../src/app.js";

describe("POST /tickets", () => {
  it("creates a ticket with default status and priority", async () => {
    const response = await request(app).post("/tickets").send({ title: "Fix login" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "Fix login",
      description: null,
      status: "open",
      priority: "medium",
    });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.created_at).toEqual(expect.any(String));
  });

  it("stores and returns all provided fields", async () => {
    const response = await request(app).post("/tickets").send({
      title: "Deploy release",
      description: "Deploy the reviewed release to production.",
      status: "in_progress",
      priority: "high",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "Deploy release",
      description: "Deploy the reviewed release to production.",
      status: "in_progress",
      priority: "high",
    });
  });

  it("persists the created ticket", async () => {
    const response = await request(app).post("/tickets").send({ title: "Persist me" });
    const result = await pool.query<{ title: string }>("SELECT title FROM tickets WHERE id = $1", [response.body.id]);

    expect(result.rows).toEqual([{ title: "Persist me" }]);
  });

  it("rejects a missing title", async () => {
    const response = await request(app).post("/tickets").send({ description: "No title" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid request body");
    expect(response.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: "title" })]));
  });

  it.each(["", "   "]) ("rejects a blank title: %j", async (title) => {
    const response = await request(app).post("/tickets").send({ title });

    expect(response.status).toBe(400);
  });

  it("rejects an invalid status", async () => {
    const response = await request(app).post("/tickets").send({ title: "Bad status", status: "pending" });

    expect(response.status).toBe(400);
  });

  it("rejects an invalid priority", async () => {
    const response = await request(app).post("/tickets").send({ title: "Bad priority", priority: "urgent" });

    expect(response.status).toBe(400);
  });

  it("rejects malformed JSON", async () => {
    const response = await request(app)
      .post("/tickets")
      .set("Content-Type", "application/json")
      .send('{"title":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Malformed JSON", details: [] });
  });
});
