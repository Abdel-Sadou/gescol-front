# ADR-009 — PDFBox pour tous les documents PDF (remplace ADR-008)

**Statut** : Adopté — **remplace ADR-008** (DynamicReports pour documents structurés)

## Contexte
ADR-008 prévoyait DynamicReports (moteur JasperReports) pour les documents
structurés/tabulaires (bulletins, paie, rapports), en réservant PDFBox aux
documents simples (quittance). En implémentant le bulletin (PROMPT_06),
l'ajout de DynamicReports au projet a révélé des frictions concrètes avec
Java 21 : dépendances non modularisées nécessitant des `--add-opens`
(Batik, réflexion), et surtout, JasperReports embarque historiquement une
version ancienne d'iText en interne pour certains formats d'export — ce qui
contredit directement le principe déjà posé lors du choix de PDFBox pour la
quittance (éviter iText/AGPL).

En parallèle, `PdfTableHelper` (`com.gescol.common.util`) a été construit
comme utilitaire générique de dessin de tableaux bordés (en-têtes, lignes,
séparateurs) — ce qui répond directement au problème que DynamicReports
devait résoudre (éviter de recalculer des coordonnées à la main pour chaque
tableau), sans les frictions de compatibilité.

## Décision
Tous les documents PDF du projet — y compris les documents structurés/
tabulaires (bulletins, futurs bulletins de paie, futurs rapports agrégés) —
utilisent **PDFBox**, avec `PdfTableHelper` comme utilitaire partagé pour le
rendu de tableaux. Aucune dépendance à JasperReports ou DynamicReports.

## Conséquences
- Une seule bibliothèque de génération PDF dans tout le projet — plus simple
  que la coexistence à deux prévue par ADR-008.
- `PdfTableHelper` devient un composant central à faire évoluer avec soin
  (pagination automatique sur tableaux longs, gestion des sauts de page) à
  mesure que des documents plus volumineux (bulletin de paie, rapports)
  arrivent — c'est le prix à payer pour éviter la dépendance Jasper.
- **Point de process à corriger, pas une conséquence technique** : ce
  changement a été fait sans signalement préalable, en violation de la
  consigne CLAUDE.md ("ne dévie pas silencieusement d'un ADR acté"). Décision
  correcte sur le fond, mais actée a posteriori ici plutôt qu'avant
  implémentation. À ne pas reproduire — toute future remise en cause d'un
  ADR doit être signalée AVANT modification du code, pas justifiée après
  coup dans le handoff.
