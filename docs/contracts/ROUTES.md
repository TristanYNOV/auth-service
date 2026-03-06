# ROUTES

## Summary

| Method | Path | Access | Description | Response |
|---|---|---|---|---|
| GET | `/health` | Public | Healthcheck | `{ status: "ok", timestamp? }` |
| POST | `/users` | Public | Register user (`roles` forced to `['user']`) | `UserPublicDto` |
| POST | `/auth/login` | Public | Login user | `string` (JWT) |
| GET | `/me` | Authenticated (Self) | Current user profile | `UserPublicDto` |
| PATCH | `/me` | Authenticated (Self) | Update current user | `UserPublicDto` |
| DELETE | `/me` | Authenticated (Self) | Delete current user | `{ user: UserPublicDto, message }` |
| GET | `/admin/users` | Admin | List users | `UserPublicDto[]` |
| PATCH | `/admin/users/:id` | Admin | Update user by id | `UserPublicDto` |
| DELETE | `/admin/users/:id` | Admin | Delete user by id | `{ user: UserPublicDto, message }` |
| GET | `/users` | Admin | List users (legacy endpoint, hardened) | `UserPublicDto[]` |
| GET | `/users/searchId/:id` | Admin | Get user by id (legacy endpoint, hardened) | `UserPublicDto` |
| GET | `/users/searchPseudo/:pseudo` | Admin | Get user by pseudo (legacy endpoint, hardened) | `UserPublicDto` |
| GET | `/users/searchEmail/:email` | Admin | Get user by email (legacy endpoint, hardened) | `UserPublicDto` |
| PATCH | `/users/:id` | Admin or Self | Update user by id | `UserPublicDto` |
| DELETE | `/users/:id` | Admin or Self | Delete user by id | `{ user: UserPublicDto, message }` |

Removed route: `GET /auth/test`.

## DTO contracts

### `UserPublicDto`

```json
{
  "id": "6750d39841f6fa572ff14549",
  "pseudo": "coach42",
  "email": "coach42@example.com",
  "roles": ["user"]
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

### `PATCH /admin/users/:id` request

```json
{
  "pseudo": "newPseudo",
  "email": "new@example.com",
  "password": "StrongPass2!",
  "roles": ["admin", "user"]
}
```

All fields are optional.

## JWT usage for other services

- Validate JWT before trusting identity.
- Canonical user id: `req.user.sub`.
- RBAC claims source: `req.user.roles`.
- Do not send user id in request body/query when JWT is available.
- JWT claims contract for downstream services:
  - `sub` (`string`)
  - `email` (`string`)
  - `pseudo` (`string`)
  - `roles` (`Array<'user'|'admin'>`)
  - `iat` (`number`)
  - `exp` (`number`)


## Login errors

`POST /auth/login` can return `401` with:

- `Invalid credentials: user does not exist or provided credentials are incorrect`

This explicitly highlights the two possible causes (unknown user or wrong credentials).
