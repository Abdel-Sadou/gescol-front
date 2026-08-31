# ADR-002 — Unicité composite des matricules (élève et personnel)

**Statut** : Adopté

## Contexte
R1 et R8 définissent des matricules au format `AAAA` + type + numéro d'ordre
(ex. 2026G0001, 2026PE001). Une contrainte d'unicité globale sur `matricule`
seule fonctionne tant qu'il n'y a qu'un établissement, mais provoquera des
collisions dès qu'un second établissement existe (deux écoles peuvent toutes
les deux générer "2026G0001").

## Décision
Contrainte d'unicité composite `(etablissement_id, matricule)`, jamais
`matricule` seul — appliquée dès la première migration, pas ajoutée plus tard.

## Conséquences
- Aucun changement de format de matricule nécessaire (pas de préfixe école à
  ajouter dans le matricule lui-même — reste lisible, conforme au cahier des
  charges).
- Coût nul aujourd'hui, évite une migration de données douloureuse plus tard
  si des matricules identiques existent déjà dans deux établissements.
