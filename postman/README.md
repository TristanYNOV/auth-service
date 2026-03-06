# Postman kit - auth-service (RBAC)

## Fichiers

- `auth-service.user.postman_collection.json`
- `auth-service.admin.postman_collection.json`
- `auth-service.local.postman_environment.json`

## Environment minimal

- `useTraefik` (`true`|`false`)
- `baseUrlTraefik` (`http://localhost/api/auth`)
- `baseUrlDirect` (`http://localhost:3000`)
- `adminEmail`
- `adminPassword`

Chaque collection calcule `baseUrl` automatiquement en pre-request selon `useTraefik`.

## Collection USER

- Pre-request de collection
  - calcule `baseUrl`
  - injecte `Authorization: Bearer <accessTokenUser>` si présent
- `Login User` tests
  - stocke `accessTokenUser`
  - décode JWT et stocke `userId=sub`, `userRoles`
- `Me` tests
  - assert `200`
  - assert absence de champ `password`

## Collection ADMIN

- Pre-request de collection
  - calcule `baseUrl`
  - injecte `Authorization: Bearer <accessTokenAdmin>` si présent
- `Admin Login` tests
  - utilise `adminEmail`/`adminPassword` (env)
  - stocke `accessTokenAdmin`
  - vérifie que `roles` contient `admin`
- `Admin List Users`
  - assert `200`
- `Admin List Users - no token (401)`
  - negative test sans token
