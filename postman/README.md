# Postman kit - auth-service (P0)

## Fichiers

- `auth-service.postman_collection.json`
- `auth-service.local.postman_environment.json`

## Variables

- `useTraefik` (`true`|`false`)
- `baseUrlTraefik` (`http://localhost/api/auth`)
- `baseUrlDirect` (`http://localhost:3000`)
- `baseUrl` (calculée automatiquement)
- `userPseudo`, `userEmail`, `userPassword`
- `accessTokenUser`
- `createdUserId`
- `userId` (depuis `payload.sub`)

## Scripts inclus

- Collection pre-request:
  - calcule `baseUrl` selon `useTraefik`
  - injecte `Authorization: Bearer {{accessTokenUser}}` si présent
- Register pre-request:
  - génère `userPseudo`, `userEmail`, `userPassword` uniques
- Register tests:
  - enregistre `createdUserId`
  - vérifie l'absence de `password`
- Login tests:
  - enregistre le token dans `accessTokenUser`
  - décode le JWT et enregistre `userId = payload.sub`, `userEmail`, `userPseudo`
- Me tests:
  - vérifient le code 200
  - vérifient l'absence de `password`

## Ordre runner

1. `Health`
2. `Register`
3. `Login`
4. `Me - Get`
5. `Me - Patch`
6. `Me - Delete`
