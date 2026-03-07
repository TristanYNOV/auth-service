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
  - Me (GET/PATCH/DELETE)
- Folder `Admin`
  - Admin - Login
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
  - validates `iss` / `aud` only if present in token and expected env values are set
- Admin - Login tests:
  - stores `accessTokenAdmin`
  - asserts `roles` contains `admin`
  - asserts JWT header `alg === HS256`
- Admin access tests:
  - assert status and stable error contract shape for `401` and `403`
