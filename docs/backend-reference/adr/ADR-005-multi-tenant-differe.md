# ADR-005 — Infrastructure multi-tenant (routing, facturation) différée

**Statut** : Adopté

## Contexte
L'ambition à moyen terme est un vrai produit multi-écoles (SaaS). La tentation
est de construire dès maintenant la résolution de tenant par sous-domaine, un
dashboard super-admin cross-établissements, et une couche de facturation par
abonnement.

## Décision
Cette infrastructure est explicitement différée jusqu'à l'existence réelle
d'un second établissement actif en parallèle du premier. L'architecture actuelle
(ADR-001, ADR-002, ADR-003) est suffisante et ne bloque pas l'ajout ultérieur de
cette couche.

## Conséquences
- Évite d'investir du temps sur une infrastructure spéculative avant d'avoir un
  besoin réel confirmé.
- Quand un second établissement apparaît, le travail restant est borné :
  middleware de résolution de tenant, activation du filtrage systématique,
  couche de facturation minimale — pas une réécriture, grâce aux ADR
  précédentes.
