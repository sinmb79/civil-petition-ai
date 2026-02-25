# Civil Petition AI

Backend foundation for the Civil Petition Decision Support System.

## Tech Stack

- Node.js + TypeScript
- Express API
- Prisma ORM
- PostgreSQL (primary runtime database)
- Jest + Supertest (unit + integration tests)

## Petition CRUD API

- `POST /api/petitions`
- `GET /api/petitions?limit=20&offset=0`
- `GET /api/petitions/:id`
- `PATCH /api/petitions/:id`
- `DELETE /api/petitions/:id`

Validation rules:
- `raw_text`: required, min length 10
- `processing_type`: required

## Database setup (PostgreSQL)

1. Create `.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/civil_petition_ai?schema=public"
```

2. Install dependencies:

```bash
pnpm install
```

3. Generate Prisma client:

```bash
pnpm prisma:generate
```

4. Apply migrations:

```bash
pnpm prisma:migrate
```

5. Run seed scaffold (no data insertion):

```bash
pnpm prisma:seed
```

## Run service

```bash
pnpm dev
```

## Testing

```bash
pnpm test
```

Integration tests use an isolated SQLite database through `database/schema.test.prisma` so tests run without requiring a local PostgreSQL instance.
