# ADR-011 — CSS propre pour Vitrine/Espace Parent, PrimeNG pour l'application interne

**Statut** : Adopté

## Contexte
Le frontend GESCOL couvre trois zones aux besoins différents : une vitrine
publique et un espace parent déjà maquettés et validés auprès de
l'établissement (démo Claude Design, `COBIMAG-site-SPA.html`), et une
application interne pour le personnel, construite sur le template Poseidon
(Angular + PrimeNG). Deux options : reconstruire Vitrine/Parent avec les
composants PrimeNG en les stylant pour ressembler à la démo, ou conserver
le CSS exact de la démo indépendamment de PrimeNG.

La première option risquait un écart visuel avec ce qui a déjà été montré
et validé (Bertrand a vu et approuvé ce design précis), et se heurtait à
une limite réelle de PrimeNG sur le changement de preset de thème à
l'exécution (tokens CSS qui ne se mettent pas toujours à jour proprement,
cf. issue GitHub #17307).

## Décision
- **Vitrine publique et Espace Parent** : CSS propre, fidèle exactement à
  la démo déjà validée. Aucun composant PrimeNG utilisé dans ces deux
  zones, y compris pour les éléments interactifs (formulaires, boutons) —
  HTML natif stylé.
- **Application interne** (personnel) : PrimeNG standard, avec un preset
  unique dérivé des couleurs de `Etablissement`, défini une seule fois au
  démarrage — jamais de changement de preset en cours de navigation.
- Les couleurs des trois zones proviennent toujours de la même lecture de
  `Etablissement` (source unique), appliquées par deux mécanismes
  différents selon la zone (CSS custom properties brutes vs preset
  PrimeNG).

## Conséquences
- Deux systèmes de style coexistent dans un seul projet Angular — accepté
  comme compromis pragmatique, cohérent avec le fait que Backend a déjà
  fait un choix similaire (ADR-009 : deux bibliothèques PDF coexistent pour
  des raisons de fond, pas de paresse).
- Fidélité garantie à ce qui a déjà été présenté à l'établissement — pas de
  risque de "dérive" visuelle en reconstruisant via un framework de
  composants différent.
- Le futur mainteneur des styles Vitrine/Parent doit connaître le CSS
  brut du projet (variables, classes) en plus de PrimeNG pour l'app
  interne — deux vocabulaires de style à connaître, documentés séparément.

## Exception documentée (post-démo Angular, PROMPT_F05)

L'écran "Fiche élève" côté secrétariat (`student-record`, destiné à l'app
interne / rôle SECRETARIAT) conserve le style CSS custom de la démo plutôt
que d'être reconstruit en PrimeNG — décision explicite : cet écran existait
déjà, entièrement fidèle et fonctionnel, dans le code Angular fourni par
Claude Design. Le refaire en PrimeNG aurait été un coût sans bénéfice
clair. Cette exception reste bornée à cet écran précis ; tout NOUVEL écran
de l'app interne (élèves liste, finances, personnel, etc.) suit la règle
générale : PrimeNG.
