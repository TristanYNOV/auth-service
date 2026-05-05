# User deletion events

`auth-service` orchestre la suppression utilisateur. Les endpoints existants `DELETE /me` et `DELETE /admin/users/:id` ne font plus de hard delete direct: ils marquent l'utilisateur `pending_deletion`, creent un workflow et publient `user.deletion.requested`.

## Topologie

- Exchange: `domain.events`
- Type: `topic`
- Durable: oui
- Queue consommatrice: `auth-service.user-deletion`
- Binding consomme: `user.data.anonymized`
- Events publies: `user.deletion.requested`, `user.deleted`

La DLQ n'est pas activee dans cette V1. En cas d'erreur de finalisation, le message est `nack` avec requeue; en cas d'evenement invalide, le message est `ack` avec log d'erreur.

## Statuts utilisateur

- `active`: utilisateur autorise a se connecter et acceder aux routes protegees.
- `pending_deletion`: suppression demandee, login/refresh/JWT proteges refuses.
- `deleted`: workflow finalise, login/refresh/JWT proteges refuses.
- `deletion_failed`: erreur d'initialisation, login/refresh/JWT proteges refuses par securite.

## Workflow Mongo

Collection: `user_deletion_workflows`

Champs principaux:
- `userId`
- `status`: `pending | anonymizing | ready_to_delete | deleted | failed`
- `correlationId`
- `requestedBy`
- `reason`
- `requiredServices`
- `completedServices`
- `failedServices`
- `requestedAt`
- `finalizedAt`

Pour la V1, `requiredServices = ["analysis-store-service"]`.

## Envelope commun

```json
{
  "eventId": "uuid",
  "eventType": "user.deletion.requested",
  "version": 1,
  "occurredAt": "2026-05-04T15:00:00.000Z",
  "producer": "auth-service",
  "correlationId": "uuid",
  "data": {}
}
```

## user.deletion.requested

```json
{
  "eventId": "uuid",
  "eventType": "user.deletion.requested",
  "version": 1,
  "occurredAt": "2026-05-04T15:00:00.000Z",
  "producer": "auth-service",
  "correlationId": "uuid",
  "data": {
    "userId": "user-uuid",
    "requestedBy": "self",
    "reason": "user_request"
  }
}
```

## user.data.anonymized

Consomme par `auth-service`.

```json
{
  "eventId": "uuid",
  "eventType": "user.data.anonymized",
  "version": 1,
  "occurredAt": "2026-05-04T15:01:00.000Z",
  "producer": "analysis-store-service",
  "correlationId": "uuid",
  "data": {
    "userId": "user-uuid",
    "service": "analysis-store-service",
    "deletedResources": {
      "timelines": 0,
      "privatePanels": 0
    },
    "anonymizedResources": {
      "publicPanels": 0
    }
  }
}
```

## user.deleted

Publie lorsque tous les services requis ont confirme.

```json
{
  "eventId": "uuid",
  "eventType": "user.deleted",
  "version": 1,
  "occurredAt": "2026-05-04T15:02:00.000Z",
  "producer": "auth-service",
  "correlationId": "uuid",
  "data": {
    "userId": "user-uuid",
    "deletedAt": "2026-05-04T15:02:00.000Z"
  }
}
```

## Idempotence

- Une nouvelle demande HTTP pour un workflow deja `pending`, `anonymizing`, `ready_to_delete` ou `deleted` retourne le workflow existant sans republier.
- Si `analysis-store-service` est deja dans `completedServices`, il n'est pas ajoute deux fois.
- Si le workflow est deja `deleted`, `user.data.anonymized` est ignore et ack.
- `user.deleted` n'est publie que lorsque le workflow passe a `deleted`.

## Variables

- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`
- `RABBITMQ_QUEUE_AUTH`
