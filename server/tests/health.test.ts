import request from "supertest";
import { describe, expect, it } from "vitest";
import { pool } from "../src/db/pool.js";
import { app } from "../src/app.js";

describe("health", () => {
  it("returns an ok status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("starts with an empty tickets table", async () => {
    const result = await pool.query<{ count: string }>("SELECT COUNT(*) FROM tickets");

    expect(result.rows[0]?.count).toBe("0");
  });
});
