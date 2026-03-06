# FEATURES

## Implemented (P0)

### Public
- `GET /health`
- `POST /auth/login`
- `POST /users` (register, roles forced to `['user']`)

### Protected (JWT, self-service)
- `GET /me`
- `PATCH /me`
- `DELETE /me`

### Admin (JWT + RBAC)
- `GET /admin/users`
- `PATCH /admin/users/:id`
- `DELETE /admin/users/:id`

### Legacy `/users` routes (hardened)
- `GET /users` (admin-only)
- `GET /users/searchId/:id` (admin-only)
- `GET /users/searchPseudo/:pseudo` (admin-only)
- `GET /users/searchEmail/:email` (admin-only)
- `PATCH /users/:id` (admin or self)
- `DELETE /users/:id` (admin or self)

## Security and RBAC

- `password` is never returned by API responses.
- Public user output contract is sanitized through `UserPublicDto`:
  - `id`
  - `pseudo`
  - `email`
  - `roles`
- RBAC roles available:
  - `user`
  - `admin`
- Access model:
  - Standard user: self-only operations (`/me`, and own `/users/:id` patch/delete)
  - Admin user: admin endpoints + user management operations

## Admin bootstrap via environment (Option A)

At startup, admin bootstrap is idempotent and controlled by env vars:
- `ADMIN_EMAIL` (required for bootstrap)
- `ADMIN_PASSWORD` (required for bootstrap)
- `ADMIN_PSEUDO` (optional)
- `ADMIN_BOOTSTRAP_ENABLED` (optional, default enabled; `"false"` disables)

Behavior:
- If disabled: no-op (logged).
- If enabled and admin email not found: create admin user with hashed password and `roles=['admin']`.
- If enabled and admin email exists: ensure `admin` role is present and sync bootstrap credentials (password/pseudo) with env values for deterministic admin login.
- If `ADMIN_EMAIL` or `ADMIN_PASSWORD` is missing, bootstrap is skipped with a warning log.
- Secret values (password/token) are never logged.

## JWT contract (source of truth)

- Bearer format: `Authorization: Bearer <token>`.
- Canonical identity claim: `sub` (`string`).
- Guaranteed claims in access token payload:
  - `sub`
  - `email`
  - `pseudo`
  - `roles`
  - `iat`
  - `exp`
- `_id` is not part of JWT payload contract.
- Refresh token is out of scope for this P0.
