# PROMPT_F14_CORRECTIF — Détection R19 par code HTTP, pas par mots-clés

**À utiliser avec** : docs/backend-reference/API_CONTRACT.md fourni en
contexte.

---

## Prompt

```
Contexte : la détection de l'erreur R19 (VIREMENT_BANCAIRE sans
coordonnées bancaires) dans bulletins.ts repose actuellement sur une
recherche de mots-clés ("bancaire"/"compte") dans le texte du message
d'erreur, plus une vérification de status 422 qui ne correspond à aucun
code réellement utilisé par le backend (toutes les violations de règle
métier de ce projet sont des 409 — R2, R10, R18, R21 compris, vérifie
dans API_CONTRACT.md).

## Correctif

Remplace la détection par une simple vérification `err.status === 409`
lors de l'appel POST /api/paie/bulletins/generer — cohérent avec le
pattern déjà utilisé pour R2 (Élève), R10 (Personnel), R18 (Finances),
R21 (Résultats) partout ailleurs dans ce projet. Affiche `err.error.message`
tel quel dans la bannière d'erreur (pas un texte reformulé), avec le lien
vers l'édition du personnel déjà en place.

Retire toute logique de recherche de mots-clés dans le texte du message —
elle n'est plus nécessaire une fois le code de statut utilisé correctement.

## VÉRIFICATION

Génération d'un bulletin VIREMENT_BANCAIRE pour un personnel sans
coordonnées bancaires → la bannière R19 s'affiche bien, déclenchée par le
code 409, pas par une correspondance de texte.

À la fin, confirmation courte que le correctif est appliqué et qu'aucune
détection par mots-clés ne subsiste.
```
