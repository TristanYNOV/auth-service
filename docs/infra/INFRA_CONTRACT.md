# INFRA_CONTRACT — auth-service

## 1) Image et rôle du service

- Service: `auth-service`
- Rôle: authentification, émission JWT d’accès, gestion sessions refresh, endpoints profil/admin.
- Registry: `ghcr.io`
- Repository image: `ghcr.io/<owner>/auth-service`
- Tags publiés:
  - `main` (mouvant)
  - `sha-<commit_sha>` (immuable, recommandé en production)

## 2) Port exposé

- Port interne service: `3000`
- Exposition externe: via reverse proxy (Traefik) — publication directe du port **À confirmer** selon environnement.

## 3) Variables d’environnement nécessaires

Obligatoires:
- `JWT_SECRET`
- `DATABASE_URL`
- `DB_NAME`
- `JWT_EXPIRES_IN`
- `NODE_ENV`
- `STRICT_ENV`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_PSEUDO`

Optionnelles:
- `JWT_ISSUER`
- `JWT_AUDIENCE`

## 4) Attentes reverse proxy / Traefik

- Exposition publique attendue sous `/api/auth/*`.
- Suppression du préfixe `/api/auth` avant forward vers le service.
- Exemple login:
  - URL client: `/api/auth/auth/login`
  - URL service: `/auth/login`
- Pour refresh/logout: le client doit appeler avec credentials activées pour transporter le cookie `refreshToken`.

## 5) Dépendances

- MongoDB requis.
- Exemple de connexion: `mongodb://auth_db:27017`
- DB utilisée: variable `DB_NAME`.

## 6) Santé et endpoints utiles

- Health endpoint: `GET /health` attendu en `200`.
- Endpoints utiles runbook:
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /auth/sessions`

## 7) Points de vigilance sécurité

- Ne jamais committer de secrets (JWT, mots de passe admin).
- Utiliser `STRICT_ENV=true` en production.
- `JWT_SECRET` fort et non placeholder.
- Le cookie refresh est `HttpOnly`; `Secure=true` en production.
- Protéger l’accès admin via JWT rôle `admin`.

## 8) Hypothèses de déploiement stables

- Déploiement derrière Traefik same-origin avec front recommandé.
- Endpoint santé utilisé pour readiness/liveness.
- Image immuable `sha-<commit_sha>` en environnement stable.
- Une unique instance admin logique est imposée par la donnée applicative (exactement un admin) ; stratégie multi-instance **À confirmer** côté orchestration.
