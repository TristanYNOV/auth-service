# Infra Contract — auth-service

## Purpose
Ce document décrit le contrat d’intégration de `auth-service` dans un repo d’infrastructure (compose, swarm, k8s, etc.).

## Docker image contract
- Registry: `ghcr.io`
- Repository: `ghcr.io/<owner>/auth-service`
- Tags publiés:
  - `:main` → tag mouvant (dernière version de la branche `main`)
  - `:sha-<commit_sha>` → tag immuable (recommandé pour déploiements reproductibles)

**Recommandation:** utiliser `:sha-<commit_sha>` en production, garder `:main` pour environnements de dev/intégration.

## Runtime contract
- Port interne exposé par le service: `3000`
- Health endpoint: `GET /health` (attendu `200`)

## Required environment variables
Variables obligatoires au runtime:
- `JWT_SECRET`
- `DATABASE_URL`
- `DB_NAME`
- `JWT_EXPIRES_IN`
- `NODE_ENV`
- `STRICT_ENV`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_PSEUDO`

> Les variables `ADMIN_*` sont nécessaires pour le bootstrap admin initial (premier démarrage, DB sans admin).

## Optional environment variables
- `JWT_ISSUER`
- `JWT_AUDIENCE`

## Database contract
- Moteur attendu: MongoDB
- Exemple de valeur `DATABASE_URL`:
  - `mongodb://auth_db:27017`

## Healthcheck contract
- Endpoint: `GET /health`
- Statut attendu: HTTP `200`

## Cookies & CORS notes
- Le refresh token est stocké en cookie `HttpOnly` avec `SameSite=Lax`.
- Le flag `Secure` est activé uniquement en production.
- Le front doit appeler les endpoints auth avec `credentials: true` (ou équivalent) pour transmettre le cookie.

## Deployment checklist
- [ ] Utiliser une image GHCR avec tag immuable `sha-<commit_sha>`.
- [ ] Fournir toutes les variables d’environnement requises.
- [ ] Ne jamais committer de secrets dans le repo infra.
- [ ] Vérifier la connectivité MongoDB (`DATABASE_URL`, `DB_NAME`).
- [ ] Vérifier que `GET /health` répond `200` après déploiement.
