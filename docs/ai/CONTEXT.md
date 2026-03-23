# CONTEXT — Cadre du service

## Rôle du service

`auth-service` gère l’authentification et les sessions pour Analyse Basket:
- création de compte,
- login,
- émission/validation JWT,
- refresh/logout,
- endpoints profil (`/me`) et admin (`/admin/users`).

## Responsabilités

- Appliquer les règles d’authentification.
- Exposer un contrat HTTP stable pour front et infra.
- Gérer les sessions refresh (rotation/révocation).
- Garantir le RBAC `user/admin`.

## Frontières

### Front
- Le front appelle `/api/auth/...` (Traefik retire le préfixe).
- Le front envoie le Bearer token pour routes JWT.
- Le front utilise `credentials: true` pour refresh/logout.

### Infra
- L’infra fournit les variables runtime obligatoires.
- L’infra route via reverse proxy et surveille `/health`.
- L’infra gère les secrets hors dépôt.

## Invariants

- Access token en JWT HS256.
- Refresh token en cookie HttpOnly (`refreshToken`) et jamais en JSON.
- Register force toujours `roles=['user']`.
- Les routes admin exigent rôle `admin`.
- Variables `JWT_SECRET`, `DATABASE_URL`, `DB_NAME`, `JWT_EXPIRES_IN` obligatoires.

## Zones sensibles

- Secrets (`JWT_SECRET`, `ADMIN_PASSWORD`) et placeholders.
- Contrat de routes partagé avec le front.
- Contrat infra (variables, reverse proxy, healthcheck).
- Comportements d’erreur dépendants de la sécurité (`401/403/409`).

## Conventions

- Une seule source de vérité par sujet documentaire.
- Exemples copiables et alignés avec les contrats réels.
- En cas d’incertitude: écrire `À confirmer`.
