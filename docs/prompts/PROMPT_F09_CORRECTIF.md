# PROMPT_F09_CORRECTIF — Année scolaire, calendrier caché, clarification Niveau

**À utiliser avec** : DESIGN_SYSTEM.md, docs/backend-reference/MASTER_CONTEXT.md,
docs/backend-reference/API_CONTRACT.md fournis en contexte.

---

## Prompt

```
Contexte : trois problèmes constatés sur les dialogs de création (Classe,
Trimestre) après PROMPT_F09.

## Correctif 1 — Année scolaire : sélection contrainte, pas texte libre

Partout où un champ "Année scolaire" existe dans un formulaire de
Paramétrage (Classe, Trimestre, Taux de scolarité...) : remplace le champ
texte libre par un p-select avec un nombre restreint d'options
raisonnables (ex. année courante ± 1), au format exact déjà utilisé côté
backend (AnneeScolaireUtils, R11 — vérifie le format exact dans
MASTER_CONTEXT avant de coder, ex. "2025-2026"). Présélectionne l'année
scolaire courante par défaut (calcule-la côté frontend avec la même règle
que le backend : bascule au 1er septembre — ou expose un endpoint/valeur
déjà disponible si tu en identifies un plutôt que de dupliquer la logique,
signale ton choix).

## Correctif 2 — Calendrier qui déborde de la boîte de dialogue

Sur tous les p-datepicker (et p-select si le même problème se produit)
utilisés à l'intérieur d'un p-dialog : ajoute [appendTo]="'body'" (ou
l'équivalent PrimeNG 21 correct si l'API a changé — vérifie la doc
actuelle du composant) pour que le panneau flottant s'affiche par-dessus
la boîte de dialogue plutôt que d'être coupé par son propre défilement
interne. Applique ce correctif à tous les écrans de F09 concernés, pas
seulement Classe/Trimestre.

## Correctif 3 — Clarification du champ Niveau sur Classe

Vérifie dans MASTER_CONTEXT.md/API_CONTRACT.md le rôle exact de Niveau par
rapport à Classe, Coefficient et QuotaHoraire (hypothèse à confirmer :
Coefficient et QuotaHoraire sont définis par Niveau, pas par Classe
précise — donc lier une Classe à son Niveau permet que ces configurations
s'appliquent correctement).

Si cette hypothèse est confirmée : ajoute un texte d'aide sous le champ
"Niveau" du formulaire Classe expliquant son utilité concrète (ex. "Permet
d'appliquer automatiquement les coefficients et quotas horaires définis
pour ce niveau"), plutôt que de le laisser comme un champ optionnel sans
contexte.

Si l'hypothèse est fausse ou si le champ te semble redondant avec
Sous-système une fois vérifié : signale-le clairement dans le résumé de
fin plutôt que de deviner une justification.

## VÉRIFICATION

- Le champ Année scolaire est un select, présélectionné sur l'année
  courante, sur tous les écrans de Paramétrage concernés
- Le calendrier de date de début/fin s'affiche entièrement visible,
  par-dessus la boîte de dialogue, sans scrollbar qui le coupe
- Le champ Niveau a un texte d'aide clair, ou son utilité réelle est
  clarifiée dans le résumé de fin

À la fin, résumé court confirmant les 3 points, en particulier la
confirmation ou l'infirmation du rôle du champ Niveau.
```
