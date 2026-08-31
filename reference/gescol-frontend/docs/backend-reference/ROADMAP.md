# ROADMAP — GESCOL

État d'avancement et séquencement des prompts. Mis à jour après chaque
handoff. Ordre de dépendance technique, pas ordre du cahier des charges.

## État actuel

| # | Module | Statut | Dépend de |
|---|---|---|---|
| 01 | Fondations (Établissement, Auth) | ✅ Fait | — |
| 02 | Élève (R1, R2) | ✅ Fait | 01 |
| 03 | Paramétrage (8 entités) + migration classeLibelle | ✅ Fait | 01, 02 |
| 04 | Personnel (R8) + Emploi du temps (R4) | ✅ Fait | 01, 03 |
| 05 | Finances — cœur (versements R3, solde ADR-007, quittance PDF+QR) | ✅ Fait | 02, 03 |
| 06 | Résultats (notes, bulletins — PDFBox + PdfTableHelper, ADR-009) | ✅ Fait | 02, 03, 04 |
| 07 | Discipline (moteur R5/R15, bons de sortie/entrée) | ✅ Fait | 02 |
| 08 | Espace Parent — compte, agrégation lecture (solde/moyennes/discipline), R16 | ✅ Fait | 02, 05, 06, 07 |
| 08bis | Espace Parent — workflow d'inscription en 5 étapes, lettre d'engagement | ✅ Fait | 08, 03 |
| 09 | Paie (barèmes, calcul R6/R17, bulletins — PDFBox/PdfTableHelper, ADR-009) | ✅ Fait | 04 |
| 10 | **Finances — Phase 2** (moratoires R9, alertes, code-barre + double bloc quittance, états agrégés) | ✅ Fait | 05, 08bis, 09 |
| 11 | Modes de paiement (validation bancaire scolarité R18, billetage/virement paie R19) — ajout de scope communiqué par l'établissement, hors cahier des charges initial | ✅ Fait (avec correctif de sécurité) | 05, 09 |
| 12 | Cahier de texte offline (sync R20, idempotence) | ✅ Fait | 04, 06 |

## 🎉 Feuille de route initiale : COMPLÈTE

Tous les modules du cahier des charges (+ l'extension modes de paiement) sont
implémentés et testés. Points ouverts restants, aucun bloquant :

| Point | Priorité | Description |
|---|---|---|
| Rôle `ANIMATEUR_PEDAGOGIQUE` | ✅ Résolu | Confirmé par Bertrand : c'est le chef d'établissement = `SUPER_ADMIN` existant. Aucun changement de code nécessaire |
| Professeur principal (R21) | ✅ Résolu | Concept révélé par Bertrand, implémenté PROMPT_14, faille de validation en lot corrigée PROMPT_15 |
| R10 (suppression personnel) | Faible | Toujours pas câblée malgré son identification en PROMPT_07 — vérifier absence d'`EmploiDuTemps`/`BulletinPaie` avant suppression d'un `Personnel` |
| Module Vitrine (back-office) | ✅ Résolu | Implémenté PROMPT_16 — lecture publique confirmée, écriture SUPER_ADMIN/COMMUNICATION |
| États agrégés transversaux | Différé | Reporting cross-modules — non requis à ce stade |
| Logique offline/sync frontend | Hors backend | Détection de connectivité, file d'attente locale — sujet Angular, pas Spring Boot |

## Notes de séquencement (historique)

- **10 dépend de 08 et 09**, pas seulement de 05 : les moratoires et alertes
  sont des raffinements qui gagnent à être câblés une fois l'espace parent et
  la paie déjà stabilisés (évite de deviner l'intégration parent avant coup,
  évite de construire les alertes avant que le flux financier complet ait
  tourné en conditions réelles).
- **11 est isolé en dernier** volontairement — la synchronisation offline est
  la brique la plus complexe techniquement, ne doit pas retarder le reste.
- Chaque module marqué "Fait" a un handoff correspondant. Si un handoff
  manque ou est incomplet pour un module déjà marqué "Fait", le signaler
  avant de construire un module qui en dépend.
