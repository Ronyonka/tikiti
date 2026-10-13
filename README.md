# Tikiti

Tikiti is a small ticket tracker with a REST API and a single-page web UI.
It uses Node, Express, TypeScript, Postgres 16 in Docker, and React with Vite.

## Prerequisites

- Node.js 20 or newer
- Docker and Docker Compose
- Ports 3000 (API), 5173 (UI), and 5432 (Postgres) available

## Setup

Run the following from a fresh clone. The server and client run in two terminals.

1. Clone the repository:

   ```bash
   git clone <repository-url> tikiti
   cd tikiti
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env
   ```

3. Start Postgres:

   ```bash
   docker compose up -d
   ```

4. In the first terminal, install server dependencies, migrate both databases, and start the API:

   ```bash
   cd server
   npm install
   npm run migrate
   npm run migrate:test
   npm run dev
   ```

   Check the API:

   ```bash
   curl http://localhost:3000/health
   ```

   Expected response:

   ```json
   { "status": "ok" }
   ```

5. In a second terminal, from the repository root, install client dependencies and start the UI:

   ```bash
   cd client
   npm install
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173).

## Seed sample data (optional)

From `/server`, seed the development database only when it is empty:

```bash
npm run seed
```

To delete all development tickets and reseed:

```bash
npm run seed -- --reset
```

The seed script never touches the test database. Without `--reset`, it refuses to run when the development table is not empty.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/tickets` | Create a ticket |
| GET | `/tickets` | List tickets with optional filtering and pagination |
| PATCH | `/tickets/:id` | Update a ticket's status and/or priority |
| GET | `/tickets/stats` | Count tickets by status |

### POST /tickets

Accepts a JSON body with:

- `title`: required string, trimmed, 1 to 200 characters
- `description`: optional string or `null`
- `status`: optional `open`, `in_progress`, or `closed`; defaults to `open`
- `priority`: optional `low`, `medium`, or `high`; defaults to `medium`

Returns `201` with the created ticket. `id` is a UUID and `created_at` is set by the database.

```bash
curl -X POST http://localhost:3000/tickets \
  -H 'Content-Type: application/json' \
  -d '{"title":"Deploy release","description":"Deploy the reviewed release to production.","status":"in_progress","priority":"high"}'
```

```json
{
  "id": "2f4f7c5b-6d31-4d0c-9f25-0a8f8b7d3d42",
  "title": "Deploy release",
  "description": "Deploy the reviewed release to production.",
  "status": "in_progress",
  "priority": "high",
  "created_at": "2026-10-13T08:30:00.000Z"
}
```

### GET /tickets

Accepts these query parameters:

- `status`: optional `open`, `in_progress`, or `closed`
- `page`: optional positive integer, default `1`
- `limit`: optional integer from `1` to `100`, default `20`

Invalid values return `400`; they are not clamped. Returns `200` with `{ data, page, limit, total }`, ordered newest first by `created_at`, then by `id`.

```bash
curl 'http://localhost:3000/tickets?status=open&page=1&limit=20'
```

```json
{
  "data": [
    {
      "id": "2f4f7c5b-6d31-4d0c-9f25-0a8f8b7d3d42",
      "title": "Open ticket",
      "description": null,
      "status": "open",
      "priority": "medium",
      "created_at": "2026-10-13T08:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

### PATCH /tickets/:id

The `id` must be a UUID. The JSON body must contain at least one of these editable fields and rejects all other fields:

- `status`: `open`, `in_progress`, or `closed`
- `priority`: `low`, `medium`, or `high`

Returns `200` with the updated ticket, or `404` when the UUID is valid but unknown.

```bash
curl -X PATCH http://localhost:3000/tickets/2f4f7c5b-6d31-4d0c-9f25-0a8f8b7d3d42 \
  -H 'Content-Type: application/json' \
  -d '{"status":"closed","priority":"high"}'
```

```json
{
  "id": "2f4f7c5b-6d31-4d0c-9f25-0a8f8b7d3d42",
  "title": "Open ticket",
  "description": null,
  "status": "closed",
  "priority": "high",
  "created_at": "2026-10-13T08:30:00.000Z"
}
```

### GET /tickets/stats

Accepts no parameters. Returns `200` with numeric counts for all statuses, including zero-count statuses.

```bash
curl http://localhost:3000/tickets/stats
```

```json
{ "open": 2, "in_progress": 1, "closed": 3 }
```

### Errors

Errors use the standard `{ error, details }` shape. Validation details contain `field` and `message`.

```json
{
  "error": "Invalid request body",
  "details": [
    { "field": "title", "message": "Too small: expected string to have >=1 characters" }
  ]
}
```

The API uses these status codes:

- `200` successful reads and updates
- `201` successful ticket creation
- `400` invalid input or malformed JSON
- `404` unknown ticket UUID on update
- `500` unexpected server errors

## Tests

Docker must be running, and the test database must be migrated before running the integration tests:

```bash
cd server
npm run migrate:test
npm test
```

For watch mode:

```bash
npm run test:watch
```

The suite covers health checks, ticket creation, listing and pagination, status filtering, updates, validation, not-found handling, and status statistics against the real Postgres test database.

## UI

The UI offers a ticket list with status and priority badges, status statistics tiles, a status filter, page-size selection, pagination, a New ticket modal, and inline status and priority editing. The Vite development proxy forwards `/api` to the API on port 3000 and strips the `/api` prefix.

## Project structure

```text
.
├── .env.example
├── .gitignore
├── README.md
├── docker-compose.yml
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
└── server/
    ├── package.json
    ├── migrations/
    ├── src/
    │   ├── db/
    │   ├── handlers/
    │   └── routes/
    └── tests/
```

## Decisions & Tradeoffs

I chose Node, Express, and strict TypeScript for a small HTTP service, with Postgres 16 in Docker and React with Vite for the client. I used Postgres `CHECK` constraints instead of native enums so the allowed values stay explicit while future migrations remain simpler. I used `pg` directly instead of an ORM to keep the SQL visible and limit the server layering to routes, handlers, and data access. I validate request bodies, parameters, and query strings with zod, reject unknown fields, and return `{ error, details }` for validation, malformed JSON, and server errors. I paginate with `page` and `limit`, order by `created_at DESC, id DESC`, and use `id` as the tiebreaker when timestamps match. I return `400` for invalid pagination values instead of silently clamping them. I use the Vite development proxy instead of CORS, while a production deployment will need a reverse proxy or CORS configuration. The migration script selects `DATABASE_URL` or `TEST_DATABASE_URL` with `--test`, reads all `.sql` files in sorted order, and executes every file each time; it does not track applied migrations in a migration table. I added the development-only seed script beyond the API requirements for reviewer convenience, with a guard against test databases. I used OpenAI Codex as a coding assistant and reviewed all changes.

### With more time

- Add a priority filter using the existing enum, a shared `WHERE` clause for list and count, and a second toolbar select
- Add authentication
- Allow editing titles and descriptions
- Allow deleting tickets
- Add a production build with a reverse proxy or CORS
- Add CI
- Deploy a demo
