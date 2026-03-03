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

## JWT Contract

- **Format d’envoi attendu**: `Authorization: Bearer <token>`.
- **Algorithme de signature**:
  - Le code ne force pas explicitement `algorithm` dans `JwtModule.register(...)`.
  - En pratique, c’est l’algorithme par défaut de `jsonwebtoken` qui s’applique (TODO: figer explicitement l’algo dans la config pour lever toute ambiguïté contractuelle).
- **Clé de signature / validation**:
  - Configurée via `process.env.JWT_SECRET` avec fallback `'secret'` dans `AuthModule`.
  - Validation JWT utilise la même variable `JWT_SECRET` (même fallback) dans `JwtStrategy`.
- **Durée de vie**:
  - `expiresIn: process.env.JWT_EXPIRES_IN || '30d'`.
  - Claims temporelles ajoutées par la librairie: `iat` et `exp`.
- **Refresh token**: absent dans le code actuel.

### Claims présentes dans le payload

Source de construction du payload:
- Le service auth charge l’utilisateur par email.
- Il retire uniquement `password` puis signe le reste (`jwtService.sign(user)`).

Claims documentées de façon factuelle:
- `_id`: `string` (ObjectId sérialisé) — identifiant Mongo de l’utilisateur.
- `pseudo`: `string` — pseudo utilisateur.
- `email`: `string` — email utilisateur.
- `iat`: `number` (timestamp Unix secondes) — date d’émission du token.
- `exp`: `number` (timestamp Unix secondes) — date d’expiration du token.

TODO (non spéculatif):
- Le code signe un objet issu d’un document Mongoose étalé (`{ ...findUser }`). La présence exacte/garantie d’éventuels champs additionnels non métier n’est pas contractualisée explicitement dans le code.

### Identité utilisateur canonique (inter-services)

- **Claim canonique à utiliser comme `userId`**: `_id`.
- `sub` n’est pas défini dans l’implémentation actuelle.
- Recommandation d’évolution: TODO standardiser vers `sub` plus tard, sans casser la compatibilité.

### Exemple de payload JWT décodé (valeurs fictives)

```json
{
  "_id": "6750d39841f6fa572ff14549",
  "pseudo": "coach42",
  "email": "coach42@example.com",
  "iat": 1734000000,
  "exp": 1736592000
}
```

### Règles d’utilisation inter-services

- Ne jamais envoyer `userId` en clair dans le body/query quand il peut être dérivé du JWT validé.
- Les services aval doivent faire confiance à l’identité **uniquement** si le token a déjà été validé en amont.
- TODO: la validation centralisée au gateway/Traefik est prévue plus tard; en attendant, chaque service protégé doit valider le JWT côté application.

## Security notes (MVP)

- TODO: imposer `JWT_SECRET` obligatoire hors dev (supprimer fallback `'secret'`).
- TODO: fixer explicitement l’algorithme JWT côté config.
- TODO: ajouter refresh token + stratégie de rotation/révocation.
- TODO: ajouter rate limiting / anti-bruteforce sur `POST /auth/login` (idéalement au gateway).
- TODO: éviter l’exposition de données sensibles (`password` hash) dans certaines réponses utilisateurs.

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
