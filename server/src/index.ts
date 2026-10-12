import { readFile } from "node:fs/promises";
import path from "node:path";

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

async function loadRootEnv(): Promise<void> {
  const rootDirectory = path.resolve(process.cwd(), "..");
  let contents = "";

  try {
    contents = await readFile(path.join(rootDirectory, ".env"), "utf8");
  } catch (error: unknown) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  Object.assign(process.env, parseEnv(contents));

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in the root .env");
  }
}

async function start(): Promise<void> {
  await loadRootEnv();
  const { app } = await import("./app.js");
  const port = Number(process.env.PORT ?? 3000);

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
