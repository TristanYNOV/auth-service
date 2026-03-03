# FEATURES

## Overview

Ce fichier résume l’état **réel** du backend `auth-service` tel qu’implémenté dans le code source NestJS. Il sert de base de discussion produit/dev sur « ce qui est fait » vs « ce qui manque », sans inventer de routes ni de comportements.

## Implemented

- Gestion utilisateurs via contrôleur `users` :
  - `POST /users` (création utilisateur avec hash bcrypt du mot de passe)
  - `GET /users` (liste des utilisateurs)
  - `GET /users/searchId/:id`
  - `GET /users/searchPseudo/:pseudo`
  - `GET /users/searchEmail/:email`
  - `PATCH /users/:id` (update, avec re-hash du champ `password`)
  - `DELETE /users/:id`
- Authentification JWT via contrôleur `auth` :
  - `POST /auth/login` (via `LocalGuard`, retourne un JWT sous forme de chaîne brute)
  - `GET /auth/test` (protégé par `JwtGuard`, sert de validation d’accès token)
- Validation globale active (`ValidationPipe`) avec `whitelist: true` et `forbidNonWhitelisted: true`.
- JWT configuré avec :
  - `JWT_SECRET` (fallback `secret`)
  - `JWT_EXPIRES_IN` (fallback `30d`)
- Port d’écoute applicatif : `process.env.PORT ?? 3000`.

## Not implemented / Missing

Priorité haute (MVP attendu):
1. Endpoint de profil minimal (`GET /me` ou équivalent) absent.
2. Endpoint health (`GET /health`) absent.
3. Contrat d’erreur stable homogène (400/401/404/409) non unifié selon endpoints.

Priorité moyenne:
4. Refresh token absent.
5. Logout explicite absent.
6. Reset password absent.
7. Standardisation des claims JWT (ex: `sub`) non explicite.


## Routes / JWT / Paramètres / Interfaces (référence front)

Le détail exploitable côté front (paths, méthodes, besoin JWT, types `request/response`) est centralisé dans `docs/contracts/ROUTES.md`.

- Ce fichier inclut un tableau récapitulatif au format markdown en en-tête.
- Ce fichier expose aussi les structures d'échange front/back (`LoginRequest`, `CreateUserRequest`, `UpdateUserRequest`, `UserEntity`, etc.) en format markdown.

## Assumptions & Limitations

- Le register n’est pas sous `/auth/register` ; il est actuellement exposé via `POST /users`.
- Le chemin de login via Traefik devient `/api/auth/auth/login` (préfixe gateway + préfixe contrôleur).
- Le endpoint `GET /auth/test` ne renvoie pas de payload métier explicite (usage surtout technique).
- Le service renvoie actuellement des objets utilisateurs contenant le hash `password` sur plusieurs routes.
- Pas de mécanisme de refresh token ni de rotation de clé JWT dans le code actuel.

## Local run

```bash
npm install
npm run start:dev
```

- URL directe par défaut : `http://localhost:3000`
- URL via Traefik (convention projet) : `http://localhost/api/auth`

---

**Note importante (source de vérité front):** `docs/contracts/ROUTES.md` est conçu pour être copié/collé côté front. Toute modification d’API backend (nouvelle route, changement de path/méthode/protection) doit mettre à jour ce fichier dans le même changement.
