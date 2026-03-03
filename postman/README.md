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
  - nettoie automatiquement les formats invalides courants:
    - token préfixé par `Bearer `
    - token entouré de guillemets (`"..."`)
- Register pre-request
  - génère des valeurs aléatoires pertinentes via variables dynamiques Postman:
    - `{{$randomEmail}}`, `{{$randomPassword}}`, `{{$randomUserName}}`, `{{$randomFirstName}}`, `{{$randomLastName}}`
  - renforce le mot de passe généré (`+ A1!`)
  - stocke les valeurs en `collectionVariables`
- SignIn test script
  - sauvegarde le JWT nettoyé dans `accessTokenUser`
  - vérifie que le token est bien un JWT utilisable (3 segments)
  - décode le payload JWT et sauvegarde `userId = sub`, `auth_email`, `auth_pseudo`
- Me - Get test script
  - logge le header `Authorization` envoyé
  - logge `accessTokenUser` masqué
  - échoue explicitement si le header `Authorization` est absent/mal formé
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
