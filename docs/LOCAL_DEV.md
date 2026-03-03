# LOCAL_DEV

## Stack

- NestJS (TypeScript)
- MongoDB (Mongoose)
- Auth Passport local + JWT

## Variables d’environnement utilisées

- `PORT` (fallback `3000`)
- `DATABASE_URL` (fallback `mongodb://localhost:3000`)
- `DB_NAME` (fallback `auth_db`)
- `JWT_SECRET` (fallback `secret`)
- `JWT_EXPIRES_IN` (fallback `30d`)
- `SALT` (fallback `10`)

## Installation

```bash
npm install
```

## Lancer en local

```bash
npm run start:dev
```

ou

```bash
npm run start
```

API directe par défaut : `http://localhost:3000`

## Build & run prod-like

```bash
npm run build
npm run start:prod
```

## Tests disponibles

```bash
npm run test
npm run test:e2e
```

## Docker

Un `Dockerfile` multi-stage est présent.

Build:

```bash
docker build -t auth-service:local .
```

Run:

```bash
docker run --rm -p 3000:3000 --env-file .env auth-service:local
```

## Mongo local

Le service nécessite une instance Mongo accessible par `DATABASE_URL`.

Note:
- le fallback actuel (`mongodb://localhost:3000`) est atypique pour Mongo (port standard 27017).
- il est recommandé de fixer explicitement `DATABASE_URL` dans `.env`.
