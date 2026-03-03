# auth-service

Service d’authentification du projet d’analyse vidéo sportive (architecture microservices).

## Objectif

Ce service gère actuellement :
- la création d’utilisateur (`POST /users`),
- la connexion (`POST /auth/login`) avec émission de JWT,
- des endpoints self-service (`GET/PATCH/DELETE /me`),
- un endpoint de santé (`GET /health`).

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

## Démarrage rapide (local)

```bash
npm install
npm run start:dev
```

Par défaut, l’API écoute sur `PORT` ou `3000`.

## Run with Docker

### Prérequis

- Docker
- Docker Compose (`docker compose`)

### Configuration

1. Copier l’exemple d’environnement :

```bash
cp .env.example .env
```

2. Ajuster les variables si besoin (dev par défaut) :
- `PORT=3000`
- `DATABASE_URL=mongodb://auth_db:27017`
- `DB_NAME=auth`
- `JWT_SECRET=change-me`
- `JWT_EXPIRES_IN=30d`

### Démarrage

```bash
docker compose up -d --build
```

ou via npm scripts :

```bash
npm run docker:up
```

### Logs / statut / arrêt

```bash
docker compose logs -f auth-service
docker compose ps
docker compose down
```

### Checks de connectivité

- Smoke test API :

```bash
curl http://localhost:3000/health
```

- Vérifier la résolution DNS du service Mongo depuis le conteneur app :

```bash
docker compose exec auth-service sh -lc "getent hosts auth_db"
```

- Vérifier l’état health de Mongo :

```bash
docker compose ps
```

### Note importante hôte Mongo

- Si Nest tourne **dans Docker Compose**, l’hôte Mongo doit être `auth_db`.
- Si Nest tourne **en local hors Docker**, utilisez plutôt `localhost` dans `DATABASE_URL`.

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
