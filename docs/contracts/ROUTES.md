# ROUTES

## Summary

| Method | Path | Auth | Description | Response |
|---|---|---:|---|---|
| GET | `/health` | No | Healthcheck | `{ status: "ok", timestamp? }` |
| POST | `/users` | No | Register user | `UserPublicDto` |
| POST | `/auth/login` | No | Login user | `string` (JWT) |
| GET | `/me` | Yes | Current user profile (self) | `UserPublicDto` |
| PATCH | `/me` | Yes | Update current user (self) | `UserPublicDto` |
| DELETE | `/me` | Yes | Delete current user (self) | `{ user: UserPublicDto, message }` |
| GET | `/users` | No (legacy) | List users (temporary) | `UserPublicDto[]` |
| GET | `/users/searchId/:id` | No (legacy) | Get user by id (temporary) | `UserPublicDto` |
| GET | `/users/searchPseudo/:pseudo` | No (legacy) | Get user by pseudo (temporary) | `UserPublicDto` |
| GET | `/users/searchEmail/:email` | No (legacy) | Get user by email (temporary) | `UserPublicDto` |
| PATCH | `/users/:id` | No (legacy) | Update user by id (temporary) | `UserPublicDto` |
| DELETE | `/users/:id` | No (legacy) | Delete user by id (temporary) | `{ user: UserPublicDto, message }` |

Removed route: `GET /auth/test`.

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

`string` (JWT token only)

### `PATCH /me` request

```json
{
  "pseudo": "newPseudo",
  "email": "new@example.com",
  "password": "StrongPass2!"
}
```

All fields are optional; if provided, `password` is re-hashed server-side.

## JWT usage for other services

- Validate JWT before trusting identity.
- Canonical user id: `req.user.sub`.
- Do not send user id in request body/query when JWT is available.
- JWT claims contract for downstream services:
  - `sub` (`string`)
  - `email` (`string`)
  - `pseudo` (`string`)
  - `iat` (`number`)
  - `exp` (`number`)
