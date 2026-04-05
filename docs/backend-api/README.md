# Backend API Contracts

These documents turn the current frontend data contracts into backend-facing API specs.

Source of truth used for this documentation:

- adapter-backed modules under `src/features/*/services/*ApiAdapter.ts`
- feature entity types under `src/features/*/types`
- service-only modules where the backend contract is still inferred from frontend usage

## Contract Status

- `Adapter-backed`: the path and method already exist in frontend adapters and should be kept exactly as documented.
- `Service-derived`: the frontend still runs on mocks/local services, so the endpoint is recommended for backend implementation and derived from current types and service signatures.

## Common Conventions

### Authentication

Use bearer auth for all protected endpoints.

```http
Authorization: Bearer <access-token>
```

### Response Envelope

Current adapters support either raw JSON or an envelope:

```ts
type ApiEnvelope<T> = {
  data?: T;
  error?: string;
  message?: string;
};
```

Recommended backend behavior:

- success: return either `T` or `{ data: T }`
- failure: return `{ error: string, message?: string }`

### IDs, Dates, and Scoping

- Use stable `UUID` values for internal identifiers.
- Keep human-readable codes optional (`student_id`, `code`, `name`).
- Use ISO dates:
  - date only: `YYYY-MM-DD`
  - timestamp: ISO 8601 string
- Academic data should usually be scoped by `academicYearId`, `yearId`, `termId`, or both.
- Multi-school support should use `schoolId` in storage even if the first release is single-school.

### Files

- JSON endpoints use `Content-Type: application/json`.
- Upload endpoints use `multipart/form-data`.
- Store file metadata in DB and the binary itself in object storage or file storage.

### Pagination

The current frontend mostly expects full arrays, not paginated responses. For V1, returning arrays is the safest contract.

## Feature Docs

- [dashboard.md](./dashboard.md)
- [admissions.md](./admissions.md)
- [students-guardians.md](./students-guardians.md)
- [academics.md](./academics.md)
- [attendance.md](./attendance.md)
- [grades.md](./grades.md)
- [reinforcement.md](./reinforcement.md)
- [settings.md](./settings.md)

## Database Starter

- [postgresql-schema.sql](./postgresql-schema.sql)

This starter schema translates the documented backend contracts into a normalized PostgreSQL structure.
Use it as the base for your first migration set, then refine constraints and seed data once the backend stack is chosen.
