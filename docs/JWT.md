# JWT

## Émission

Le JWT est émis lors de `POST /auth/login` après validation email/mot de passe.

## Format de réponse login

La réponse est une chaîne JWT brute (pas un objet JSON).

## Signature / secret

Configuration `JwtModule.register` :
- `secret = JWT_SECRET` (obligatoire)
- `signOptions.algorithm = 'HS256'` (explicite)
- `signOptions.expiresIn = JWT_EXPIRES_IN` (obligatoire)

## Claims émis

Payload signé:
- `sub`
- `email`
- `pseudo`
- `roles`

## Claims optionnels

- Si `JWT_ISSUER` est défini, `issuer` est ajouté à la signature et validé côté stratégie.
- Si `JWT_AUDIENCE` est défini, `audience` est ajouté à la signature et validé côté stratégie.
- Si ces variables sont absentes, aucune contrainte `iss/aud` n’est imposée.

## Validation

La stratégie JWT lit le token via `Authorization: Bearer <token>` et valide:
- signature HS256,
- expiration (`ignoreExpiration: false`),
- secret via `JWT_SECRET`,
- issuer/audience uniquement si configurés.
