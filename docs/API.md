# API (contrat HTTP réel)

Ce document décrit **uniquement** les endpoints présents dans le code.

## Base URLs

### Accès direct service

- `http://localhost:3000` (ou `PORT` si variable d’environnement)

### Accès via Traefik

- `http://localhost/api/auth`

Traefik retire le préfixe `/api/auth` avant d’atteindre ce service.

Exemple :
- client appelle `POST /api/auth/users`
- Traefik forward vers `POST /users`

---

## Endpoints disponibles

## 1) Create user

- **Direct**: `POST /users`
- **Via Traefik**: `POST /api/auth/users`
- **Description**: crée un utilisateur en base avec mot de passe hashé (bcrypt).

### Request body

```json
{
  "pseudo": "coach42",
  "email": "coach42@example.com",
  "password": "StrongPass1!"
}
```

Contraintes (validation):
- `pseudo`: string non vide
- `email`: email valide
- `password`: `IsStrongPassword({ minLength: 8, minUppercase: 1, minNumbers: 1 })`
- propriétés non autorisées refusées (`forbidNonWhitelisted: true`)

### Response (201)

Réponse Mongoose (exemple) :

```json
{
  "pseudo": "coach42",
  "email": "coach42@example.com",
  "password": "$2b$10$...",
  "_id": "6750d39841f6fa572ff14549"
}
```

### Erreurs fréquentes

- `400` validation (DTO / propriétés non whitelist)
- `500` erreur Mongo (ex: doublon email unique selon configuration/gestion actuelle)

---

## 2) List users

- **Direct**: `GET /users`
- **Via Traefik**: `GET /api/auth/users`
- **Description**: retourne tous les utilisateurs.

### Response (200)

```json
[
  {
    "_id": "6750d39841f6fa572ff14549",
    "pseudo": "coach42",
    "email": "coach42@example.com",
    "password": "$2b$10$..."
  }
]
```

---

## 3) Get user by id

- **Direct**: `GET /users/searchId/:id`
- **Via Traefik**: `GET /api/auth/users/searchId/:id`

### Response (200)

```json
{
  "_id": "6750d39841f6fa572ff14549",
  "pseudo": "coach42",
  "email": "coach42@example.com",
  "password": "$2b$10$..."
}
```

### Erreurs

- `400` id invalide (`User ID: ... doesn't match format`)
- `404` utilisateur introuvable

---

## 4) Get user by pseudo

- **Direct**: `GET /users/searchPseudo/:pseudo`
- **Via Traefik**: `GET /api/auth/users/searchPseudo/:pseudo`

### Réponse

- `200` utilisateur trouvé
- `400` `Failed to get user by alias` (y compris cas non trouvé, selon implémentation actuelle)

---

## 5) Get user by email

- **Direct**: `GET /users/searchEmail/:email`
- **Via Traefik**: `GET /api/auth/users/searchEmail/:email`

### Réponse

- `200` utilisateur trouvé
- `400` `Failed to get user by email` (y compris cas non trouvé, selon implémentation actuelle)

---

## 6) Delete user

- **Direct**: `DELETE /users/:id`
- **Via Traefik**: `DELETE /api/auth/users/:id`

### Response (200)

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

### Erreurs

- `400` id invalide
- `404` user non trouvé

---

## 7) Update user

- **Direct**: `PATCH /users/:id`
- **Via Traefik**: `PATCH /api/auth/users/:id`

### Request body

```json
{
  "pseudo": "coach-updated",
  "email": "coach-updated@example.com",
  "password": "NewStrong1!"
}
```

Validation:
- `pseudo` optionnel string
- `email` optionnel string (pas de validation email stricte dans ce DTO)
- `password` attendu avec contrainte `IsStrongPassword({ minLength: 8, minUppercase: 1, minNumbers: 1 })`

### Response (200)

```json
{
  "_id": "6750d39841f6fa572ff14549",
  "pseudo": "coach-updated",
  "email": "coach-updated@example.com",
  "password": "$2b$10$..."
}
```

---

## 8) Login

- **Direct**: `POST /auth/login`
- **Via Traefik**: `POST /api/auth/auth/login`

> Note: le contrôleur d’auth est préfixé par `/auth`, donc en ajoutant le préfixe Traefik `/api/auth`, on obtient `/api/auth/auth/login`.

### Request body

```json
{
  "email": "coach42@example.com",
  "password": "StrongPass1!"
}
```

### Response (201)

Le endpoint retourne une **chaîne JWT brute** (pas un objet JSON encapsulant `token`).

Exemple:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Erreurs

- `401` `Invalid credentials` (mot de passe invalide)
- `400` `Failed to get user by email` (email inconnu, remonté depuis `UserService`)

---

## 9) JWT test endpoint (protégé)

- **Direct**: `GET /auth/test`
- **Via Traefik**: `GET /api/auth/auth/test`
- **Auth header**: `Authorization: Bearer <token>`

Comportement actuel:
- la garde JWT protège bien l’accès,
- le handler ne retourne pas de payload explicite (log serveur uniquement).

### Réponses observables

- `200` si token valide (body vide)
- `401` si token absent/invalide/expiré

---

## Endpoints absents (à ne pas consommer)

- Pas de `POST /auth/register` (register se fait via `POST /users`)
- Pas de `GET /me`
- Pas de refresh token
- Pas de logout
- Pas de reset password
- Pas d’endpoint health dédié
