# auth-service

Service d’authentification du projet **Analyse Basket** (architecture microservices).

## Rôle dans l’architecture Analyse Basket

`auth-service` gère les comptes, l’authentification et les sessions:
- inscription utilisateur,
- login avec JWT d’accès,
- refresh/logout via cookie HttpOnly,
- endpoints profil (`/me`),
- endpoints admin (`/admin/users`),
- endpoint de santé (`/health`).

Le service est exposé derrière Traefik sous `/api/auth/*` avec suppression du préfixe (`StripPrefix`).

## Quickstart local

### Option A — Docker (recommandé)

```bash
cp .env.example .env
docker compose up -d --build
curl http://localhost:3000/health
```

### Option B — Local Node.js

```bash
cp .env.example .env
npm install
npm run start:dev
curl http://localhost:3000/health
```

## Commandes utiles

```bash
npm run start:dev
npm run build
npm run start:prod
npm run test
npm run test:e2e
```

## Configuration générale

Variables obligatoires:
- `JWT_SECRET`
- `DATABASE_URL`
- `DB_NAME`
- `JWT_EXPIRES_IN`

Variables runtime infra (selon déploiement):
- `NODE_ENV`, `STRICT_ENV`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PSEUDO`
- `JWT_ISSUER` (optionnel)
- `JWT_AUDIENCE` (optionnel)

Référence locale: `.env.example`.

## Documentation par audience

- Contrat front: `docs/contract-front/`
- Contrat infra: `docs/infra/`
- Contexte et règles IA: `docs/ai/`
