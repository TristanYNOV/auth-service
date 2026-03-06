# STATE OF PLAY — auth-service

## 1) TL;DR
- Le service expose aujourd’hui des routes `users`, `auth/login`, `me` et `health`.
- L’authentification actuelle repose sur Passport Local (`/auth/login`) puis JWT Bearer pour `/me`.
- Le login renvoie **un JWT brut de type string** (pas un objet JSON enveloppant).
- Les routes `/me` sont protégées par `JwtGuard`.
- Les routes `/users` sont actuellement non protégées (aucun guard appliqué).
- Les réponses utilisateurs passent par `UserPublicDto` (id/pseudo/email), sans `password`.
- La config JWT utilise `JWT_SECRET` et `JWT_EXPIRES_IN` avec fallbacks codés en dur (`secret`, `30d`).
- Mongo est configuré via `DATABASE_URL` + `DB_NAME` avec fallbacks.
- Docker/compose et kit Postman sont présents dans le repo.
- Côté admin: aucune route `/admin`, aucun RBAC guard, aucun rôle dans le schéma utilisateur (on part bien de 0).

## 2) Comment lancer le service (Local & Docker)

### Scripts npm présents
D’après `package.json`:
- Build: `npm run build`
- Start: `npm run start`, `npm run start:dev`, `npm run start:debug`, `npm run start:prod`
- Qualité/tests: `npm run lint`, `npm run test`, `npm run test:watch`, `npm run test:cov`, `npm run test:debug`, `npm run test:e2e`
- Docker helper scripts: `npm run docker:up`, `npm run docker:down`, `npm run docker:logs`

### Local
- Installation: `npm install`
- Lancement dev: `npm run start:dev`
- Le port d’écoute vient de `PORT` avec fallback `3000` (`src/main.ts`).

### Docker
Des fichiers `Dockerfile` et `docker-compose.yml` existent.

Commandes:
- `cp .env.example .env`
- `docker compose up -d --build`
- `docker compose logs -f auth-service`
- `docker compose down`

Ports exposés via compose:
- API: `3000:3000`
- Mongo: `27017:27017`

## 3) Configuration & variables d’environnement

### Variables réellement lues dans le code (`process.env.*`)

| Variable | Où lue | Fallback code | Obligatoire au runtime | Notes |
|---|---|---|---|---|
| `DB_NAME` | `src/main.ts` (console log), `src/app.module.ts` (mongo `dbName`) | `auth_db` (dans `AppModule`) | Non strictement (fallback) | Utilisée aussi pour log au boot. |
| `PORT` | `src/main.ts` | `3000` | Non strictement (fallback) | Port d’écoute Nest. |
| `DATABASE_URL` | `src/app.module.ts` | `mongodb://localhost:3000` | Non strictement (fallback) | URI Mongo; fallback atypique pour Mongo (port 3000). |
| `JWT_SECRET` | `src/auth/auth.module.ts`, `src/auth/strategies/jwt.strategy.ts` | `secret` | Non strictement (fallback) | Sert à signer + vérifier JWT. |
| `JWT_EXPIRES_IN` | `src/auth/auth.module.ts` | `30d` | Non strictement (fallback) | TTL de signature JWT. |
| `SALT` | `src/utils/bcrypt.ts` | `10` | Non strictement (fallback) | Coût bcrypt pour hash de mot de passe. |

### Variables demandées explicitement
- `PORT`: présent et lu.
- `MONGO_URI` / `MONGODB_URI`: **non trouvées dans le code**.
- `DATABASE_URL`: présent et lu (équivalent utilisé dans ce repo).
- `JWT_SECRET`: présent et lu.
- `JWT_EXPIRES_IN`: présent et lu.
- CORS: **non trouvé** (`enableCors` non vu dans `src/main.ts`).
- Traefik: pas de variable d’env spécifique trouvée dans le code applicatif.

### `.env.example`
Le fichier existe et contient:
- `PORT`, `DATABASE_URL`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- ainsi que `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PSEUDO` (commentés comme “Optional dev bootstrap values”).

Écart factuel: les variables `ADMIN_*` sont présentes dans `.env.example` mais **aucune lecture `process.env.ADMIN_*` n’est trouvée dans `src/`**.

## 4) Architecture NestJS (modules principaux)

### Modules
- `AppModule`
  - imports: `ConfigModule.forRoot(isGlobal: true)`, `MongooseModule.forRoot(...)`, `UserModule`, `AuthModule`
  - controllers: `HealthController`
- `UserModule`
  - Mongoose feature `User`
  - providers: `UserService`
  - controllers: `UserController`, `MeController`
  - exports: `UserService`
- `AuthModule`
  - Mongoose feature `User`
  - imports: `PassportModule`, `JwtModule.register(...)`
  - providers: `AuthService`, `LocalStrategy`, `JwtStrategy`, `UserService`
  - controllers: `AuthController`

### Controllers + prefixes
- `AuthController`: `@Controller('auth')`
- `UserController`: `@Controller('users')`
- `MeController`: `@Controller()` (routes `/me`)
- `HealthController`: `@Controller()` (route `/health`)

### Services principaux
- `AuthService`
- `UserService`

### Guards / Strategies
- Guards: `LocalGuard` (`AuthGuard('local')`), `JwtGuard` (`AuthGuard('jwt')`)
- Strategies: `LocalStrategy`, `JwtStrategy`

## 5) Routes réellement exposées (source de vérité)

| Method | Path | Controller#handler | Public/Protected | Guard(s) | Body DTO | Response DTO | Notes |
|---|---|---|---|---|---|---|---|
| GET | `/health` | `HealthController#health` | Public | aucun | aucun | objet inline `{ status, timestamp }` | Endpoint de santé. |
| POST | `/auth/login` | `AuthController#login` | Protected (auth locale) | `LocalGuard` | body attendu par `LocalStrategy` (`email`, `password`) | `string` | Retourne le JWT brut en string (`req.user`). |
| POST | `/users` | `UserController#createUser` | Public | aucun | `CreateUserDto` | `UserPublicDto` | Hash du password avant création, réponse sans password. |
| GET | `/users` | `UserController#getAllUser` | Public | aucun | aucun | `UserPublicDto[]` | Liste users sans password. |
| GET | `/users/searchId/:id` | `UserController#getUserById` | Public | aucun | param `id` | `UserPublicDto` | Validation format ObjectId. |
| GET | `/users/searchPseudo/:pseudo` | `UserController#getUSerByPseudo` | Public | aucun | param `pseudo` | `UserPublicDto` |  |
| GET | `/users/searchEmail/:email` | `UserController#getUSerByEmail` | Public | aucun | param `email` | `UserPublicDto` |  |
| DELETE | `/users/:id` | `UserController#deleteUser` | Public | aucun | param `id` | `{ user: UserPublicDto; message: string }` |  |
| PATCH | `/users/:id` | `UserController#updateUser` | Public | aucun | `UpdateUserDto` | `UserPublicDto` | Hash password si présent dans payload. |
| GET | `/me` | `MeController#getMe` | Protected | `JwtGuard` (au niveau contrôleur) | aucun | `UserPublicDto` | Utilise `req.user.sub` pour charger l’utilisateur courant. |
| PATCH | `/me` | `MeController#updateMe` | Protected | `JwtGuard` (au niveau contrôleur) | `UpdateUserDto` | `UserPublicDto` | Hash password si présent. |
| DELETE | `/me` | `MeController#deleteMe` | Protected | `JwtGuard` (au niveau contrôleur) | aucun | `{ user: UserPublicDto; message: string }` |  |

Observation factuelle: aucune de ces routes ne renvoie le champ `password` dans les réponses des controllers observés.

## 6) Auth & JWT contract (factuel)

### Flow login
1. `POST /auth/login` passe par `LocalGuard`.
2. `LocalGuard` délègue à `LocalStrategy` (champ username mappé sur `email`).
3. `LocalStrategy.validate(username, password)` appelle `AuthService.validateUser({ email, password })`.
4. `AuthService`:
   - charge l’utilisateur avec password via `UserService.getUserByEmailWithPassword(email)`;
   - compare `bcrypt.compare(plain, hash)`;
   - construit un payload JWT `{ sub, pseudo, email }`;
   - signe et retourne `jwtService.sign(payload)`.
5. `AuthController.login` renvoie directement `req.user` (token string).

### JWT (signature / vérification)
- Payload signé: `sub`, `pseudo`, `email` (pas de `roles` observé).
- Secret de signature: `process.env.JWT_SECRET || 'secret'`.
- Expiration: `process.env.JWT_EXPIRES_IN || '30d'`.
- Algorithme: **non explicitement fixé dans la config visible** (dépend de la valeur par défaut de la lib JWT).

### `req.user` côté JWT
- `JwtStrategy.validate(payload)` retourne le payload tel quel.
- Donc `req.user` sur routes protégées JWT est de type `JwtPayload` avec au minimum:
  - `sub: string`
  - `email: string`
  - `pseudo: string`
  - potentiellement `iat`, `exp`.

## 7) “Admin” — état actuel
- Aucune route `/admin`: **confirmé** (pas de controller/prefix `/admin` trouvé dans `src/`).
- Aucun guard RBAC / `RolesGuard`: **confirmé** (pas de classe/usage trouvé).
- Aucun champ `roles` dans l’entité/schéma utilisateur: **confirmé** (`User` contient `pseudo`, `email`, `password` uniquement).
- Aucun bootstrap admin dans le code applicatif: **confirmé dans `src/`**.
  - Note: `.env.example` contient des variables `ADMIN_*` mais elles ne sont pas utilisées par le code (à confirmer si bootstrap externe hors repo est prévu).

## 8) Sécurité — risques & quick wins (sans implémenter)
- Routes `/users` publiques (lecture/liste/update/delete sans guard) — risque d’accès non authentifié à des opérations sensibles.
  - Où: `src/user/User.controller.ts`.
  - Quick win: protéger endpoints sensibles (`JwtGuard` minimum), puis RBAC selon besoins.
- Fallback JWT secret en dur (`'secret'`) — risque en cas d’oubli de variable d’env.
  - Où: `src/auth/auth.module.ts`, `src/auth/strategies/jwt.strategy.ts`.
  - Quick win: rendre `JWT_SECRET` obligatoire au démarrage (fail-fast).
- Algorithme JWT non explicite dans config — risque contractuel inter-services / durcissement incomplet.
  - Où: config `JwtModule.register(...)` dans `src/auth/auth.module.ts`.
  - Quick win: fixer explicitement l’algorithme accepté/signé (à confirmer selon standard orga).
- Fallback Mongo `mongodb://localhost:3000` atypique — risque de mauvaise config silencieuse.
  - Où: `src/app.module.ts`.
  - Quick win: fallback cohérent Mongo (`27017`) ou variable obligatoire.
- Message d’erreur “getUserByEmail”/“getUserByPseudo” écrase la distinction not-found vs bad-request (catch global).
  - Où: `src/user/User.service.ts`.
  - Quick win: préserver statuts précis pour éviter ambiguïté fonctionnelle.

## 9) Postman — état actuel

### Fichiers présents
- Collections:
  - `postman/auth-service.postman_collection.json`
  - `postman/auth-service.collection.json` (identique à `auth-service.postman_collection.json` au hash SHA-256 observé)
- Environnements:
  - `postman/auth-service.local.postman_environment.json`
  - `postman/env.direct.json`
  - `postman/env.traefik.json`
- Documentation: `postman/README.md`

### Variables utilisées (observées)
`useTraefik`, `baseUrlTraefik`, `baseUrlDirect`, `baseUrl`, `userPseudo`, `userEmail`, `userPassword`, `accessTokenUser`, `createdUserId`, `userId`, `auth_email`, `auth_password`, `auth_pseudo`, `first_name`, `last_name`.

### Scripts observés
- Collection pre-request:
  - calcule `baseUrl` selon `useTraefik`;
  - injecte `Authorization: Bearer <token>` si `accessTokenUser` existe;
  - nettoie token (supprime préfixe `Bearer ` et guillemets).
- Register pre-request:
  - génère email/password/pseudo aléatoires;
  - renforce password (suffixe `A1!`);
  - stocke dans `collectionVariables`.
- Register test:
  - stocke `createdUserId` si présent.
- SignIn test:
  - lit la réponse (JWT string ou `{access_token}`), nettoie et stocke token;
  - vérifie format JWT (3 segments);
  - décode payload et stocke `userId=sub`, `auth_email`, `auth_pseudo`.
- Me - Get test:
  - log header Authorization/token masqué;
  - test explicite de présence/format du Bearer token.
- Session - Logout pre-request:
  - supprime `accessTokenUser` et `userId` des variables.

### Incohérences potentielles
- `.env.example` contient des variables `ADMIN_*`, non reflétées dans les environnements Postman présents (normal au vu de l’absence de features admin dans le code).
- Deux collections quasi équivalentes (`auth-service.postman_collection.json` et `auth-service.collection.json`) — possible duplication documentaire à confirmer.

## 10) Traefik / Base URLs (si applicable)
- Côté code Nest (`src/main.ts`), aucun préfixe global (`setGlobalPrefix`) n’est configuré.
- Le document `docs/INTEGRATION.md` indique un passage via Traefik:
  - entrée publique `/api/auth/*`
  - `StripPrefix('/api/auth')`
  - backend reçoit les chemins sans préfixe.
- Les environnements Postman utilisent:
  - direct: `http://localhost:3000`
  - Traefik: `http://localhost/api/auth`

## 11) Annexes — fichiers clés
- Bootstrap/app: `src/main.ts`, `src/app.module.ts`
- Auth: `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/auth/auth.module.ts`
- Guards/strategies: `src/auth/guards/*.ts`, `src/auth/strategies/*.ts`
- Users: `src/user/User.controller.ts`, `src/user/User.service.ts`, `src/user/dto/*.ts`
- JWT types: `src/auth/types/jwt-payload.type.ts`, `src/auth/types/authenticated-request.type.ts`
- Schémas: `src/schemas/User.schema.ts`, `src/schemas/UpdateUser.schema.ts`
- Env/infra: `.env.example`, `docker-compose.yml`, `Dockerfile`
- Postman: `postman/*.json`, `postman/README.md`
