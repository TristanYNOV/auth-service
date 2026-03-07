# ERRORS

Contrat d’erreur global stable:

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "timestamp": "2026-03-06T12:34:56.789Z",
  "path": "/admin/users"
}
```

## Règles

- `message` est toujours une **string**.
- Si Nest renvoie un tableau de validation, il est concaténé avec `"; "`.
- Les messages métier existants sont préservés.

## Cas clés

### `POST /auth/login` invalide

- `401`
- message exact: `Unauthorized: invalid credentials or user not found.`

### `GET /admin/users` sans token

- `401`
- shape stable ci-dessus.

### `GET /admin/users` avec token user

- `403`
- shape stable ci-dessus.
