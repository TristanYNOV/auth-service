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

## Environment variables

Both environments include:
- `useTraefik`
- `baseUrlTraefik`
- `baseUrlDirect`
- `adminEmail`
- `adminPassword`

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
  - decodes payload and stores `userId = sub`
- Admin - Login tests:
  - stores `accessTokenAdmin`
  - decodes payload and stores `adminUserId = sub`
  - asserts `roles` contains `admin`
