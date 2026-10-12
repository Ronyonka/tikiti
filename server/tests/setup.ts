import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeEach } from "vitest";

function parseEnv(contents: string): Record<string, string> {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}

async function loadRootEnv(): Promise<Record<string, string>> {
  const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

  try {
    return parseEnv(await readFile(path.join(rootDirectory, ".env"), "utf8"));
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

const rootEnv = await loadRootEnv();
const testDatabaseUrl = rootEnv.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is missing from the root .env");
}

let databaseName: string;

try {
  databaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname).replace(/^\/+/, "");
} catch {
  throw new Error("TEST_DATABASE_URL must be a valid database connection URL");
}

if (!databaseName.endsWith("_test")) {
  throw new Error(
    `TEST_DATABASE_URL must point to a database whose name ends in _test; received ${databaseName || "no database name"}`,
  );
}

process.env.DATABASE_URL = testDatabaseUrl;

const { pool } = await import("../src/db/pool.js");

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE tickets");
});

afterAll(async () => {
  await pool.end();
});
