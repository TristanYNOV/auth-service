# ROUTES

## Summary

| Method | Path | Auth | Description | Response |
|---|---|---:|---|---|
| GET | `/health` | No | Healthcheck | `{ status: "ok", timestamp? }` |
| POST | `/users` | No | Register user (roles forced to `['user']`) | `UserPublicDto` |
| POST | `/auth/login` | No | Login user/admin | `string` (JWT access token) + `Set-Cookie: refreshToken=...` |
| POST | `/auth/refresh` | Cookie refresh token | Rotate refresh token and mint a new access token | `{ accessToken: string }` |
| POST | `/auth/logout` | Cookie refresh token (optional) | Revoke current refresh session and clear cookie | `{ message: "Logged out" }` |
| GET | `/auth/sessions` | JWT | List active refresh sessions for current user | `SessionDto[]` |
| DELETE | `/auth/sessions/:id` | JWT | Revoke one refresh session owned by current user | `{ message: "Session revoked" }` |
| DELETE | `/auth/sessions` | JWT | Revoke all active refresh sessions for current user (logout all devices) | `{ message: "Logged out" }` |
| GET | `/me` | JWT + role `user` | Current user profile (self) | `UserPublicDto` |
| PATCH | `/me` | JWT + role `user` | Update current user (self) | `UserPublicDto` |
| DELETE | `/me` | JWT + role `user` | Delete current user (self) | `{ user: UserPublicDto, message }` |
| GET | `/admin/users` | JWT + role `admin` | List users | `UserPublicDto[]` |
| PATCH | `/admin/users/:id` | JWT + role `admin` | Update user by id | `UserPublicDto` |
| DELETE | `/admin/users/:id` | JWT + role `admin` | Delete user by id | `{ user: UserPublicDto, message }` |

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

### `LoginResponse`

Response body is a JSON string containing only the access JWT:

```json
"<jwt-access-token>"
```

### `RefreshResponse`

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

## Removed routes (expected 404)

- `GET /users`
- `GET /users/searchId/:id`
- `GET /users/searchPseudo/:pseudo`
- `GET /users/searchEmail/:email`
- `PATCH /users/:id`
- `DELETE /users/:id`
