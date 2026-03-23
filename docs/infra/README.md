# Infra — mode d’emploi

Ce dossier contient le contrat d’intégration infra de `auth-service`.

## Fichiers

- `INFRA_CONTRACT.md`: contrat opérationnel (runtime, variables, proxy, sécurité, dépendances).
- `docker-compose.snippet.yml`: snippet de service prêt à copier dans un compose infra.
- `env.infra.example`: variables d’environnement d’exemple alignées avec le contrat.

## Ce qui doit être repris côté infra

- Le mapping reverse proxy vers `/api/auth/*` avec suppression du préfixe.
- Les variables d’environnement obligatoires.
- Le healthcheck `GET /health`.
- Le principe de déploiement avec image immuable (`sha-<commit_sha>` recommandé).
