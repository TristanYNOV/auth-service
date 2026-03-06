# auth-service

Service d’authentification du projet d’analyse vidéo sportive (architecture microservices).

## Objectif

Ce service gère actuellement :
- la création d’utilisateur (`POST /users`),
- la connexion (`POST /auth/login`) avec émission de JWT,
- les endpoints self-service user (`GET/PATCH/DELETE /me`),
- les endpoints admin (`/admin/users`),
- un endpoint de santé (`GET /health`).

## Quickstart

### Option A — Docker (recommandé)

```bash
cp .env.example .env
docker compose up -d --build
curl http://localhost:3000/health
```

### Option B — Local (Node.js)

```bash
cp .env.example .env
npm install
npm run start:dev
curl http://localhost:3000/health
```

## Security highlights

- RBAC with `roles: ('user'|'admin')[]` in user model.
- Exactly one admin is enforced at startup:
  - `0` admin => create from env
  - `1` admin => OK
  - `>1` admins => fail-fast
- Login errors are anti-enumeration:
  - `Unauthorized: invalid credentials or user not found.`
- `/users` non-register endpoints were removed; user self-management goes through `/me`.

## Contracts (source of truth)

- `docs/contracts/FEATURES.md`
- `docs/contracts/ROUTES.md`

## Debug local (breakpoints) + MongoDB Compass

### 1) Démarrer MongoDB local

Choix A (docker compose, mongo uniquement):

```bash
docker compose up -d auth_db
```

Choix B: MongoDB installé en local.

### 2) Configurer `.env` pour local

```env
DATABASE_URL=mongodb://localhost:27017
DB_NAME=auth_db
```

Conserver aussi les variables JWT/SALT/ADMIN.

### 3) Lancer Nest localement

```bash
npm install
npm run start:dev
```

### 4) Connexion MongoDB Compass

- URL: `mongodb://localhost:27017`
- Database: `auth_db` (ou la valeur de `DB_NAME`)

### Important — admin bootstrap

Si un admin existe déjà en base, changer `ADMIN_PASSWORD` dans `.env` **ne change pas** le mot de passe existant.

Pour réinitialiser l’admin:
- soit drop de la DB via Compass,
- soit suppression du volume Docker Mongo (exemple):

```bash
docker compose down
docker volume rm auth-service_mongo_data
```

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
