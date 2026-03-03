# FEATURES

## Implemented (P0)

### Public
- `GET /health`
- `POST /auth/login`
- `POST /users` (register)

### Protected (JWT)
- `GET /me`
- `PATCH /me`
- `DELETE /me`

### Legacy routes still present (temporary)
- `GET /users`
- `GET /users/searchId/:id`
- `GET /users/searchPseudo/:pseudo`
- `GET /users/searchEmail/:email`
- `PATCH /users/:id`
- `DELETE /users/:id`

### Removed
- `GET /auth/test`

## Security and data exposure

- `password` is never returned by API responses.
- Public user output contract is sanitized through `UserPublicDto`:
  - `id`
  - `pseudo`
  - `email`
- `PATCH /me` and `DELETE /me` are self-only and use JWT identity (`req.user.sub`).

## JWT contract (current source of truth)

- Bearer format: `Authorization: Bearer <token>`.
- Canonical identity claim: `sub` (`string`).
- Guaranteed claims in the access token payload:
  - `sub`
  - `email`
  - `pseudo`
  - `iat`
  - `exp`
- `_id` is not included in JWT payload.
- Refresh token is not part of this P0 scope.
