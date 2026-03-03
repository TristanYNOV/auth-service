# CONTEXT

## Produit

Application d’analyse vidéo sportive.

- Front : application Angular (timeline / séquenceur / vidéo dans le navigateur).
- Backend : architecture microservices (1 repo = 1 service).

## Services connus

- `front-service`
- `auth-service` (ce repo)

## Point d’entrée HTTP

Traefik est l’unique point d’entrée.

Convention actuelle/prévue :
- exposition externe du auth-service sous `/api/auth/*`,
- `StripPrefix('/api/auth')` par Traefik avant transmission au auth-service.

Conséquence :
- le front doit appeler des URLs **relatives** `/api/auth/...` pour rester en same-origin et éviter le CORS.

## Périmètre volontaire de auth-service

Le service d’auth est découplé des notions métier avancées (clubs/équipes/permissions fines).

## Cible MVP auth

- Register (création utilisateur)
- Login (émission JWT)
- Endpoint minimal protégé pour valider un token (actuellement `GET /auth/test`)
- Health endpoint pour l’infra (**absent actuellement**, voir TODO)

## JWT et trajectoire d’intégration

- Le JWT émis par `auth-service` est destiné à être consommé par les autres services.
- La vérification JWT centralisée au niveau Traefik n’est pas implémentée dans ce repo à date.
- La documentation de ce repo prépare cette intégration (base path, headers, statuts, conventions).
