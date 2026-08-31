# ADR-007 — Solde de scolarité calculé à la volée, jamais stocké comme champ mutable

**Statut** : Adopté

## Contexte
Le cahier des charges décrit un "décrément automatique du solde à chaque
versement" (§8.1). Une lecture littérale suggérerait un champ `solde` sur
`Eleve`, décrémenté par `UPDATE` à chaque versement. Cette approche est
fragile sous accès concurrents (deux versements simultanés peuvent tous
deux lire puis écrire un solde périmé), et duplique une information déjà
déductible des données sources.

## Décision
Aucun champ de solde n'est stocké sur `Eleve`. Le solde restant est toujours
calculé à la demande : `TauxScolarite(classe, année) − SUM(Versement.montant
WHERE eleve = X AND anneeScolaire = année courante)`. Le "décrément" perçu
par l'utilisateur est un effet naturel de l'ajout d'une ligne `Versement`,
pas une opération d'écriture sur un solde stocké.

## Conséquences
- Pas de risque d'incohérence entre le solde affiché et l'historique réel des
  versements — la somme des versements est la seule source de vérité.
- Un calcul par requête à chaque affichage plutôt qu'une simple lecture de
  champ — coût négligeable au volume actuel (§11.5 : jusqu'à 100 élèves par
  classe), à revisiter seulement si un besoin de performance réel apparaît.
- La numérotation de quittance (R3) reste le seul élément nécessitant une
  génération séquentielle protégée contre la concurrence — même pattern que
  R1/R8 (retry avec contrainte unique composite).
