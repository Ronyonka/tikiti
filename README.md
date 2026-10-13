# Tikiti

## Setup

Prerequisites: Node 20+ and Docker.

```bash
cp .env.example .env
docker compose up -d
cd server
npm install
npm run migrate
npm run migrate:test
npm run dev
```

## Seed sample data (optional)

After running the migration, seed the development database with sample tickets:

```bash
cd server
npm run seed
npm run seed -- --reset
```

The `--reset` command deletes all existing tickets in the development database before seeding.

Check the server:

```bash
curl http://localhost:3000/health
```

Expected response: `{ "status": "ok" }`.

## API

## Tests

Run the integration tests against the test database:

```bash
cd server
npm test
```

Use `npm run test:watch` for watch mode.

## UI

Run the client in a second terminal:

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite development proxy forwards `/api` requests to the server on port 3000.

## Decisions & Tradeoffs
