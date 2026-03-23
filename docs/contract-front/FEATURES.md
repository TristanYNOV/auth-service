# FEATURES — Contrat front

## Objectif

Ce document synthétise le périmètre fonctionnel actuel utile au front.

## Parcours couverts

### Parcours publics
- Vérification de disponibilité service: `GET /health`
- Inscription: `POST /users`
- Login: `POST /auth/login`
- Refresh de session: `POST /auth/refresh`
- Logout session courante: `POST /auth/logout`

### Parcours utilisateur connecté (`role=user`)
- Lire son profil: `GET /me`
- Modifier son profil: `PATCH /me`
- Supprimer son compte: `DELETE /me`

### Parcours gestion des sessions (JWT requis)
- Lister ses sessions: `GET /auth/sessions`
- Révoquer une session: `DELETE /auth/sessions/:id`
- Révoquer toutes les sessions: `DELETE /auth/sessions`

### Parcours admin (`role=admin`)
- Lister les utilisateurs: `GET /admin/users`
- Modifier un utilisateur: `PATCH /admin/users/:id`
- Supprimer un utilisateur: `DELETE /admin/users/:id`

## Attentes côté front

- Appeler les routes via Traefik en **URL relative**: `/api/auth/...`
- Envoyer `Authorization: Bearer <accessToken>` sur routes JWT.
- Envoyer les appels refresh/logout avec `credentials: true` pour transmettre le cookie HttpOnly.
- Stocker l’access token en mémoire (pas dans le body du refresh cookie, pas de refresh token en JSON).
- Utiliser `GET /me` comme source de vérité du profil connecté.

## Scope / hors scope

### Dans le scope
- Authentification et sessions multi-appareils.
- RBAC simple `user/admin`.
- Contrats de routes et d’erreurs nécessaires à l’intégration front.

### Hors scope
- Gestion métier Analyse Basket (vidéo, timeline, séquenceur, etc.).
- Permissions fines au-delà des rôles `user/admin`.
- Décisions UI/UX front.
- Validation JWT centralisée Traefik: **À confirmer**.
