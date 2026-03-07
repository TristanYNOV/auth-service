# auth-service

Service d’authentification du projet d’analyse vidéo sportive (architecture microservices).

## Objectif

Ce service gère actuellement :
- la création d’utilisateur (`POST /users`),
- la connexion (`POST /auth/login`) avec émission de JWT access (15m) + cookie refresh HttpOnly (30j),
- la rotation refresh (`POST /auth/refresh`) et la révocation (`POST /auth/logout`),
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

## Configuration obligatoire

Les variables suivantes sont **obligatoires dans tous les environnements** (dev inclus):
- `JWT_SECRET`
- `DATABASE_URL`
- `DB_NAME`
- `JWT_EXPIRES_IN`

Le service fail-fast au boot si l’une est absente ou vide. Aucun fallback n’est utilisé pour ces variables.

## Strict mode

Le mode strict active des contrôles de qualité supplémentaires sur les valeurs d’env (anti-placeholder / anti-secret faible):
- actif automatiquement si `NODE_ENV=production`,
- activable hors prod avec `STRICT_ENV=true`.

En strict mode, `JWT_SECRET` faible/placeholder est refusé (minimum 16 caractères), ainsi que les placeholders `__CHANGE_ME__` sur `DB_NAME` et `DATABASE_URL`.

## Templates d’environnement (Option B)

- Développement: `cp .env.example .env` puis remplir toutes les variables.
- Production: utiliser `.env.example.prod` comme référence de structure, **sans jamais commiter de secret réel**.
- En prod, injecter les valeurs finales via secret manager / CI (pas via fichiers versionnés).

## CI/CD

- CI GitHub Actions: lint + tests + e2e à chaque PR vers `master` et à chaque push sur `master`.
- CD GitHub Actions: build et publication de l’image Docker sur GHCR à chaque push sur `master`.
- Image publiée: `ghcr.io/<owner>/auth-service`
  - `:main` (tag mouvant)
  - `:sha-<commit_sha>` (tag immuable recommandé pour déploiement)

## Infra contract

- Contrat d’intégration infra: `docs/infra/INFRA_CONTRACT.md`
- Snippet compose: `docs/infra/docker-compose.snippet.yml`
- Template variables infra: `docs/infra/env.infra.example`
- Rappel: ne jamais committer de secret (`.env`, mots de passe, clés) dans le repository.


## Angular integration (cookies + refresh)

- Les appels `POST /auth/refresh` et `POST /auth/logout` doivent être faits avec `credentials: true` (ex: `withCredentials: true` en Angular HttpClient) pour que le navigateur envoie le cookie HttpOnly.
- Le front doit conserver l'access token en mémoire (pas dans localStorage) et utiliser `/auth/refresh` pour en obtenir un nouveau.
- En dev HTTP, `SameSite=Lax` est utilisé (MVP sans certificat).
- Le flag `Secure` du cookie refresh est activé uniquement en production (`NODE_ENV=production`).

## Security highlights

- RBAC with `roles: ('user'|'admin')[]` in user model.
- Exactly one admin is enforced at startup:
  - `0` admin => create from env
  - `1` admin => OK
  - `>1` admins => fail-fast
- Login errors are anti-enumeration:
  - `Unauthorized: invalid credentials or user not found.`
- JWT signé et vérifié explicitement en `HS256`.
- `iss` / `aud` supportés de façon optionnelle via `JWT_ISSUER` / `JWT_AUDIENCE`.
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
JWT_SECRET=<votre_secret_partage>
JWT_EXPIRES_IN=15m
NODE_ENV=development
STRICT_ENV=false
```

Conserver aussi les variables `SALT` et `ADMIN_*`.

### 3) Lancer Nest localement (debug)

```bash
npm install
npm run start:dev
```

Vous pouvez ensuite poser des breakpoints depuis votre IDE.

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
