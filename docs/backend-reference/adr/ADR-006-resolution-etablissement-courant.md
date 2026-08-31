# ADR-006 — Résolution de l'établissement courant via les claims JWT

**Statut** : Adopté

## Contexte
Tout service manipulant une entité scopée (`EtablissementScopedEntity`) a besoin
de connaître l'établissement de l'utilisateur courant. `JwtService` embarque déjà
`etablissementId` dans les claims du token (cf. handoff PROMPT_01). Deux options :
lire ce claim depuis le contexte de sécurité (aucune requête SQL), ou refaire un
`findFirstByActifTrue()` à chaque appel de service (une requête SQL par appel,
et qui ne fonctionne plus dès qu'un second établissement existe).

## Décision
1. `UserDetailsServiceImpl` construit un principal enrichi `GescolUserDetails`
   (implémente `UserDetails`), portant `utilisateurId` et `etablissementId` en
   plus des champs standard.
2. `JwtAuthFilter` pose ce principal enrichi dans le `SecurityContext` (pas
   seulement l'email).
3. Un composant `CurrentEtablissementProvider` (package `com.gescol.common.security`)
   expose `UUID getEtablissementIdCourant()`, en lisant le principal du
   `SecurityContextHolder` — c'est le seul point d'accès autorisé à cette
   information dans les services métier.

## Conséquences
- Aucune requête SQL supplémentaire pour résoudre l'établissement courant.
- Tout service scopé injecte `CurrentEtablissementProvider`, jamais de logique
  de résolution ad hoc dupliquée module par module.
- Le jour où un utilisateur pourrait appartenir à plusieurs établissements
  (non prévu aujourd'hui), seul `CurrentEtablissementProvider` change — pas
  chaque service métier.
