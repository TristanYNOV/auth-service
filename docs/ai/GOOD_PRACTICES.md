# GOOD_PRACTICES — Modifications via IA

## Règles générales

- Ne rien inventer.
- Ne pas dupliquer l’information.
- Maintenir un document de référence unique par sujet.
- Garder des exemples copiables (curl, payload JSON, snippets infra).
- Si une information est incertaine: écrire `À confirmer`.

## Règles de maintenance documentaire

- Mettre à jour la doc concernée dès qu’un contrat change (front, infra, auth).
- Vérifier les chemins et liens internes après déplacement/renommage.
- Supprimer les anciens fichiers obsolètes après fusion.
- Préférer une structure simple avec peu de fichiers.

## Garde-fous IA spécifiques à ce repo

- Si la demande porte sur la documentation, ne pas toucher au code applicatif.
- Ne pas modifier `src/`, Prisma, tests, CI/CD, scripts npm, Dockerfile pour une tâche doc.
- Conserver la cohérence entre `README.md`, `docs/contract-front/` et `docs/infra/`.
