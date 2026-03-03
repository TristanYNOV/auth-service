# Postman kit - auth-service

## Fichiers

- `auth-service.collection.json`
- `env.traefik.json` (`baseUrl = http://localhost/api/auth`)
- `env.direct.json` (`baseUrl = http://localhost:3000`)

## Import

1. Importer la collection.
2. Importer un environnement (`via Traefik` ou `direct`).
3. Sélectionner l’environnement actif.

## Variables d’environnement

- `baseUrl`
- `pseudo`, `email`, `password`
- `pseudoUpdated`, `emailUpdated`, `passwordUpdated`
- `userId` (à renseigner après création user)
- `authToken` (alimenté automatiquement après login OK)

## Flows de test recommandés

## Flow A - happy path

1. `Users - Create (OK)`
2. Copier `_id` de la réponse dans `userId`
3. `Auth - Login (OK)`
   - script test: stocke `pm.response.text()` dans `authToken`
4. `Auth - Test JWT`
5. `Users - Update`
6. `Users - Delete`

## Flow B - erreurs

- `Users - Create (KO validation)` -> attend `400`
- `Users - Get by ID (KO invalid id)` -> attend `400`
- `Auth - Login (KO invalid credentials)` -> attend `401` ou `400` selon cas (password incorrect vs email absent)
- `Auth - Test JWT (KO no token)` -> attend `401`

## Notes Traefik

- La collection utilise des paths du service (`/users`, `/auth/login`, etc.).
- En environnement `via Traefik`, `baseUrl` inclut déjà `/api/auth`, donc les URLs effectives deviennent par exemple:
  - `http://localhost/api/auth/users`
  - `http://localhost/api/auth/auth/login`
