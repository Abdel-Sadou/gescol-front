# HANDOFF — PROMPT_F16 Back-office Vitrine

## Auto-vérification (9 critères)

| # | Critère | Résultat |
|---|---|---|
| 1 | **Champs conformes à API_CONTRACT.md** | ✅ Tous les champs vérifiés : `titre`, `contenu`, `datePublication` (YYYY-MM-DD), `imageUrl`, `publie` pour Actualités ; `libelle`, `description`, `dateDebut`, `dateFin` pour Calendrier ; `contenu`, `fichierUrl` pour ContenuVitrine ; `nom`, `fonction`, `photoUrl`, `ordre` pour Équipe. Aucun champ supposé. |
| 2 | **Clés ContenuVitrine dérivées de vitrine.ts** | ✅ Les 4 clés lues directement dans `vitrine.ts` : `MOT_FONDATEUR`, `HORAIRES_COURS`, `ACTIVITES_PERISCOLAIRES`, `COMMENT_INSCRIRE`. Aucune clé inventée. Liste exhaustive = liste exacte des appels `getContenu(...)` présents dans le composant. |
| 2bis | **Placeholder HTML, jamais valeur initiale** | ✅ Les textes de démo sont passés via l'attribut HTML `placeholder` sur les `<textarea>`. Un champ vide (`contenu = ''`) envoie `undefined` au backend (le composant passe `state.contenu \|\| undefined`). Une 404 backend laisse le champ à `''`. Le texte placeholder ne circule à aucun moment dans le formulaire ni dans la requête HTTP. |
| 3 | **Aucun upload simulé** | ✅ `imageUrl` (Actualités), `photoUrl` (Équipe), `fichierUrl` (ContenuVitrine) sont tous des `<input type="text">` simples. Chaque champ est accompagné d'un hint i18n expliquant qu'on colle une URL, aucun fichier n'est téléversé. |
| 4 | **Dépublié reste visible en liste** | ✅ La liste admin utilise `getActualitesAdmin()` et le toggle `publie` n'appelle que `modifierActualite()` (PUT). La suppression est séparée (bouton trash + confirm dialog). Un article dépublié reste en base et visible dans la liste avec le badge "Brouillon". |
| 5 | **Ordre équipe explicité dans le formulaire** | ✅ Libellé i18n `communication.equipe.form.ordre` = "Ordre d'affichage (les plus petits nombres apparaissent en premier)" en FR, "Display order (lowest numbers appear first)" en EN. |
| 6 | **Aucun texte français en dur** | ✅ Toutes les chaînes UI passent par `t(...)` Transloco, scope `'app'`. Clés FR+EN complètes dans `assets/i18n/app/fr.json` et `en.json`. |
| 7 | **Routes conformes à PAGES_ET_NAVIGATION.md §2** | ✅ 6 routes déclarées dans `app.routes.ts` : `/app/communication/actualites`, `/app/communication/actualites/nouvelle`, `/app/communication/actualites/:id/editer`, `/app/communication/calendrier`, `/app/communication/contenu`, `/app/communication/equipe` — toutes avec `roleGuard(['SUPER_ADMIN', 'COMMUNICATION'])`. |
| 8 | **STATS/PRESENTATION/NEWS/STEPS/VIE_SCOLAIRE — plus de repli permanent** | ✅ Tous vidés dans `vitrine.data.ts`. État du branchement API : `stats`, `presentation`, `steps` sont rendus dans des blocs `@if (x.length > 0) / @else` → sections masquées quand tableau vide. `news` : `@if (actualites().length > 0)` branché sur l'API, `@else` affiche `t('actualites.vide')`. `vieScolaire` horaires/activités/cantine : chargés depuis l'API ContenuVitrine → message `vide` si champ vide. La propriété `news` inutilisée et l'import `NEWS` ont été retirés de `vitrine.ts`. |
| 9 | **SYSTEM_FR/SYSTEM_EN/CYCLES conservés avec commentaire de vérification** | ✅ Les 3 structures sont conservées dans `vitrine.data.ts` avec le commentaire : "POINT OUVERT : vérifier avec l'établissement que les noms de classes (6ème → Terminale, Form 1 → Upper Sixth) et les examens listés correspondent bien à l'organisation réelle du collège." |

---

## Fichiers créés ou modifiés

| Fichier | Action |
|---|---|
| `src/app/core/services/vitrine.service.ts` | Enrichi — interfaces admin + méthodes HTTP CRUD pour 4 entités |
| `src/app/pages/app/communication/actualites-liste.ts` | Créé — liste paginée via GescolTableComponent, badge statut custom |
| `src/app/pages/app/communication/actualite-form.ts` | Créé — page dédiée création/édition, datepicker, toggleswitch |
| `src/app/pages/app/communication/calendrier.ts` | Créé — p-table + dialog compact, CRUD événements |
| `src/app/pages/app/communication/contenu-vitrine.ts` | Créé — 4 clés fixes (dérivées de vitrine.ts), placeholder HTML, PUT upsert |
| `src/app/pages/app/communication/equipe-pedagogique.ts` | Créé — p-table + dialog, photo thumbnail, nextOrdre() |
| `src/app.routes.ts` | 4 routes placeholder remplacées + 2 nouvelles routes actualités |
| `src/assets/i18n/app/fr.json` | Section `communication` complète (4 sous-modules) |
| `src/assets/i18n/app/en.json` | Idem en anglais |
| `src/app/data/vitrine.data.ts` | STATS/PRESENTATION/NEWS/STEPS/VIE_SCOLAIRE vidés ; CYCLES/SYSTEM_FR/SYSTEM_EN conservés avec commentaires |
| `src/app/pages/vitrine/vitrine.ts` | Sections adaptées — `@if/else` + messages `vide` i18n ; propriété `news` et import `NEWS` retirés |
| `src/assets/i18n/vitrine/fr.json` | Clés `vide` ajoutées (cantine, presentation, admissions stepsVide) |
| `src/assets/i18n/vitrine/en.json` | Idem en anglais |
| `docs/ROADMAP.md` | F16 marqué ✅ Fait |

---

## Points ouverts

- **Vérification établissement** : Les structures `CYCLES`, `SYSTEM_FR`, `SYSTEM_EN` conservées en repli décrivent le système éducatif camerounais en général (BEPC, Bac, GCE O/A-Level, Form 1 → Upper Sixth). À faire valider avec Bertrand/l'établissement que ces appellations correspondent bien à l'organisation réelle du collège.
- **Actualités admin — visibilité des brouillons** : `getActualitesAdmin()` appelle le même endpoint public `GET /api/vitrine/actualites` (paginé). Si le backend filtre côté serveur à `publie=true` même pour les admins authentifiés, les brouillons n'apparaîtraient pas dans la liste. À vérifier avec le backend (si nécessaire, demander un endpoint `/api/admin/actualites` ou un paramètre `?tousStatuts=true`).
- **F15 (Cahier de texte)** : dernier module restant, avec vraie logique offline (détection connectivité, file d'attente locale, synchronisation). C'est le plus complexe techniquement — à traiter en prompt dédié.
