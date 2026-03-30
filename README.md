# Palm Oil Platform UI

Next.js application for the Palm Oil operations platform (inventory, sales, accounting, reconciliation, and CEO dashboards).

## Current Stage
- UI scaffold generated with v0
- Phase 1 foundation in progress (policy config, API skeleton, reusable data client)
- Implementation tracker: `docs/implementation-tracker.md`

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API Skeleton (Phase 1)

Starter endpoints for preview/demo workflows:
- `GET /api/v1/health`
- `GET /api/v1/meta/master-data`
- `GET /api/v1/meta/progress`
- `GET /api/v1/meta/policy`
- `PUT /api/v1/meta/policy`
- `GET /api/v1/dashboard/ceo`
- `GET /api/v1/inventory/purchases`
- `GET /api/v1/accounting/journals`

## Preview Deployment (Coolify)

Use your personal VPS/Coolify for preview while waiting for client-owned infrastructure:
1. Create a new project and app in Coolify from this GitHub repository.
2. Let Coolify auto-detect Next.js build settings.
3. Set environment variable `PORT=3000`.
4. Deploy from `main`.
5. Share preview URL with client for milestone visibility.

When client infrastructure is funded and ready, migrate to client-owned server/domain.
