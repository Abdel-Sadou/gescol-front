# ADR-003 — Règles de discipline et barèmes de paie en configuration, pas en code

**Statut** : Adopté

## Contexte
Les seuils d'escalade disciplinaire (R5) et les formules de paie (R6) peuvent
varier d'un établissement à l'autre, et leur exactitude légale/fiscale relève
de la responsabilité de l'établissement, pas du développeur (cf. clause paie
de la proposition financière). Les coder en dur (if/else en Java) figerait ces
règles et empêcherait toute correction sans nouveau déploiement.

## Décision
`RegleDiscipline` et `BaremePaie` sont des tables de configuration, modifiables
depuis un back-office, évaluées par un petit moteur de règles générique plutôt
que par de la logique conditionnelle codée en dur.

## Conséquences
- Effort de modélisation initial plus élevé qu'un simple if/else.
- Correction d'une règle métier = modification de données, pas de code ni de
  déploiement — bénéfice direct pour la réutilisabilité multi-établissement et
  pour la clause de responsabilité sur la paie.
