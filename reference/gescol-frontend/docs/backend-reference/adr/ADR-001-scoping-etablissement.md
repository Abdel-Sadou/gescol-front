# ADR-001 — Scoping établissement via MappedSuperclass

**Statut** : Adopté

## Contexte
Le logiciel doit rester réutilisable pour un autre établissement sans réécriture
de code (cf. cahier des charges §4.11, §11.6), mais un seul établissement réel
existe aujourd'hui. Une vraie infrastructure multi-tenant (résolution de tenant
par sous-domaine, isolation stricte au niveau base de données, schema-per-tenant)
serait prématurée.

## Décision
Chaque entité propre à un établissement hérite de `EtablissementScopedEntity`
(`@MappedSuperclass`), portant une FK `etablissement_id`. Le filtrage se fait au
niveau service (voire via un `@Filter` Hibernate activé par contexte plus tard),
pas via une infrastructure multi-tenant Hibernate native.

## Conséquences
- Simple à mettre en œuvre et à comprendre pour une seule instance active.
- Le jour où un deuxième établissement réel coexiste, il faudra ajouter la
  résolution de contexte (quel établissement pour l'utilisateur courant) et
  activer un filtrage systématique — effort modéré, pas une réécriture.
- Ne pas anticiper davantage tant qu'il n'y a pas de second établissement réel
  et payant.
