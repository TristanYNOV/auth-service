# Postman kit - auth-service

## Files

- `auth-service.postman_collection.json` (single collection)
- `env.direct.json`
- `env.traefik.json`

## Collection structure

- Folder `User`
  - Health
  - Register
  - Login (user)
  - Refresh
  - Logout
  - Sessions (GET)
  - Session revoke by id (DELETE)
  - Sessions revoke all (DELETE)
  - Refresh after logout all (expect 401)
  - Refresh after Logout (expect 401)
  - Me (GET/PATCH/DELETE)
- Folder `Admin`
  - Admin - Login
  - Admin - Refresh
  - Admin - Logout
  - Admin - List Users
  - Admin - Patch User
  - Admin - Delete User
  - Admin - User tries admin (expect 403)
  - Admin - No token (expect 401)

## Environment variables

Both environments include:
- `useTraefik`
- `baseUrlTraefik`
- `baseUrlDirect`
- `adminEmail`
- `adminPassword`
- `jwtIssuer` (optional)
- `jwtAudience` (optional)

Defaults are aligned with `.env.example`.

## Scripts

- Collection pre-request:
  - computes `baseUrl` from `useTraefik`
  - auto-injects bearer token
    - `Admin - ...` requests use `accessTokenAdmin`
    - all others use `accessTokenUser`
- Register pre-request:
  - randomizes `userEmail`, `userPseudo`, `userPassword`
- Login (user) tests:
  - stores `accessTokenUser`
  - decodes header/payload and stores `userId = sub`
  - asserts JWT header `alg === HS256`
- Sessions (GET) tests:
  - validates response status and array shape
  - stores `sessionId` from first active session for `DELETE /auth/sessions/:id`
  - asserts `refreshTokenHash` is never present
- Refresh tests:
  - read `{ accessToken }` JSON response
  - overwrite `accessTokenUser` / `accessTokenAdmin`
- Cookie jar:
  - HttpOnly cookie `refreshToken` is used automatically by Postman
  - no script tries to read the refresh cookie value

## Suggested scenario (User)

1. Login (user)
2. Sessions (GET)
3. Sessions revoke all (DELETE)
4. Refresh after logout all (expect 401)
