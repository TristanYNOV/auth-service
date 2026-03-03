# SECURITY

## État actuel (code existant)

## Mot de passe

- Hash via `bcrypt.hash(rawPassword, salt)`.
- `salt` configuré par `SALT` (fallback `10`).
- Vérification login via `bcrypt.compare`.

## Validation d’entrée

Validation globale NestJS:
- `whitelist: true`
- `forbidNonWhitelisted: true`

DTO register (`CreateUserDto`):
- `pseudo`: string non vide
- `email`: email valide
- `password`: `IsStrongPassword({ minLength: 8, minUppercase: 1, minNumbers: 1 })`

DTO login (`AuthPayloadDto`):
- `email`: email valide
- `password`: même politique strong password

DTO update (`UpdateUserDto`):
- `pseudo` optionnel string
- `email` optionnel string (pas validé comme email)
- `password` validé fort mais non `@IsOptional()`

## JWT

- Secret configurable par `JWT_SECRET` (fallback `'secret'` à sécuriser).
- Expiration configurable par `JWT_EXPIRES_IN` (fallback `30d`).
- Transport attendu: header Bearer.

## Données sensibles

- Les endpoints users retournent actuellement le champ `password` hashé dans les réponses.
- Ce comportement doit être réduit (masquage/sérialisation) avant production.

## Recommandations gateway (Traefik)

À implémenter côté gateway (hors repo pour l’instant):
- Rate limiting par IP + éventuellement par route sensible (`/auth/login`).
- Brute-force mitigation (backoff / throttling / lock temporaire).
- Propagation d’un correlation id (`X-Request-Id`) vers les services.
- En-têtes sécurité standard.

## Journaux

- Éviter de logger les payloads bruts contenant email/password.
- Éviter d’écrire le token JWT en logs applicatifs.
