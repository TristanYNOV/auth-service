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
- Le principe de déploiement avec image immuable via digest GHCR (ou à défaut `sha-<full_sha>`).

## Publication GHCR (branche `prod`)

- Le workflow de publication Docker/GHCR se déclenche **uniquement** sur un `push` de la branche `prod`.
- L’image publiée est privée et reste stablement nommée: `ghcr.io/<owner_lower>/auth-service`.
- Les tags publiés sont strictement:
  - `prod`
  - `sha-<full_sha>`
- Le repo infra doit consommer cette image avec des droits de lecture GHCR (token/service account adapté).
- Pour déployer la bonne version rapidement:
  - consulter le résumé du workflow GitHub Actions (image, tags, digest final),
  - ou vérifier le package GHCR correspondant puis reprendre le digest publié.
