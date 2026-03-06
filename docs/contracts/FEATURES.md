# FEATURES

## Implemented

### Public
- `GET /health`
- `POST /users` (register, always creates roles=`['user']`)
- `POST /auth/login`

### Protected (JWT + role `user`)
- `GET /me`
- `PATCH /me`
- `DELETE /me`

### Protected (JWT + role `admin`)
- `GET /admin/users`
- `PATCH /admin/users/:id`
- `DELETE /admin/users/:id`

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

## JWT contract

JWT payload includes:
- `sub`
- `email`
- `pseudo`
- `roles`
- `iat`
- `exp`

## Login failure message

`POST /auth/login` returns 401 with this exact message for invalid email or password:
- `Unauthorized: invalid credentials or user not found.`
