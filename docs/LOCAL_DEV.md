# LOCAL_DEV

## Stack

- NestJS (TypeScript)
- MongoDB (Mongoose)
- Auth Passport local + JWT

## Variables d’environnement

Obligatoires:
- `JWT_SECRET`
- `DATABASE_URL`
- `DB_NAME`
- `JWT_EXPIRES_IN`

Optionnelles utiles:
- `PORT` (défaut applicatif `3000`)
- `NODE_ENV` (ex: `development`)
- `STRICT_ENV` (`false` par défaut dans `.env.example`)
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `SALT`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_PSEUDO`

## Strict mode

- Auto actif si `NODE_ENV=production`.
- Peut être forcé via `STRICT_ENV=true`.
- En strict mode, placeholders/valeurs faibles sont refusés (notamment `JWT_SECRET`).

## Installation

```bash
npm install
```

## Lancer en local

```bash
cp .env.example .env
npm run start:dev
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
