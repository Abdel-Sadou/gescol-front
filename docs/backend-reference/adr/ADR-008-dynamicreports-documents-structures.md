# ADR-008 — DynamicReports (moteur Jasper) pour les documents structurés, PDFBox conservé pour les documents simples

**Statut** : ⚠️ Remplacé par ADR-009 — conservé pour traçabilité historique, ne plus appliquer.

## Contexte
La quittance (PROMPT_05) a été construite avec Apache PDFBox — adapté à un
document simple, mise en page fixe, dessiné par code impératif. Les documents
à venir (bulletin de notes §6.3, bulletin de paie §8.2, futurs états agrégés
par classe/période) sont des documents groupés et tabulaires (sous-totaux,
regroupement par catégorie, pagination automatique sur listes longues) —
exactement le cas d'usage où PDFBox devient pénible (coordonnées calculées à
la main, sauts de page gérés manuellement) et où un moteur de reporting
comme JasperReports excelle nativement.

JasperReports s'utilise normalement via un designer visuel (Jaspersoft
Studio) produisant du JRXML — mal adapté à un flux de développement piloté
par Claude Code, qui n'a pas de retour visuel pour itérer sur un template
déclaratif complexe.

## Décision
- La quittance reste en PDFBox — ne pas la migrer, coût de réécriture non
  justifié pour un document déjà simple et fonctionnel.
- À partir du module Résultats (bulletins de notes), tout document
  structuré/tabulaire (groupes, sous-totaux, pagination automatique) utilise
  **DynamicReports** (bibliothèque construite sur le moteur JasperReports,
  exposant une API Java fluide plutôt que du JRXML à écrire à la main) —
  cohérent avec un flux de développement assisté par LLM.

## Conséquences
- Deux bibliothèques de génération PDF coexistent dans le projet (PDFBox
  pour la quittance, DynamicReports pour le reste) — accepté comme
  compromis pragmatique plutôt que de forcer une seule techno partout.
- Nouvelle dépendance à ajouter au pom.xml lors du prochain module qui en a
  besoin (PROMPT_06) : `org.dynamicreports:dynamicreports-core`.
- Licence LGPL (comme JasperReports lui-même) — compatible avec un usage
  commercial, y compris pour une trajectoire SaaS.
