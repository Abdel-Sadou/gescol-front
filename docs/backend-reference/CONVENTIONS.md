# CONVENTIONS — GESCOL

À fournir en contexte dans **chaque** prompt Claude Code, au même titre que
MASTER_CONTEXT.md. Objectif : garantir que des modules générés dans des
sessions séparées (ex. Paramétrage et Personnel en parallèle) restent
cohérents entre eux sans concertation explicite.

---

## 1. DTO / Entity

- Les entités JPA ne sont **jamais** exposées directement dans un controller.
- Chaque entité a un `XxxRequest` (entrée, avec validation) et un
  `XxxResponse` (sortie) dédiés.
- Mapping via MapStruct (`XxxMapper` interface), pas de mapping manuel
  répété dans les services.

## 2. Pagination

Toute liste paginée retourne systématiquement la même enveloppe :

```json
{
  "content": [ ... ],
  "page": 0,
  "size": 20,
  "totalElements": 134,
  "totalPages": 7
}
```

Paramètres de requête : `?page=0&size=20&sort=nom,asc` — jamais d'autres noms
de paramètres (pas de `pageNumber`, `perPage`, etc.).

**Champs triables en liste blanche** (établi suite au handoff PROMPT_02) :
chaque endpoint de liste paginée définit explicitement la liste des champs sur
lesquels le tri est autorisé (ceux réellement indexés), et rejette ou ignore
silencieusement toute valeur de `sort` hors de cette liste — jamais de tri
sur un champ arbitraire non validé côté serveur.

## 3. Format de réponse et gestion d'erreurs

- Réponse réussie : l'objet ou la liste paginée directement, pas d'enveloppe
  `{ success: true, data: ... }`.
- Erreur : géré globalement par un `@ControllerAdvice` unique, jamais de
  try/catch ad hoc par controller. Format constant :

**Exceptions actées** (établies en PROMPT_01, à respecter dans les modules
suivants, pas à "corriger") :
- Les endpoints `PUT` de mise à jour de configuration (ex.
  `/api/etablissement/courant`) ignorent les champs `null` du body plutôt que
  d'écraser la ressource entière (`NullValuePropertyMappingStrategy.IGNORE`
  côté MapStruct) — comportement volontaire proche d'un `PATCH`, pour éviter
  qu'un appel partiel n'efface accidentellement logo/couleurs.
- Un endpoint de lecture exposant une donnée non-sensible et utile à tous les
  rôles authentifiés (ex. branding de l'établissement) peut utiliser
  `@PreAuthorize("isAuthenticated()")` plutôt qu'un rôle nommé — réservé aux
  cas réellement non-sensibles, pas un raccourci par défaut.

```json
{
  "timestamp": "2026-08-20T10:15:00Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Le champ 'nom' est obligatoire",
  "path": "/api/eleves"
}
```

- Exceptions métier dédiées (`EntityNotFoundException` → 404,
  `BusinessRuleViolationException` → 409, `ValidationException` → 400) —
  jamais de `RuntimeException` générique remontée telle quelle au client.

**Distinction 403 vs 409** (établie en PROMPT_08) : `AccessForbiddenException`
(→ 403) pour un contrôle d'accès sur une ressource précise (ex. un PARENT qui
consulte un élève qui n'est pas le sien, R16) ; `BusinessRuleViolationException`
(→ 409) réservé aux violations d'état métier transactionnel (ex. note déjà
validée, R13). Note historique : R12 (PROMPT_06) utilise 409 alors qu'il
s'agit du même type de situation qu'R16 — incohérence connue, non corrigée
rétroactivement (pas de bug fonctionnel, juste un code HTTP imparfait),
à aligner si l'occasion se présente.
- Aucune stack trace ni détail d'implémentation dans une réponse d'erreur.

## 4. Validation

- Toutes les règles de validation de champ (obligatoire, longueur, format)
  sont posées en annotations Bean Validation sur le `Request` DTO, vérifiées
  via `@Valid` au niveau controller — jamais de validation manuelle dispersée
  dans le service.
- Les règles métier (R1 à R9 du MASTER_CONTEXT — ex. suppression élève
  conditionnée) sont vérifiées dans le service, pas dans le DTO.

## 5. Dates et identifiants

- Toutes les dates/heures : `java.time` (`LocalDate`, `LocalDateTime`),
  jamais `java.util.Date`.
- Sérialisation JSON en ISO-8601 (comportement par défaut Jackson avec le
  module JavaTime — à activer explicitement).
- Tous les identifiants d'entité : `UUID`, jamais `Long`/auto-increment.

## 6. Nommage

- Noms de domaine (entités, champs métier) en français, conformes au
  MASTER_CONTEXT : `Eleve`, `dateNaissance`, `soldeRestant` — pas de mélange
  franglais (`eleveDate`, `remainingSolde`).
- Chemins REST en kebab-case anglais technique standard :
  `/api/taux-scolarite`, `/api/emplois-du-temps`.
- Classes Java en PascalCase, méthodes/variables en camelCase — standard
  Java, pas de dérogation.

## 7. Sécurité par endpoint

- Chaque endpoint pose explicitement son autorisation via `@PreAuthorize`,
  en référençant les constantes de `RoleUtilisateur` du MASTER_CONTEXT —
  jamais de vérification de rôle manuelle dans le corps de la méthode.
- Les actions listées comme "soumises à autorisation" dans MASTER_CONTEXT §7
  (suppression élève, modification taux, etc.) utilisent une permission
  dédiée en plus du rôle, pas seulement `hasRole(...)`.

## 8. Tests

- Un module en phase de construction initiale (premher passage) : test
  manuel suffit, sauf pour les briques transverses sensibles (auth, calcul
  financier atomique) où un test d'intégration minimal est requis — voir
  PROMPT_01 pour l'exemple de référence.
- Un module qu'on retouche après qu'il soit considéré stable : test de
  non-régression requis avant modification.
