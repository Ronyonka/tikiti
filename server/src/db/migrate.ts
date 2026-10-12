import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const rootDirectory = path.resolve(process.cwd(), "..");
const migrationsDirectory = path.join(rootDirectory, "server", "migrations");

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

async function migrate(): Promise<void> {
  const env = await loadRootEnv();
  const variableName = process.argv.includes("--test") ? "TEST_DATABASE_URL" : "DATABASE_URL";
  const connectionString = env[variableName];

  if (!connectionString) {
    throw new Error(`${variableName} is not set in the root .env`);
  }

  const pool = new Pool({ connectionString });

  try {
    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = await readFile(path.join(migrationsDirectory, file), "utf8");
      await pool.query(sql);
      console.log(`Applied ${file}`);
    }
  } finally {
    await pool.end();
  }
}

migrate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
