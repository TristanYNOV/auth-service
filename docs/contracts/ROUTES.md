# ROUTES

Contrat de routes **en Markdown** pour intégration front/back.

> Source: routes réellement présentes dans `UserController` et `AuthController`.

## Base URLs

- Via Traefik: `http://localhost/api/auth`
- Direct (debug): `http://localhost:3000` (valeur par défaut via `process.env.PORT ?? 3000`; TODO: ajuster si `PORT` différent en environnement local)
- StripPrefix: Traefik retire le préfixe `/api/auth` avant de forward au service, donc une route backend `/auth/login` devient `/api/auth/auth/login` côté entrée gateway.

## Table des routes

| Key | Method | Direct path (backend) | Via Traefik | Access | Impact JWT | Params | Body |
|---|---|---|---|---|---|---|---|
| `auth.login` | `POST` | `/auth/login` | `/api/auth/auth/login` | Public | Retourne le token JWT comme **chaîne brute** (response body = token string) | - | `LoginRequest` |
| `auth.test` | `GET` | `/auth/test` | `/api/auth/auth/test` | Protected | Nécessite Bearer valide; la stratégie JWT extrait `Authorization: Bearer <token>` et expose le payload dans `req.user` | - | - |
| `users.create` | `POST` | `/users` | `/api/auth/users` | Public | Aucun usage JWT dans cette route | - | `CreateUserRequest` |
| `users.list` | `GET` | `/users` | `/api/auth/users` | Public | Aucun usage JWT dans cette route | - | - |
| `users.getById` | `GET` | `/users/searchId/:id` | `/api/auth/users/searchId/:id` | Public | Aucun usage JWT dans cette route | `id` | - |
| `users.getByPseudo` | `GET` | `/users/searchPseudo/:pseudo` | `/api/auth/users/searchPseudo/:pseudo` | Public | Aucun usage JWT dans cette route | `pseudo` | - |
| `users.getByEmail` | `GET` | `/users/searchEmail/:email` | `/api/auth/users/searchEmail/:email` | Public | Aucun usage JWT dans cette route | `email` | - |
| `users.update` | `PATCH` | `/users/:id` | `/api/auth/users/:id` | Public | Aucun usage JWT dans cette route | `id` | `UpdateUserRequest` |
| `users.delete` | `DELETE` | `/users/:id` | `/api/auth/users/:id` | Public | Aucun usage JWT dans cette route | `id` | - |

## JWT usage for other services

- Claim canonique user id: `_id` (voir section **JWT Contract** dans `FEATURES.md`).
- Les services aval devraient utiliser cette claim comme `ownerId` interne.
- Règle d’intégration: ne pas envoyer `ownerId/userId` en clair dans body/query quand il peut être dérivé du JWT validé.
- TODO gateway: faire confiance à l’identité uniquement quand la validation de token est garantie en amont (Traefik/gateway).

## Interfaces (échanges front/back)

### `LoginRequest`

```json
{
  "email": "coach42@example.com",
  "password": "StrongPass1!"
}
```

### `LoginResponse`

Type réel actuel: `string` (JWT brut, pas `{ "token": "..." }`).

### `CreateUserRequest`

```json
{
  "pseudo": "coach42",
  "email": "coach42@example.com",
  "password": "StrongPass1!"
}
```

### `UpdateUserRequest`

```json
{
  "pseudo": "coach-updated",
  "email": "coach-updated@example.com",
  "password": "NewStrong1!"
}
```

> Note: dans le DTO actuel, `password` est attendu (contrainte strong password), même en update partiel.

### `UserEntity` (forme de réponse actuelle)

```json
{
  "_id": "6750d39841f6fa572ff14549",
  "pseudo": "coach42",
  "email": "coach42@example.com",
  "password": "$2b$10$..."
}
```

### `DeleteUserResponse`

```json
{
  "user": {
    "_id": "6750d39841f6fa572ff14549",
    "pseudo": "coach42",
    "email": "coach42@example.com",
    "password": "$2b$10$..."
  },
  "message": "User Deleted"
}
```

## Règles de construction d’URL (front)

- URL Traefik: `"/api/auth" + directPath`.
- URL directe: `origin + directPath`.

Exemples:
- `auth.login` via Traefik: `/api/auth/auth/login`
- `users.getById` via Traefik avec `id=123`: `/api/auth/users/searchId/123`
- `users.getById` direct avec origin `http://localhost:3000` et `id=123`: `http://localhost:3000/users/searchId/123`

---

Toute modification d’API backend (path, méthode, auth, payload) doit mettre à jour ce fichier.
