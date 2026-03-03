# auth-service

Service d’authentification du projet d’analyse vidéo sportive (architecture microservices).

## Objectif

Ce service gère actuellement :
- la création d’utilisateur (`POST /users`),
- la connexion (`POST /auth/login`) avec émission de JWT,
- des opérations CRUD utilisateur utilitaires,
- un endpoint de test JWT (`GET /auth/test`).

> ⚠️ Le service n’expose **pas encore** de `GET /me` ni d’endpoint health dédié.

## Contexte architecture (résumé)

- Front Angular (navigateur).
- Entrée HTTP unique via Traefik.
- Routage prévu : `/api/auth/*` côté gateway avec `StripPrefix(/api/auth)` vers ce service.
- Côté navigateur, l’intégration visée est en URL relative `/api/auth/...` (same-origin).

Voir la documentation détaillée :
- `docs/CONTEXT.md`
- `docs/API.md`
- `docs/INTEGRATION.md`
- `docs/TODO_MVP.md`


## Contracts (Source of truth)

Pour la coordination front/back, la source de vérité à copier/coller est dans :

- `docs/contracts/FEATURES.md`
- `docs/contracts/ROUTES.md`

Toute évolution d'API doit mettre à jour ces fichiers dans le même changement.

## Démarrage rapide

```bash
npm install
npm run start:dev
```

Par défaut, l’API écoute sur `PORT` ou `3000`.

## Documentation détaillée

- Contexte global : `docs/CONTEXT.md`
- Contrat API réel : `docs/API.md`
- Format des erreurs : `docs/ERRORS.md`
- JWT : `docs/JWT.md`
- Sécurité : `docs/SECURITY.md`
- Dév local : `docs/LOCAL_DEV.md`
- Intégration Traefik : `docs/INTEGRATION.md`
- Backlog MVP auth : `docs/TODO_MVP.md`
- Kit Postman : `postman/README.md`
