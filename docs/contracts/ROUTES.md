# ROUTES

Contrat de routes **en Markdown** pour intégration front/back.

> Source: routes réellement présentes dans `UserController` et `AuthController`.

## Base paths

- `AUTH_BASEPATH_TRAEFIK = "/api/auth"`
- `AUTH_BASEPATH_DIRECT = ""` (backend direct sans préfixe global supplémentaire)

Exemples:
- URL Traefik login: `/api/auth/auth/login`
- URL directe login (origin `http://localhost:3000`): `http://localhost:3000/auth/login`

## Table des routes

| Key | Method | Direct path (backend) | Via Traefik | JWT requis | Params | Body |
|---|---|---|---|---|---|---|
| `auth.login` | `POST` | `/auth/login` | `/api/auth/auth/login` | non | - | `LoginRequest` |
| `auth.test` | `GET` | `/auth/test` | `/api/auth/auth/test` | oui | - | - |
| `users.create` | `POST` | `/users` | `/api/auth/users` | non | - | `CreateUserRequest` |
| `users.list` | `GET` | `/users` | `/api/auth/users` | non | - | - |
| `users.getById` | `GET` | `/users/searchId/:id` | `/api/auth/users/searchId/:id` | non | `id` | - |
| `users.getByPseudo` | `GET` | `/users/searchPseudo/:pseudo` | `/api/auth/users/searchPseudo/:pseudo` | non | `pseudo` | - |
| `users.getByEmail` | `GET` | `/users/searchEmail/:email` | `/api/auth/users/searchEmail/:email` | non | `email` | - |
| `users.update` | `PATCH` | `/users/:id` | `/api/auth/users/:id` | non | `id` | `UpdateUserRequest` |
| `users.delete` | `DELETE` | `/users/:id` | `/api/auth/users/:id` | non | `id` | - |

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
