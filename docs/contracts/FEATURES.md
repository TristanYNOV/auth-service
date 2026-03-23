# FEATURES

## Implemented

### Public
- `GET /health`
- `POST /users` (register, always creates roles=`['user']`)
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Protected (JWT + role `user`)
- `GET /me`
- `PATCH /me`
- `DELETE /me`

### Protected (JWT, self session management)
- `GET /auth/sessions`
- `DELETE /auth/sessions/:id`
- `DELETE /auth/sessions` (logout all devices)

### Protected (JWT + role `admin`)
- `GET /admin/users`
- `PATCH /admin/users/:id`
- `DELETE /admin/users/:id`

## Session model (P2)

- Access token TTL: **15 minutes**.
- Refresh token TTL: **30 days**.
- Refresh token format: **opaque random token** (not JWT), never returned in body.
- Refresh transport: cookie `refreshToken` with:
  - `HttpOnly: true`
  - `SameSite: Lax`
  - `Secure: true` only when `NODE_ENV=production`
  - `Path: /auth`
- Rotation on each `POST /auth/refresh`:
  - old refresh session is revoked (`revokedAt`)
  - new refresh session is created (`rotatedFromHash` references old hash)
  - the new session gets `lastUsedAt=now` on successful refresh
- Multi-device supported: one refresh session per login/device.
- Session cap: `MAX_SESSIONS_PER_USER` (default `10`). If exceeded on login/refresh rotation, the oldest active sessions (`createdAt` ascending) are revoked to get back under the cap.

## RefreshSession persistence

Collection: `RefreshSession`
- `userId`
- `refreshTokenHash` (unique, hashed with SHA-256)
- `createdAt`
- `expiresAt`
- `revokedAt?`
- `rotatedFromHash?`
- `userAgent?`
- `lastUsedAt?`
- `deviceLabel?` (optional MVP field)

Storage notes:
- `userAgent` is stored.
- **IP address is not stored**.

## Security model

- User document includes `roles: ('user' | 'admin')[]`.
- Registration ignores any client-provided `roles` and forces `['user']` server-side.
- `/admin/*` is fail-closed with RBAC (`RolesGuard`):
  - no token => 401
  - user token => 403
  - admin token => 200
- `/me` is user-only.
- Legacy `/users` read/update/delete routes were removed to reduce attack surface.

## Unique admin bootstrap (always active)

On startup:
- if admin count = `1`: keep running
- if admin count = `0`: create admin from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PSEUDO` (`admin` by default)
- if admin count `> 1`: fail-fast with:
  - `Invalid state: multiple admin users found. Expected exactly one.`

Rules:
- no promote endpoint
- no automatic promotion
- existing admin is never overwritten/reset from `.env`

## Login failure message

`POST /auth/login` returns 401 with this exact message for invalid email or password:
- `Unauthorized: invalid credentials or user not found.`

## Token response contract

- `POST /auth/login` and `POST /auth/refresh` both return:
  - `{ "accessToken": "<jwt-access-token>" }`
- This alignment avoids a frontend-specific branch between login and refresh flows.

## Duplicate email conflict

- `POST /users`, `PATCH /me`, and `PATCH /admin/users/:id` return `409` when email is already used.
- Message:
  - `Email already in use.`

## Sessions API safety

- Session listing endpoints never expose `refreshTokenHash` or raw refresh tokens.
- Returned session shape includes only: `id`, `createdAt`, `expiresAt`, `revokedAt`, `lastUsedAt`, `userAgent`.
