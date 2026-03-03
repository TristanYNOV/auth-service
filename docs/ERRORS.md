# ERRORS

Format d’erreur observé : format standard NestJS `HttpException`.

## Structure

### Cas `HttpException` avec message string

```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

### Cas validation DTO (`ValidationPipe` globale)

```json
{
  "message": [
    "property foo should not exist",
    "password is not strong enough"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## Erreurs par endpoint

## `POST /auth/login`

- `401` `Invalid credentials` si mot de passe incorrect.
- `400` `Failed to get user by email` si email non trouvé (implémentation actuelle de `UserService.getUserByEmail`).

## `POST /users`

- `400` erreurs de validation DTO.
- `500` erreurs DB possibles (ex: conflit email unique) car pas de mapping explicite vers `409`.

## `GET /users/searchId/:id`

- `400` `User ID: <id> doesn't match format` si ObjectId invalide.
- `404` `User not found`.

## `GET /users/searchPseudo/:pseudo`

- `400` `Failed to get user by alias` (inclut le cas non trouvé, car exception interne capturée puis remappée).

## `GET /users/searchEmail/:email`

- `400` `Failed to get user by email` (inclut le cas non trouvé, car exception interne capturée puis remappée).

## `DELETE /users/:id`

- `400` id invalide.
- `404` `User not found`.

## `PATCH /users/:id`

- `400` id invalide.
- `400` validation DTO (mot de passe faible, propriété non autorisée, etc.).

## `GET /auth/test`

- `401` non autorisé (token absent/invalide/expiré).

## Notes de stabilité

- Les messages d’erreur ne sont pas homogènes selon les endpoints.
- Certaines erreurs métier (`not found`) sont converties en `400` dans `UserService`.
- Une stabilisation de contrat (codes + payload) est recommandée en TODO MVP.
