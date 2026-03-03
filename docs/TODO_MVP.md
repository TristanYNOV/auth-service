# TODO_MVP

Checklist des manques/priorités pour rendre l’auth-service suffisant pour un MVP robuste.

## 1) Endpoints MVP manquants

- [ ] Ajouter `GET /me` (ou `/auth/me`) protégé JWT qui retourne un profil minimal stable.
- [ ] Ajouter endpoint health (`GET /health`) pour l’intégration infra/monitoring.
- [ ] Décider si register doit être exposé sous `/auth/register` (actuellement `POST /users`).

## 2) Validation input

- [ ] Uniformiser validation email (`UpdateUserDto` utilise `IsString` au lieu de `IsEmail`).
- [ ] Clarifier politique mot de passe (longueur, complexité) et la documenter côté front.
- [ ] Ajouter validations explicites sur tous les DTO nécessaires (optionnalité cohérente en update).

## 3) Gestion d’erreurs (contrat stable)

- [ ] Stabiliser les statuts attendus (`400/401/409/500`) selon cas.
- [ ] Retourner `404` quand user absent au lieu de remapper en `400` dans certains services.
- [ ] Mapper proprement conflits d’unicité email en `409 Conflict`.
- [ ] Définir un format d’erreur unique (code applicatif + message + détails).

## 4) Stockage users

- [ ] Confirmer la persistance DB en environnement cible (pas de stockage en mémoire).
- [ ] Vérifier index d’unicité email côté Mongo + stratégie de migration.
- [ ] Prévoir stratégie backup/restore minimale si nécessaire.

## 5) JWT policy

- [ ] Remplacer secret par défaut (`secret`) par secret obligatoire en env.
- [ ] Définir claims standard (`sub`, `iat`, `exp`, éventuellement `iss`/`aud`).
- [ ] Ajouter refresh token si la session longue est nécessaire.
- [ ] Préparer rotation de clé/signature.

## 6) Sécurité applicative et gateway

- [ ] Ne plus exposer `password` hashé dans les réponses API user.
- [ ] Ajouter rate limiting sur `/auth/login` au niveau Traefik.
- [ ] Mettre en place mitigation brute-force (throttle/backoff/lock temporaire).
- [ ] Éviter logs PII sensibles et ne jamais logger mots de passe/tokens.

## 7) Observabilité minimale

- [ ] Logs structurés (json) avec niveau et contexte.
- [ ] Correlation id (ex: `X-Request-Id`) propagé depuis gateway.
- [ ] Métriques minimales (login success/fail, latence, erreurs 5xx).

## 8) Contrat front-back

- [ ] Harmoniser les routes auth pour éviter la confusion `/auth/auth/login` via Traefik.
- [ ] Produire un contrat OpenAPI ou DTO partagés TypeScript pour le front.
