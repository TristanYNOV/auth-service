# JWT

## Émission

Le JWT est émis lors de `POST /auth/login` après validation email/mot de passe.

## Format de réponse login

La réponse est une chaîne JWT brute (pas un objet JSON).

## Signature / secret

Configuration `JwtModule.register` :
- `secret = process.env.JWT_SECRET || 'secret'`

## Expiration

Configuration `signOptions.expiresIn` :
- `process.env.JWT_EXPIRES_IN || '30d'`

## Claims émis

Le service récupère un document utilisateur Mongo, retire `password`, puis signe le reste.
En pratique, claims attendus au minimum (selon user trouvé):
- `_id`
- `pseudo`
- `email`

D’autres champs mongoose internes peuvent apparaître selon la forme effective de l’objet signé.

## Validation

La stratégie JWT lit le token via `Authorization: Bearer <token>` et valide:
- signature avec le même secret,
- expiration (`ignoreExpiration: false`).

Le payload validé est renvoyé tel quel (`validate(payload) { return payload; }`).

## TODO sécurité JWT

- Supprimer le secret par défaut en environnement non-dev.
- Définir explicitement un schéma de claims (sub, iat, exp, éventuellement iss/aud).
- Ajouter rotation/gestion de clé.
- Ajouter refresh token si requis par le produit.
