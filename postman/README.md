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
- Refresh tests:
  - read `{ accessToken }` JSON response
  - overwrite `accessTokenUser` / `accessTokenAdmin`
- Cookie jar:
  - HttpOnly cookie `refreshToken` is used automatically by Postman
  - no script tries to read the refresh cookie value

## Suggested scenario (User)

1. Login (user)
2. Me (GET)
3. Refresh
4. Me (GET)
5. Logout
6. Refresh (expect 401)
