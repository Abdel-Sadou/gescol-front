# ADR-012 — Transloco pour l'internationalisation FR/EN de l'interface

**Statut** : Adopté

## Contexte
Le cahier des charges (§4.6) prévoit un choix de langue de navigation
FR/EN pour l'interface — resté non implémenté jusqu'ici (aucun prompt
backend ni frontend ne l'avait couvert). COBIMAG est un établissement
bilingue dans un contexte camerounais bilingue : administrateurs,
enseignants et parents peuvent être francophones ou anglophones, sur les
trois zones de l'application (Vitrine, Espace Parent, Application interne).

Deux familles de solutions existent pour Angular : l'i18n officiel
(`@angular/localize`, compilation séparée par langue, pas de changement à
l'exécution) et des bibliothèques runtime (Transloco, ngx-translate,
changement de langue instantané sans rechargement). Le besoin exprimé — un
choix de langue basculable librement par l'utilisateur — exclut l'approche
officielle.

Entre les bibliothèques runtime, Transloco est retenu : architecture par
signaux (alignée avec `provideZonelessChangeDetection()` déjà en place
depuis PROMPT_F00/F01), chargement paresseux des traductions par module
(cohérent avec le découpage en 3 zones déjà lazy-loadées), activement
maintenu.

## Décision
- Bibliothèque : `@jsverse/transloco`.
- Deux langues : `fr` (défaut) et `en`.
- Fichiers de traduction **scopés par zone** plutôt qu'un seul fichier
  global : `vitrine`, `parent`, `app` — cohérent avec le découpage de
  routes déjà lazy-loadé (ADR implicite PROMPT_F01), évite de charger les
  traductions de l'application interne quand on visite juste la vitrine.
- Choix de langue stocké côté client (`localStorage`, même mécanisme que le
  token JWT) — pas de champ de préférence de langue côté backend à ce
  stade, pas de régression backend nécessaire pour cette fonctionnalité.
- Un composant de sélection de langue (FR/EN) visible sur les trois zones.

## Conséquences
- Tout texte affiché à l'utilisateur doit désormais passer par une clé de
  traduction, jamais une chaîne de caractères en dur dans un template —
  contrainte à ajouter aux règles de non-régression de CLAUDE.md frontend.
- Les écrans déjà construits avant cette décision (PROMPT_F01 : page de
  connexion, menu de l'application interne) contiennent du texte français
  en dur — nécessite un prompt de rattrapage avant de poursuivre, pour ne
  pas laisser la dette s'accumuler sur davantage d'écrans (cf. PROMPT_F02bis).
- Chaque futur prompt d'écran (Vitrine, Espace Parent, modules internes)
  doit produire ses clés de traduction FR et EN en même temps que l'écran,
  pas dans un second temps.
