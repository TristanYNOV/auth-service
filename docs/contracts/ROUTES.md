# ROUTES

## Summary

| Method | Path | Auth | Description | Response |
|---|---|---:|---|---|
| GET | `/health` | No | Healthcheck | `{ status: "ok", timestamp? }` |
| POST | `/users` | No | Register user (roles forced to `['user']`) | `UserPublicDto` |
| POST | `/auth/login` | No | Login user/admin | `TokenResponse` + `Set-Cookie: refreshToken=...` |
| POST | `/auth/refresh` | Cookie refresh token | Rotate refresh token and mint a new access token | `TokenResponse` |
| POST | `/auth/logout` | Cookie refresh token (optional) | Revoke current refresh session and clear cookie | `LogoutResponse` |
| GET | `/auth/sessions` | JWT | List active refresh sessions for current user | `SessionDto[]` |
| DELETE | `/auth/sessions/:id` | JWT | Revoke one refresh session owned by current user | `{ message: "Session revoked" }` |
| DELETE | `/auth/sessions` | JWT | Revoke all active refresh sessions for current user (logout all devices) | `{ message: "Logged out" }` |
| GET | `/me` | JWT + role `user` | Current user profile (self) | `UserPublicDto` |
| PATCH | `/me` | JWT + role `user` | Update current user (self) | `UserPublicDto` |
| DELETE | `/me` | JWT + role `user` | Delete current user (self) | `{ user: UserPublicDto, message }` |
| GET | `/admin/users` | JWT + role `admin` | List users | `UserPublicDto[]` |
| PATCH | `/admin/users/:id` | JWT + role `admin` | Update user by id | `UserPublicDto` |
| DELETE | `/admin/users/:id` | JWT + role `admin` | Delete user by id | `{ user: UserPublicDto, message }` |

## Request contracts (frontend reference)

### `POST /users`

Creates a standard user account.

Request body (`application/json`):

```json
{
  "pseudo": "coach42",
  "email": "coach42@example.com",
  "password": "StrongPass1!"
}
```

Field-level contract:

| Field | Type | Required | Constraints useful for frontend |
|---|---|---:|---|
| `pseudo` | `string` | Yes | Must be non-empty. |
| `email` | `string` | Yes | Must be a valid email format. Must be unique. |
| `password` | `string` | Yes | Must match the backend password policy documented below. |

Notes:
- Any client-provided `roles` field is ignored by backend. Created users are always `['user']`.

### `POST /auth/login`

Authenticates user/admin and creates a refresh session.

Request body (`application/json`):

```json
{
  "email": "coach42@example.com",
  "password": "StrongPass1!"
}
```

Field-level contract:

| Field | Type | Required | Constraints useful for frontend |
|---|---|---:|---|
| `email` | `string` | Yes | Must be a valid email format. |
| `password` | `string` | Yes | Must match the same password validation rules as backend DTO validation. |

Response body (201):

```json
{
  "accessToken": "<jwt-access-token>"
}
```

Implementation note:
- Login response was aligned with refresh response (`TokenResponse`) to avoid front-specific parsing branch.

## Password policy (backend-enforced)

Current backend validators (`IsStrongPassword({ minLength: 8, minUppercase: 1, minNumbers: 1 })`) enforce:

- Minimum length: `8`
- Maximum length: no explicit backend max
- At least `1` uppercase letter
- At least `1` lowercase letter
- At least `1` number
- At least `1` special character/symbol
- Spaces: not required and not recommended for MVP forms (frontend can choose to forbid spaces to keep UX predictable)

Validation error message (default class-validator):
- `password is not strong enough`

## Cookie contract

Cookie name: `refreshToken`
- `HttpOnly`
- `SameSite=Lax`
- `Secure` only in production (`NODE_ENV=production`)
- `Path=/auth`
- Max-Age = 30 days

## Session model contracts

### `SessionDto`

```json
{
  "id": "6750d39841f6fa572ff14549",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "expiresAt": "2026-01-31T10:00:00.000Z",
  "revokedAt": null,
  "lastUsedAt": "2026-01-02T11:00:00.000Z",
  "userAgent": "Mozilla/5.0"
}
```

Security note:
- `refreshTokenHash` is never exposed in API responses.

## Session cap

- `MAX_SESSIONS_PER_USER` controls maximum concurrent active refresh sessions per user.
- Default value: `10`.
- Enforcement point: each new refresh session creation (`/auth/login` and `/auth/refresh`).
- If the cap is exceeded, oldest active sessions are revoked first (`createdAt` ascending).

## DTO contracts

### `UserPublicDto`

```json
{
  "id": "6750d39841f6fa572ff14549",
  "pseudo": "coach42",
  "email": "coach42@example.com"
}
```

### `TokenResponse`

```json
{
  "accessToken": "<jwt-access-token>"
}
```

### `LogoutResponse`

```json
{
  "message": "Logged out"
}
```

### `PATCH /me` request

```json
{
  "pseudo": "newPseudo",
  "email": "new@example.com",
  "password": "StrongPass2!"
}
```

All fields are optional; if provided, `password` is re-hashed server-side.

## Error contracts

Global error response format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "email must be an email",
  "timestamp": "2026-03-23T12:00:00.000Z",
  "path": "/auth/login"
}
```

### 400 — Validation error

- Status: `400 Bad Request`
- Trigger: DTO validation fails (`/users`, `/auth/login`, `/me`, `/admin/users/:id` updates).
- Realistic `message` examples:
  - `email must be an email`
  - `password is not strong enough`
  - `pseudo should not be empty`

### 401 — Invalid credentials

- Status: `401 Unauthorized`
- Trigger: `POST /auth/login` with unknown email or wrong password.
- Message:
  - `Unauthorized: invalid credentials or user not found.`

### 401 — Refresh failed (missing/invalid/expired/revoked)

- Status: `401 Unauthorized`
- Trigger and messages:
  - Missing cookie on `POST /auth/refresh`: `Missing refresh token cookie.`
  - Unknown/revoked/expired refresh token: `Invalid or expired refresh token.`
  - Refresh token points to deleted user: `User linked to refresh token not found.`

### 403 — Forbidden

- Status: `403 Forbidden`
- Trigger:
  - Accessing `/admin/*` with authenticated non-admin user.
  - Revoking another user session via `DELETE /auth/sessions/:id`.
- Realistic message:
  - `Forbidden resource`

### 404 — Not found

- Status: `404 Not Found`
- Trigger examples:
  - `/me` for a deleted user: `User not found`
  - `/admin/users/:id` for missing user: `User not found`
  - Removed legacy routes listed below.

### 409 — Duplicate email

- Status: `409 Conflict`
- Trigger:
  - `POST /users` with existing email
  - `PATCH /me` or `PATCH /admin/users/:id` when changing email to an already-used one
- Message:
  - `Email already in use.`

## Auth/session integration notes (Angular MVP)

- Refresh token is **never** returned in JSON body.
- Refresh token is transported only via **HttpOnly cookie** (`refreshToken`).
- Front should call `POST /auth/refresh` to restore a session and get a new access token.
- `GET /me` is the source of truth for connected user profile in the user app.
- MVP front should not depend on role claims for UI/business behavior.
- Because cookie path is `Path=/auth`, browser only attaches refresh cookie to `/auth/*` routes.

## Removed routes (expected 404)

- `GET /users`
- `GET /users/searchId/:id`
- `GET /users/searchPseudo/:pseudo`
- `GET /users/searchEmail/:email`
- `PATCH /users/:id`
- `DELETE /users/:id`
