# Postman kit - auth-service (P0)

## Fichiers

- `auth-service.postman_collection.json`
- `auth-service.local.postman_environment.json`

## Variables principales

- `useTraefik` (`true`|`false`)
- `baseUrlTraefik` (`http://localhost/api/auth`)
- `baseUrlDirect` (`http://localhost:3000`)
- `baseUrl` (calculée automatiquement)
- `auth_email`, `auth_password`, `auth_pseudo`
- `first_name`, `last_name`
- `accessTokenUser`, `userId`, `createdUserId`

## Scripts (orientés parcours utilisateur)

- Collection pre-request
  - calcule `baseUrl` selon `useTraefik`
  - injecte automatiquement `Authorization: Bearer ...` si token présent
- Register pre-request
  - génère des valeurs aléatoires pertinentes via variables dynamiques Postman:
    - `{{$randomEmail}}`, `{{$randomPassword}}`, `{{$randomUserName}}`, `{{$randomFirstName}}`, `{{$randomLastName}}`
  - renforce le mot de passe généré (`+ A1!`)
  - stocke les valeurs en `collectionVariables`
- SignIn script
  - sauvegarde le JWT brut dans `accessTokenUser`
  - décode le payload JWT et sauvegarde `userId = sub`, `auth_email`, `auth_pseudo`
- Session - Logout (clear token)
  - supprime `accessTokenUser` et `userId` pour simuler une déconnexion

## Parcours recommandé

1. `Health`
2. `Register`
3. `SignIn`
4. `Me - Get`
5. `Me - Patch`
6. `Me - Delete`
7. `Session - Logout (clear token)`

> Les assertions de tests ont été retirées pour privilégier des scripts utilitaires centrés sur le parcours utilisateur.
