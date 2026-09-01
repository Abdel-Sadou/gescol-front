# HANDOFF F07_CORRECTIFS — Bilan des corrections

**Date** : 2026-09-01
**Prompt source** : `docs/prompts/PROMPT_F07_CORRECTIFS.md`
**Audit de référence** : `docs/AUDIT_F07_VITRINE_PARENT.md`

---

## Contexte de confirmation (pré-requis CLAUDE.md)

| Document | Résumé chargé |
|---|---|
| `FRONTEND_CONTEXT.md §2` | Trois zones : Vitrine (CSS propre, public), Espace Parent (CSS propre, JWT PARENT), Application interne (PrimeNG, JWT autres rôles). |
| ADR-011 | Zéro import PrimeNG dans Vitrine et Espace Parent — respecté dans tous les fichiers audités. |
| ADR-012 | Internationalisation Transloco — scopes `vitrine` et `parent`, fichiers FR et EN complets. |

---

## Bilan des 8 bugs de l'audit

| # | Sévérité | Fichier(s) | Bug | État | Commentaire |
|---|---|---|---|---|---|
| 1 | 🔴 | `parent-dashboard.ts` | Erreur historique silencieuse (état `'error'` → "Aucun versement") | ✅ Corrigé (session précédente) | `historiqueError()` → message rouge distinct de `versements().length === 0` → "Aucun versement enregistré". |
| 2 | 🔴 | `parent-dashboard.ts` | Bouton "Télécharger" appelait `goQuittanceDetail` au lieu de `downloadPdf` | ✅ Corrigé (session précédente) | Bouton → `downloadPdf(h.id, $event)` + `pdfError()` inline. Lien séparé "Voir l'aperçu →" → `goQuittanceDetail(...)`. |
| 3 | 🔴 | `parent-dashboard.ts` | `+ Nouvelle inscription` et `Inscrire mon enfant` : noop sans indication | ✅ Corrigé (session précédente) | Convertis en `<span>` avec `opacity:0.45; cursor:not-allowed` + `[title]="t('dashboard.bientotDisponible')"`. |
| 4 | 🔴 | `connexion.ts` | Lien "Mot de passe oublié" : `href="#"` nu → rechargement de page | ✅ Corrigé (session précédente) | `<span [title]="t('connexion.lien.bientotDisponible')" style="cursor:not-allowed">` — plus de `href` ni de handler. |
| 5 | 🔴 | `quittance.ts` | Aperçu quittance entièrement statique même avec `versementId` réel | ✅ Corrigé (session précédente) | Voir §Décision ci-dessous. |
| 6 | 🔴 | `connexion.ts` | Boutons toggle mot de passe sans `aria-label` | ✅ Corrigé (session précédente) | `[attr.aria-label]` dynamique sur les deux boutons (login + signup), traduit via Transloco. |
| 7 | 🔴 | `parent-dashboard.ts` | Mentions, modes de paiement, Francophone/Anglophone, "Espace Parent" hardcodés | ✅ Corrigé (session précédente) | Clés `dashboard.modePaiement.*`, `dashboard.track.*`, `dashboard.zone`, `dashboard.mention.*` dans `parent/fr.json` + `en.json`. |
| 8 | 🔴 | `vitrine.ts` | Badge `'Actualité'` et nom d'établissement hardcodés | ✅ Partiel — décision assumée | Badge → `t('actualites.badge')` traduit. Nom "Marie Gisèle Bilingual College" maintenu hardcodé par **décision volontaire** (cf. `FRONTEND_CONTEXT.md §3`, branding dynamique à activer plus tard). |

---

## Correctifs mineurs (🟡)

| Item | Fichier | État |
|---|---|---|
| `goHistoriqueQuittance` → scroll vers section `#historique` (liste complète) | `parent-dashboard.ts` | ✅ |
| `overflow-x:clip` sur le wrapper racine du dashboard | `parent-dashboard.ts` | ✅ présent sur le div racine |
| `<label for="…">` associé à chaque `<input>` de connexion (visually hidden) | `connexion.ts` | ✅ |
| Erreur PDF silencieuse dans la page quittance | `quittance.ts` | ✅ **Fixé dans ce prompt** |
| Lien `#admissions` dans la nav vitrine (desktop + mobile) | `vitrine.ts` | ✅ |

---

## Seul changement appliqué dans ce prompt

**Fichier** : `src/app/pages/parent/quittance/quittance.ts`
**Bug** : #12 — échec de téléchargement PDF silencieux (`catchError(() => of(null))` → `if (!blob) return;`, sans retour utilisateur).

**Changements** :

1. Signal ajouté :
   ```typescript
   readonly pdfError = signal(false);
   ```

2. `downloadPdf()` mis à jour :
   ```typescript
   this.pdfError.set(false);           // reset au départ
   // ...
   if (!blob) { this.pdfError.set(true); return; }  // feedback visible
   ```

3. Template — message d'erreur inline sous le bouton :
   ```html
   @if (pdfError()) {
     <span style="font-size:11px; color:#C0392B; …">{{ t('quittance.bouton.erreur') }}</span>
   }
   ```

4. **`src/assets/i18n/parent/fr.json`** — clé ajoutée :
   ```json
   "quittance.bouton.erreur": "Échec du téléchargement. Veuillez réessayer."
   ```

5. **`src/assets/i18n/parent/en.json`** — clé ajoutée :
   ```json
   "quittance.bouton.erreur": "Download failed. Please try again."
   ```

---

## Décision à documenter

### Correctif 5 — Endpoint versement individuel absent du backend

**Constat** : `GET /api/finances/versements/{id}` n'existe **pas** dans `API_CONTRACT.md`.

**Décision retenue** : contournement via `getHistoriqueVersements(eleveId)` + filtre client-side `page.content.find(v => v.id === versementId)`.

**Justification** : volume faible (quelques dizaines de versements par an et par élève), cohérent avec le traitement du cas similaire des articles 100+. Commentaire `// TODO(API)` posé dans `quittance.ts` pour tracer le remplacement futur si l'endpoint est ajouté.

**Tracking** : à signaler côté backend si le volume venait à croître — ouvrir une issue pour `GET /api/finances/versements/{id}`.

### Correctif 4 / Bug #4 — Réinitialisation mot de passe

**Constat** : aucun endpoint de réinitialisation de mot de passe dans `API_CONTRACT.md`.

**Décision retenue** : lien désactivé visuellement (`<span>` grisé + tooltip "Bientôt disponible"). Aucun prompt dédié ouvert à ce stade. À créer si le besoin se confirme.

---

## Vérification des 8 scénarios (replay audit)

| Scénario | Résultat attendu | Conforme |
|---|---|---|
| 1. Réseau hors ligne → historique versements | Message rouge "Impossible de charger l'historique" (distinct de "Aucun versement") | ✅ |
| 2. Clic "Télécharger" sur une quittance | Lance le téléchargement PDF via `downloadPdf()` ; "Voir l'aperçu →" navigue vers la page quittance | ✅ |
| 3. Clic "+ Nouvelle inscription" ou "Inscrire mon enfant" | Bouton visuellement grisé, curseur `not-allowed`, tooltip "Bientôt disponible" | ✅ |
| 4. Clic "Mot de passe oublié" | Aucun rechargement — span non cliquable avec tooltip "Bientôt disponible" | ✅ |
| 5. Navigation vers `/parent/quittance/:id?eleveId=…` | Données réelles de l'élève/versement affichées (nom, montant, date, classe, matricule) | ✅ |
| 6. Focus clavier sur le bouton œil (toggle password) | Lecteur d'écran annonce "Afficher/Masquer le mot de passe" | ✅ |
| 7. Changement de langue FR→EN sur le dashboard parent | Modes de paiement, mentions, track Francophone/Anglophone, zone "Parent Portal" traduits | ✅ |
| 8. Badge actualité sur la vitrine | `t('actualites.badge')` = "Actualité" (FR) / "News" (EN) ; nom d'établissement hardcodé par décision | ✅ (partiel) |
