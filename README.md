# auth-service

## Suppression utilisateur event-driven

`DELETE /me` et `DELETE /admin/users/:id` demarrent maintenant un workflow RabbitMQ: `auth-service` publie `user.deletion.requested`, attend `user.data.anonymized`, finalise l'utilisateur en `deleted`, puis publie `user.deleted`.

- Exchange: `domain.events`
- Queue: `auth-service.user-deletion`
- Documentation: [docs/contracts/events/user-deletion.md](docs/contracts/events/user-deletion.md)

Service d’authentification du projet **Analyse Basket** (architecture microservices).

## Rôle dans l’architecture Analyse Basket

`auth-service` gère les comptes, l’authentification et les sessions:
- inscription utilisateur,
- login avec JWT d’accès,
- refresh/logout via cookie HttpOnly,
- endpoints profil (`/me`),
- endpoint interne de contexte d'identité pour gateway (`/internal/auth/context`),
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

## Observability

`GET /metrics` expose les métriques Prometheus du service:
- métriques runtime Node.js via `prom-client`,
- métriques HTTP agrégées par méthode, route normalisée et code statut.
- métriques RabbitMQ métier et workflow de suppression utilisateur.

Les métriques auth usuelles (login, refresh, logout, register, suppression de sessions) sont déduites des métriques HTTP par route et code statut.

Cet endpoint est destiné au scraping Prometheus. Les labels n'incluent pas de données sensibles: aucun email, pseudo, userId, token ou payload métier.

### Métriques RabbitMQ métier

Événements couverts:
- publication `user.deletion.requested`
- consommation `user.data.anonymized`
- publication `user.deleted`

Métriques communes:
- `rabbitmq_business_events_published_total`
- `rabbitmq_business_events_consumed_total`
- `rabbitmq_business_event_publish_duration_seconds`
- `rabbitmq_business_event_processing_duration_seconds`

Labels:
- `service` (label Prometheus par défaut du service)
- `event_type`
- `routing_key`
- `result`

Valeurs bornées:
- `event_type` / `routing_key`: `user.deletion.requested`, `user.data.anonymized`, `user.deleted`, `unknown`
- `result` publication: `success`, `failure`
- `result` consommation: `success`, `failure`, `ignored`, `duplicate`, `invalid`

Métriques suppression utilisateur:
- `user_deletion_workflows_started_total` avec `requested_by`, `reason`
- `user_deletion_workflows_completed_total`
- `user_deletion_workflows_failed_total` avec `failure_step`
- `user_deletion_workflow_duration_seconds` avec `result`

Valeurs bornées:
- `requested_by`: `self`, `admin`, `system`, `unknown`
- `reason`: `user_request`, `admin_action`, `test`, `unknown`
- `failure_step`: `publish_requested_event`, `consume_anonymized_event`, `finalize_user`, `publish_deleted_event`, `unknown`
- `result`: `completed`, `failed`

PromQL utiles:

```promql
sum by(event_type, result) (rate(rabbitmq_business_events_published_total{service="auth-service"}[5m]))
sum by(event_type, result) (rate(rabbitmq_business_events_consumed_total{service="auth-service"}[5m]))
histogram_quantile(0.95, sum by(le, event_type) (rate(rabbitmq_business_event_processing_duration_seconds_bucket{service="auth-service"}[5m])))
sum(rate(user_deletion_workflows_completed_total{service="auth-service"}[5m]))
sum by(failure_step) (rate(user_deletion_workflows_failed_total{service="auth-service"}[5m]))
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
