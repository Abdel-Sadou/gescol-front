# AUDIT F07 — Vitrine & Espace Parent (fonctionnel + logique)

**Périmètre** : `src/app/pages/vitrine/**`, `src/app/pages/connexion/**`,
`src/app/pages/parent/**`
**Date** : 2026-08-31
**Nature** : audit seul, aucune correction automatique.

---

## 1. Navigation et liens morts

| Fichier | Ligne | Description | Sévérité |
|---|---|---|---|
| `connexion.ts` | 94 | Lien "Mot de passe oublié" : `href="#"` sans `(click)` handler → déclenche un rechargement de page complet au lieu d'un no-op ou d'une future page dédiée | 🔴 |
| `parent-dashboard.ts` | 37 | Bouton `+ Nouvelle inscription` (header) : `noop()` — fonctionnalité non connectée, aucune route vers le flux en 5 étapes prévu | 🔴 |
| `parent-dashboard.ts` | 65 | CTA `Inscrire mon enfant` (état "aucun enfant") : `noop()` — même problème, laisse l'utilisateur bloqué | 🔴 |
| `parent-dashboard.ts` | 188–197 | Lien "Télécharger la quittance" dans l'historique : appelle `goQuittanceDetail(h.id)` (navigation vers aperçu) mais affiche `pdfLoading() === h.id` (état de téléchargement) — état "En cours…" jamais atteignable depuis ce chemin ; `downloadPdf()` n'est jamais appelé depuis ce bouton | 🔴 |
| `parent-dashboard.ts` | 344–347 | `goHistoriqueQuittance()` navigue vers le **premier** versement de la liste — libellé "Voir les quittances" (pluriel) trompeur, l'utilisateur s'attend à une liste | 🟡 |
| `vitrine.ts` | 412–415 | Liens réseaux sociaux (Facebook, Instagram, LinkedIn, YouTube) : `noop()` sans indication visuelle de non-fonctionnement (ni `opacity`, ni tooltip) | 🟡 |
| `vitrine.ts` | 425 | Lien "Mentions légales" : `noop()` | 🟡 |
| `parent-dashboard.ts` | 139 | "Voir le bulletin" : `noop()` avec `opacity:0.45; cursor:default` — intentionnel, UX correcte | 🔵 |
| `vitrine.ts` | 349 | "Lire la suite" sur actualités statiques : `noop()` avec `opacity:0.45` — intentionnel, correct | 🔵 |

---

## 2. Complétude des appels API

| Fichier | Ligne | Description | Sévérité |
|---|---|---|---|
| `quittance.ts` | 65–107 | Aperçu quittance **entièrement statique** (NKOA Kevin, 5ème A, 450 000 FCFA, date 07/08/2026) même quand un `versementId` réel est transmis via le paramètre de route — aucun appel à `GET /api/finances/quittances/{id}` ou équivalent pour charger les vraies données | 🔴 |
| `vitrine.ts` | — | `STATS`, `PRESENTATION`, `CYCLES` dans `vitrine.data.ts` : données fixes avec TODO (API non encore disponible côté backend selon ROADMAP) — acceptable en l'état, mais à surveiller | 🟡 |
| Aucun | — | Pas de données statiques résiduelles KIDS / STUDENTS / ARTICLES détectées dans les 3 zones auditées ✅ | — |
| Aucun | — | Pas de doublon d'appel HTTP détecté (même endpoint appelé deux fois pour la même donnée) ✅ | — |

---

## 3. États de chargement / erreur / vide

| Fichier | Ligne | Description | Sévérité |
|---|---|---|---|
| `parent-dashboard.ts` | 162–164 | Erreur réseau sur `getHistoriqueVersements()` → `historiqueState() = 'error'` → `versements() = []` → le template affiche "Aucun versement enregistré." — l'erreur réseau est silencieuse, indistinguable d'un historique vide | 🔴 |
| `quittance.ts` | 212–217 | Échec du téléchargement PDF : `catchError(() => of(null))` → `blob = null` → rien, `pdfLoading` repasse à `false` — aucun feedback d'erreur à l'utilisateur | 🟡 |
| `parent-dashboard.ts` | 350–368 | Même problème sur `downloadPdf()` dans le dashboard : erreur silencieuse | 🟡 |
| `vitrine.ts` | 508–511 | `actualites` en erreur → `of(null)` → fallback silencieux sur NEWS statiques — l'utilisateur voit des données sans savoir qu'elles sont simulées | 🟡 |
| `vitrine.ts` | 488–507 | Contenus vitrine (MOT_FONDATEUR, HORAIRES, etc.) : pas d'état "chargement" visible, le fallback statique s'affiche immédiatement — acceptable pour une vitrine publique | 🔵 |
| `article.ts` | 44–62 | 3 états bien distincts (spinner, 404, erreur réseau) ✅ | — |
| `parent-dashboard.ts` | 48–67 | Enfants : loading / erreur / vide bien distincts ✅ | — |

---

## 4. Internationalisation (ADR-012)

| Fichier | Ligne | Description | Sévérité |
|---|---|---|---|
| `parent-dashboard.ts` | 30 | `Espace Parent` hardcodé dans le template (header) | 🔴 |
| `parent-dashboard.ts` | 32 | `COBIMAG — Marie Gisèle Bilingual College` hardcodé dans le template | 🔴 |
| `parent-dashboard.ts` | 303–307 | Mentions scolaires hardcodées en français dans `mention()` : `'Très bien'`, `'Bien'`, `'Assez bien'`, `'Passable'`, `'Insuffisant'` | 🔴 |
| `parent-dashboard.ts` | 379 | `'Caisse'` et `'Virement bancaire'` hardcodés dans `formatMode()` | 🔴 |
| `parent-dashboard.ts` | 388–389 | `'Francophone'` et `'Anglophone'` hardcodés dans `decorate()` | 🔴 |
| `vitrine.ts` | 55 | `Marie Gisèle Bilingual College   ` hardcodé dans le header (zone logo, subtitle) | 🔴 |
| `vitrine.ts` | 327 | Badge `'Actualité'` hardcodé dans le template pour les actualités provenant de l'API | 🔴 |
| `vitrine.ts` | 389 | `'Marie Gisèle Bilingual College'` hardcodé dans le footer | 🔴 |
| `quittance.ts` | 46–48, 122–125 | Nom, sous-titre et coordonnées de l'établissement hardcodés dans l'aperçu document (répétés dans les deux souches) — contexte particulier (document papier simulé) mais reste une régression ADR-012 | 🟡 |
| `vitrine.data.ts` | 2–59 | Contenu statique en français pur (STATS, PRESENTATION, CYCLES, NEWS, VIE_SCOLAIRE) — TODO documentés, acceptable en l'état | 🟡 |

---

## 5. Accessibilité de base

| Fichier | Ligne | Description | Sévérité |
|---|---|---|---|
| `connexion.ts` | 83–91 | Bouton toggle visibilité mot de passe (login) : SVG inline sans `aria-label` — inaccessible au clavier et aux lecteurs d'écran | 🔴 |
| `connexion.ts` | 146–157 | Bouton toggle visibilité mot de passe (signup) : même problème | 🔴 |
| `connexion.ts` | 68–170 | Tous les `<input>` n'ont pas de `<label>` associé (ni `for`/`id`, ni `aria-label`) — uniquement des `placeholder` | 🟡 |
| `parent-dashboard.ts` | 76 | Boutons carte enfant `<button (click)="selectChild(...)">` : pas d'`aria-label` décrivant l'action ("Sélectionner l'enfant X") | 🟡 |
| `vitrine.ts` | 51, 387 | Logos header et footer : `alt="Logo COBIMAG"` ✅ | — |
| `vitrine.ts` | 74 | Bouton burger mobile : `aria-label="Menu"` ✅ | — |
| `article.ts` | 31, 69 | Images article : `alt` pertinent ✅ | — |
| `quittance.ts` | 40, 117 | Logo watermark : `alt=""` (décoratif) ✅ | — |
| `src/assets/styles.scss` | — | Pas de suppression globale d'`outline`/`focus` détectée ✅ | — |

---

## 6. Cohérence avec les conventions établies

### ADR-011 — Zéro PrimeNG dans les 3 zones

| Fichier | Résultat |
|---|---|
| `pages/vitrine/**` | ✅ Aucun import `primeng/*` |
| `pages/connexion/**` | ✅ Aucun import `primeng/*` |
| `pages/parent/**` | ✅ Aucun import `primeng/*` |

> Les imports PrimeNG visibles dans le grep concernent uniquement `pages/auth/`,
> `pages/contactus/`, `pages/faq/`, `pages/crud/` — zone Application interne Poseidon,
> conforme à ADR-011.

### overflow-x : clip

| Fichier | Ligne | Description | Sévérité |
|---|---|---|---|
| `parent-dashboard.ts` | — | `<header>` avec `position:sticky` mais div racine sans `overflow-x:clip` — risque de scroll horizontal accidentel sur mobile | 🟡 |
| `vitrine.ts` | 29 | `overflow-x:clip` présent sur le div racine ✅ | — |
| `article.ts` | — | Pas de sticky délicat, pas de risque | 🔵 |
| `connexion.ts` | — | `overflow:hidden` (pas `clip`) — acceptable pour cette page | 🔵 |

### Pattern téléchargement blob

| Fichier | Résultat |
|---|---|
| `parent-dashboard.ts` (l. 350–368) | ✅ Blob via `URL.createObjectURL`, pas de token en URL |
| `quittance.ts` (l. 206–224) | ✅ Même pattern correct |

---

## 7. Écarts avec PAGES_ET_NAVIGATION.md et le cahier des charges

> Note : `PAGES_ET_NAVIGATION.md` déclare explicitement en introduction "Vitrine et
> Espace Parent ont leur propre structure, déjà posée (F04-F07)". Les écrans audités
> ne sont donc pas dans le tableau §2 — les écarts ci-dessous concernent le cahier
> des charges implicite de FRONTEND_CONTEXT.md §6.

| Fichier | Ligne | Description | Sévérité |
|---|---|---|---|
| `parent-dashboard.ts` | 37, 65 | Inscription en 5 étapes (FRONTEND_CONTEXT §6 : "inscription 5 étapes") : bouton présent mais noop — fonctionnalité prévue par la spec, absente du code et d'aucun prompt à ce jour | 🔴 |
| `quittance.ts` | — | Aperçu quittance : selon la spec parent, le document doit refléter les données réelles du versement sélectionné. L'implémentation actuelle est un gabarit purement statique, même avec un `versementId` dans l'URL | 🔴 |
| `parent-dashboard.ts` | 316 | `parentDisplayName` affiche `currentUser()?.sub` (email ou username technique) plutôt qu'un `nom + prénom` humain — pas prévu par l'API (le JWT ne contient pas de `nom`) | 🟡 |
| `vitrine.ts` | — | Section "admissions" (#admissions) présente dans le HTML mais sans ancre dans la nav principale (ni desktop ni mobile) — pas d'entrée "Admissions" dans le menu vitrine | 🟡 |
| `article.ts` | — | Page article existante : justifiée par les routes `GET /api/vitrine/actualites/{id}` dans API_CONTRACT — conforme ✅ | — |

---

## Synthèse priorisée

| # | Sévérité | Fichier(s) | Résumé | Corrections (prompt suivant) |
|---|---|---|---|---|
| 1 | 🔴 | `parent-dashboard.ts` | Erreur historique silencieuse (état 'error' → "Aucun versement") | Ajouter état `historiqueError` dans le template |
| 2 | 🔴 | `parent-dashboard.ts` | Bouton "Télécharger" appelle `goQuittanceDetail` au lieu de `downloadPdf` — état `pdfLoading` jamais atteint | Corriger le handler |
| 3 | 🔴 | `parent-dashboard.ts` | `+ Nouvelle inscription` et `Inscrire mon enfant` noop sans route | Placeholder route ou désactivation visuelle explicite |
| 4 | 🔴 | `connexion.ts` | Lien "Mot de passe oublié" recharge la page (`href="#"` nu) | Ajouter `(click)="noop($event)"` |
| 5 | 🔴 | `quittance.ts` | Aperçu statique même avec `versementId` réel | Charger `GET /api/finances/quittances/{id}` (si endpoint disponible) |
| 6 | 🔴 | `connexion.ts` | Boutons toggle password sans `aria-label` | Ajouter `aria-label` |
| 7 | 🔴 | `parent-dashboard.ts` | Mentions, modes paiement, Francophone/Anglophone, nom de zone hardcodés en français | Clés i18n dans `parent/fr.json` + `en.json` |
| 8 | 🔴 | `vitrine.ts` | `Marie Gisèle Bilingual College` × 2 et badge `'Actualité'` hardcodés | Clés i18n dans `vitrine/fr.json` + `en.json` |
| 9 | 🟡 | `parent-dashboard.ts` | `goHistoriqueQuittance` navigue vers 1er versement (pas une liste) | Revoir logique ou créer une liste quittances dédiée |
| 10 | 🟡 | `parent-dashboard.ts` | `overflow-x:clip` manquant sur le wrapper du dashboard sticky | Ajouter sur le div racine |
| 11 | 🟡 | `connexion.ts` | Inputs sans `<label>` (accessibilité) | Ajouter `aria-label` sur chaque input |
| 12 | 🟡 | `quittance.ts` | Échec PDF silencieux | Afficher un message d'erreur toast ou inline |
| 13 | 🟡 | `vitrine.ts` | Section "admissions" sans entrée dans la nav | Ajouter `#admissions` dans les deux navs (desktop + mobile) |
