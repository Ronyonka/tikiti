import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDirectory = path.resolve(process.cwd(), "..");

async function loadRootEnv(): Promise<Record<string, string>> {
  const contents = await readFile(path.join(rootDirectory, ".env"), "utf8");

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

const tickets = [
  ["Login page returns 500 on expired session", "Refresh tokens are not being cleared before the redirect.", "open", "high", 0],
  ["Add loading state to the dashboard", "Show a spinner while the summary cards are fetching.", "in_progress", "medium", 1],
  ["Update Node version in CI", "Move the build workflow to the current supported Node 20 image.", "closed", "low", 1],
  ["Email notification is sent twice", "A retry can enqueue the same ticket notification more than once.", "open", "high", 2],
  ["Improve empty state copy for projects", "The current message does not explain how to create the first project.", "closed", "low", 2],
  ["Add keyboard shortcut for quick ticket creation", "Provide a documented shortcut for opening the create form.", "in_progress", "low", 3],
  ["Audit slow query on team activity page", "The activity query scans the full event table for every request.", "open", "high", 4],
  ["Fix avatar cropping in compact list", "Square images are stretched when the list is narrower than expected.", "closed", "medium", 4],
  ["Document local database reset workflow", "Add the safe development steps to the contributor notes.", "closed", "low", 5],
  ["Timezone is wrong in ticket timestamps", "Dates appear one hour behind for users in some regions.", "open", "medium", 5],
  ["Prevent duplicate form submissions", "Disable the submit action until the create request completes.", "in_progress", "high", 6],
  ["Add validation message for oversized attachments", "The API should explain the upload limit before the request fails.", "open", "medium", 7],
  ["Clean up unused feature flag", null, "closed", "low", 7],
  ["Search index rebuild job times out", "The worker needs batching before rebuilding the larger workspace indexes.", "open", "high", 8],
  ["Make status badge text more accessible", "Add a visible label so color is not the only status signal.", "in_progress", "medium", 8],
  ["Retry failed webhook deliveries", "Expose a bounded retry policy for temporary provider failures.", "open", "high", 9],
  ["Fix mobile navigation overlay", "The menu remains above the modal after navigating from a small screen.", "closed", "medium", 9],
  ["Remove stale onboarding checklist item", null, "closed", "low", 10],
  ["Add request ID to server error logs", "Correlate client reports with the request handling logs.", "in_progress", "medium", 10],
  ["Clarify permissions in team settings", "Explain which roles can invite members and change access.", "open", "low", 11],
  ["CSV export omits closed tickets", "The export applies the default open status filter unexpectedly.", "open", "high", 12],
  ["Improve test fixture cleanup", "Make the shared test setup report which tables it resets.", "closed", "low", 12],
  ["Use consistent button focus styles", null, "in_progress", "medium", 13],
  ["Handle 404 from deleted linked project", "Display a useful message when a ticket references a removed project.", "open", "medium", 13],
  ["Review dependency security alerts", "Check the pending patch updates and schedule any required upgrades.", "closed", "low", 13],
] as const;

function databaseName(connectionString: string): string {
  const url = new URL(connectionString);
  return decodeURIComponent(url.pathname.replace(/^\//, ""));
}

async function seed(): Promise<void> {
  const env = await loadRootEnv();
  const connectionString = env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in the root .env");
  }

  process.env.DATABASE_URL = connectionString;
  const { pool } = await import("./pool.js");
  const reset = process.argv.includes("--reset");

  try {
    if (databaseName(connectionString).toLowerCase().endsWith("_test")) {
      throw new Error("Refusing to seed a database whose name ends in _test.");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      if (reset) {
        await client.query("TRUNCATE TABLE tickets");
      } else {
        const result = await client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM tickets");

        if (Number(result.rows[0].count) > 0) {
          throw new Error("The tickets table is not empty; rerun with --reset to replace its data.");
        }
      }

      const insert = `
        INSERT INTO tickets (title, description, status, priority, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `;

      for (const [title, description, status, priority, daysAgo] of tickets) {
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        await client.query(insert, [title, description, status, priority, createdAt]);
      }

      await client.query("COMMIT");
      console.log(`Inserted ${tickets.length} tickets.`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
