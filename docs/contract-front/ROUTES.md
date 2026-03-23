# ROUTES — Contrat HTTP front

## Conventions globales

## Base URL

- Appels front attendus: `/api/auth/...`
- Traefik retire `/api/auth` avant transmission au service.

Exemple:
- Front: `POST /api/auth/auth/login`
- Service: `POST /auth/login`

## Flux auth recommandé

1. Register (si nécessaire): `POST /users`
2. Login: `POST /auth/login` → retourne `{ accessToken }` + cookie refresh HttpOnly
3. Requête protégée: header `Authorization: Bearer <accessToken>`
4. Expiration access token: `POST /auth/refresh` avec cookie
5. Logout: `POST /auth/logout` (session courante) ou `DELETE /auth/sessions` (toutes sessions)

## Register / Login / Me

- Register: crée toujours un utilisateur avec `roles=['user']`.
- Login: accepte email/password et retourne `{ accessToken }`.
- Me: `GET /me` retourne le profil utilisateur connecté.

## Refresh / Logout

- `POST /auth/refresh`: nécessite le cookie `refreshToken`, effectue une rotation, retourne `{ accessToken }`.
- `POST /auth/logout`: révoque la session courante liée au cookie et nettoie le cookie.
- `DELETE /auth/sessions`: révoque toutes les sessions actives de l’utilisateur.

## Format du token

- Access token: JWT signé HS256.
- Claims utiles: `sub`, `email`, `pseudo`, `roles`.
- Claims optionnels si configurés infra: `iss`, `aud`.

## Cookie refresh

- Nom: `refreshToken`
- `HttpOnly: true`
- `SameSite: Lax`
- `Secure: true` seulement en production (`NODE_ENV=production`)
- `Path: /auth`

---

## Référence routes

### 1) Health
- **Méthode**: `GET`
- **Chemin service**: `/health`
- **Chemin via front/Traefik**: `/api/auth/health`
- **Objectif**: santé du service
- **Auth requise**: non
- **Headers**: aucun requis
- **Payload**: aucun
- **Succès**: `200`
- **Erreurs principales**: `500` si incident
- **Remarques intégration**: utile pour monitoring et diagnostic

### 2) Register
- **Méthode**: `POST`
- **Chemin service**: `/users`
- **Chemin via front/Traefik**: `/api/auth/users`
- **Objectif**: création compte utilisateur
- **Auth requise**: non
- **Headers**: `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "pseudo": "coach42",
    "email": "coach42@example.com",
    "password": "StrongPass1!"
  }
  ```
- **Succès**: `201` + `UserPublicDto`
- **Erreurs principales**: `400` validation, `409` email déjà utilisé
- **Remarques intégration**: tout `roles` envoyé est ignoré (forcé à `['user']`)

### 3) Login
- **Méthode**: `POST`
- **Chemin service**: `/auth/login`
- **Chemin via front/Traefik**: `/api/auth/auth/login`
- **Objectif**: authentifier et ouvrir une session refresh
- **Auth requise**: non
- **Headers**: `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "email": "coach42@example.com",
    "password": "StrongPass1!"
  }
  ```
- **Succès**: `201` +
  ```json
  {
    "accessToken": "<jwt-access-token>"
  }
  ```
  + `Set-Cookie: refreshToken=...`
- **Erreurs principales**: `401` identifiants invalides, `400` validation
- **Remarques intégration**: message login invalide attendu: `Unauthorized: invalid credentials or user not found.`

### 4) Refresh
- **Méthode**: `POST`
- **Chemin service**: `/auth/refresh`
- **Chemin via front/Traefik**: `/api/auth/auth/refresh`
- **Objectif**: renouveler l’access token via cookie refresh
- **Auth requise**: cookie refresh (pas Bearer)
- **Headers**: `Content-Type: application/json` + credentials activées côté client
- **Payload**: aucun
- **Succès**: `201` + `{ "accessToken": "<jwt-access-token>" }`
- **Erreurs principales**: `401` cookie absent/invalide/expiré/révoqué
- **Remarques intégration**: le refresh token n’est jamais retourné en JSON

### 5) Logout (session courante)
- **Méthode**: `POST`
- **Chemin service**: `/auth/logout`
- **Chemin via front/Traefik**: `/api/auth/auth/logout`
- **Objectif**: révoquer la session liée au cookie
- **Auth requise**: cookie refresh (optionnel selon état session)
- **Headers**: credentials activées côté client
- **Payload**: aucun
- **Succès**: `200` + `{ "message": "Logged out" }`
- **Erreurs principales**: `À confirmer`
- **Remarques intégration**: utiliser après logout UI pour invalider la session serveur

### 6) Me (lecture)
- **Méthode**: `GET`
- **Chemin service**: `/me`
- **Chemin via front/Traefik**: `/api/auth/me`
- **Objectif**: récupérer le profil connecté
- **Auth requise**: JWT + rôle `user`
- **Headers**: `Authorization: Bearer <jwt>`
- **Payload**: aucun
- **Succès**: `200` + `UserPublicDto`
- **Erreurs principales**: `401`, `403`, `404`
- **Remarques intégration**: source de vérité profil front

### 7) Me (mise à jour)
- **Méthode**: `PATCH`
- **Chemin service**: `/me`
- **Chemin via front/Traefik**: `/api/auth/me`
- **Objectif**: mettre à jour le profil connecté
- **Auth requise**: JWT + rôle `user`
- **Headers**: `Authorization: Bearer <jwt>`, `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "pseudo": "newPseudo",
    "email": "new@example.com",
    "password": "StrongPass2!"
  }
  ```
  (champs optionnels)
- **Succès**: `200` + `UserPublicDto`
- **Erreurs principales**: `400`, `401`, `403`, `409`
- **Remarques intégration**: si `password` fourni, il est rehash côté serveur

### 8) Me (suppression)
- **Méthode**: `DELETE`
- **Chemin service**: `/me`
- **Chemin via front/Traefik**: `/api/auth/me`
- **Objectif**: supprimer son compte
- **Auth requise**: JWT + rôle `user`
- **Headers**: `Authorization: Bearer <jwt>`
- **Payload**: aucun
- **Succès**: `200` + `{ user: UserPublicDto, message }`
- **Erreurs principales**: `401`, `403`, `404`
- **Remarques intégration**: invalider état session front après suppression

### 9) Sessions (liste)
- **Méthode**: `GET`
- **Chemin service**: `/auth/sessions`
- **Chemin via front/Traefik**: `/api/auth/auth/sessions`
- **Objectif**: lister les sessions refresh de l’utilisateur
- **Auth requise**: JWT
- **Headers**: `Authorization: Bearer <jwt>`
- **Payload**: aucun
- **Succès**: `200` + `SessionDto[]`
- **Erreurs principales**: `401`
- **Remarques intégration**: `refreshTokenHash` n’est jamais exposé

### 10) Sessions (révocation unitaire)
- **Méthode**: `DELETE`
- **Chemin service**: `/auth/sessions/:id`
- **Chemin via front/Traefik**: `/api/auth/auth/sessions/:id`
- **Objectif**: révoquer une session cible
- **Auth requise**: JWT
- **Headers**: `Authorization: Bearer <jwt>`
- **Payload**: aucun
- **Succès**: `200` + `{ "message": "Session revoked" }`
- **Erreurs principales**: `401`, `403`
- **Remarques intégration**: interdit de révoquer une session d’un autre utilisateur

### 11) Sessions (révocation globale)
- **Méthode**: `DELETE`
- **Chemin service**: `/auth/sessions`
- **Chemin via front/Traefik**: `/api/auth/auth/sessions`
- **Objectif**: logout toutes sessions
- **Auth requise**: JWT
- **Headers**: `Authorization: Bearer <jwt>`
- **Payload**: aucun
- **Succès**: `200` + `{ "message": "Logged out" }`
- **Erreurs principales**: `401`
- **Remarques intégration**: utile depuis page “appareils connectés”

### 12) Admin — liste users
- **Méthode**: `GET`
- **Chemin service**: `/admin/users`
- **Chemin via front/Traefik**: `/api/auth/admin/users`
- **Objectif**: lister les utilisateurs
- **Auth requise**: JWT + rôle `admin`
- **Headers**: `Authorization: Bearer <jwt>`
- **Payload**: aucun
- **Succès**: `200` + `UserPublicDto[]`
- **Erreurs principales**: `401`, `403`
- **Remarques intégration**: endpoint réservé interfaces admin

### 13) Admin — update user
- **Méthode**: `PATCH`
- **Chemin service**: `/admin/users/:id`
- **Chemin via front/Traefik**: `/api/auth/admin/users/:id`
- **Objectif**: modifier un utilisateur cible
- **Auth requise**: JWT + rôle `admin`
- **Headers**: `Authorization: Bearer <jwt>`, `Content-Type: application/json`
- **Payload**: mêmes champs que `PATCH /me`
- **Succès**: `200` + `UserPublicDto`
- **Erreurs principales**: `400`, `401`, `403`, `404`, `409`
- **Remarques intégration**: utiliser pour back-office admin uniquement

### 14) Admin — delete user
- **Méthode**: `DELETE`
- **Chemin service**: `/admin/users/:id`
- **Chemin via front/Traefik**: `/api/auth/admin/users/:id`
- **Objectif**: supprimer un utilisateur cible
- **Auth requise**: JWT + rôle `admin`
- **Headers**: `Authorization: Bearer <jwt>`
- **Payload**: aucun
- **Succès**: `200` + `{ user: UserPublicDto, message }`
- **Erreurs principales**: `401`, `403`, `404`
- **Remarques intégration**: endpoint à protéger côté UI admin

---

## Objets utiles

### `UserPublicDto`

```json
{
  "id": "6750d39841f6fa572ff14549",
  "pseudo": "coach42",
  "email": "coach42@example.com"
}
```

### `SessionDto`

```json
{
  "id": "6750d39841f6fa572ff14549",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "expiresAt": "2026-01-31T10:00:00.000Z",
  "revokedAt": null,
  "lastUsedAt": "2026-01-02T11:00:00.000Z",
  "userAgent": "Mozilla/5.0"
}
```

## Erreur API (format global)

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "email must be an email",
  "timestamp": "2026-03-23T12:00:00.000Z",
  "path": "/auth/login"
}
```
