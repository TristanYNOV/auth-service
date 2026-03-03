# INTEGRATION (Traefik)

## Principe de routage

- Entrée publique: `/api/auth/*`
- Middleware Traefik: `StripPrefix('/api/auth')`
- Backend auth-service reçoit donc des paths sans préfixe `/api/auth`.

## Mapping d’URL

| Fonction | Path reçu par auth-service (direct) | Path appelé via Traefik |
|---|---|---|
| Create user | `POST /users` | `POST /api/auth/users` |
| List users | `GET /users` | `GET /api/auth/users` |
| Get user by id | `GET /users/searchId/:id` | `GET /api/auth/users/searchId/:id` |
| Get user by pseudo | `GET /users/searchPseudo/:pseudo` | `GET /api/auth/users/searchPseudo/:pseudo` |
| Get user by email | `GET /users/searchEmail/:email` | `GET /api/auth/users/searchEmail/:email` |
| Update user | `PATCH /users/:id` | `PATCH /api/auth/users/:id` |
| Delete user | `DELETE /users/:id` | `DELETE /api/auth/users/:id` |
| Login | `POST /auth/login` | `POST /api/auth/auth/login` |
| JWT test | `GET /auth/test` | `GET /api/auth/auth/test` |

## Headers importants

- Authentification des routes protégées:
  - `Authorization: Bearer <jwt>`
- JSON:
  - `Content-Type: application/json`

## Statuts attendus (haut niveau)

- Succès: `200` / `201`
- Validation/erreur fonctionnelle: `400`, `401`, `404`
- Erreur serveur/DB non mappée: `500`

## Intégration front (Angular)

Le front doit appeler en relatif:
- `/api/auth/...`

Exemple login actuel:
- `/api/auth/auth/login`

Cela évite le CORS en passant par la même origin + gateway.

## Préparation future (hors repo)

Quand la validation JWT sera déplacée/complétée côté Traefik:
- conserver le schéma Bearer,
- propager les claims utiles vers services backend via headers signés/sécurisés,
- harmoniser statuts de rejet (`401`/`403`) entre gateway et service.
