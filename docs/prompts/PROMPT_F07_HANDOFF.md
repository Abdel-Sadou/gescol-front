# HANDOFF F07 — Audit Vitrine + Espace Parent

**Date** : 2026-08-31
**Rapport complet** : `docs/AUDIT_F07_VITRINE_PARENT.md`

---

## Ce que F07 a produit

Audit complet en 7 sections des fichiers :
- `src/app/pages/vitrine/vitrine.ts` + `article/article.ts`
- `src/app/pages/connexion/connexion.ts`
- `src/app/pages/parent/dashboard/parent-dashboard.ts`
- `src/app/pages/parent/quittance/quittance.ts`

## Bugs critiques 🔴 (à corriger en F07-correctifs avant de continuer)

| # | Fichier | Résumé |
|---|---|---|
| 1 | `parent-dashboard.ts:162` | Erreur réseau historique → silence → affiche "Aucun versement" |
| 2 | `parent-dashboard.ts:188` | Bouton "Télécharger" appelle `goQuittanceDetail` au lieu de `downloadPdf` |
| 3 | `parent-dashboard.ts:37,65` | `noop()` sur `+ Nouvelle inscription` et `Inscrire mon enfant` |
| 4 | `connexion.ts:94` | `href="#"` nu sur "Mot de passe oublié" → rechargement de page |
| 5 | `quittance.ts` | Aperçu 100% statique même avec `versementId` réel dans l'URL |
| 6 | `connexion.ts:83,146` | Boutons toggle password sans `aria-label` |
| 7 | `parent-dashboard.ts` | Mentions, modes paiement, Francophone/Anglophone, "Espace Parent" hardcodés |
| 8 | `vitrine.ts:55,327,389` | `Marie Gisèle Bilingual College` × 2 + badge `'Actualité'` hardcodés |

## Points 🟡 à inclure en F07-correctifs si possible

- `goHistoriqueQuittance` navigue vers le 1er versement (libellé "Voir les quittances" trompeur)
- `overflow-x:clip` manquant sur le wrapper du dashboard parent
- `<input>` sans `<label>` dans connexion.ts
- Silences sur erreur PDF download
- Section `#admissions` absente de la nav vitrine

## Ce qui est OK ✅

- ADR-011 respecté : zéro PrimeNG dans les 3 zones auditées
- Pattern blob download correct (pas de token en URL)
- Article.ts : 3 états bien distincts
- Dashboard enfants : loading/erreur/vide bien distincts
- Liens de navigation vitrine (scroll + routage) tous fonctionnels

## Décisions à documenter

Aucune nouvelle décision d'architecture (audit seul). Les corrections en
F07-correctifs devront probablement décider :
- Si l'inscription en 5 étapes est un futur prompt séparé (F17 ?) ou si les
  boutons noop restent désactivés visuellement jusqu'à ce prompt
- Si l'aperçu quittance doit charger les données réelles du versement (nécessite
  de vérifier l'endpoint exact dans API_CONTRACT) ou rester statique en V1
