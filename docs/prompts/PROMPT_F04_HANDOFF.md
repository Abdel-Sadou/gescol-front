# PROMPT_F04 — Handoff : Intégration démo Angular

**Prompt source** : `PROMPT_F04_IntegrationDemoAngular.md`  
**Statut** : ✅ Terminé — livré en deux sessions, extensions hors scope incluses.

---

## Écrans livrés

| # | Écran | Composant | Route | Statut |
|---|---|---|---|---|
| 1 | Vitrine (landing) | `src/app/pages/vitrine/vitrine.ts` | `/vitrine` | ✅ |
| 2 | Connexion (login) | `src/app/pages/connexion/connexion.ts` | `/connexion` | ✅ |
| 3 | Parent dashboard | `src/app/pages/parent/dashboard/parent-dashboard.ts` | `/parent` | ✅ |
| 4 | Quittance (receipt) | `src/app/pages/parent/quittance/quittance.ts` | `/parent/quittance` | ✅ |
| 5 | Fiche élève | `src/app/pages/app/fiche-eleve/fiche-eleve.ts` | `/app/fiche-eleve` | ✅ |
| + | **Page article** (hors scope F04) | `src/app/pages/vitrine/article/article.ts` | `/vitrine/actualites/:id` | ✅ |

---

## Fichiers créés

```
src/app/pages/vitrine/vitrine.ts                    remplacé
src/app/pages/vitrine/article/article.ts            nouveau (hors scope)
src/app/pages/connexion/connexion.ts                remplacé
src/app/pages/parent/dashboard/parent-dashboard.ts  nouveau
src/app/pages/parent/quittance/quittance.ts         nouveau
src/app/pages/app/fiche-eleve/fiche-eleve.ts        nouveau
src/app/shared/cobimag-base.ts                      nouveau (base partagée)
src/app/data/vitrine.data.ts                        nouveau
src/app/data/parent.data.ts                         nouveau
src/assets/i18n/vitrine/fr.json                     nouveau
src/assets/i18n/vitrine/en.json                     nouveau
src/assets/i18n/parent/fr.json                      nouveau
src/assets/i18n/parent/en.json                      nouveau
src/assets/i18n/app/fr.json                         nouveau
src/assets/i18n/app/en.json                         nouveau
src/assets/doc-page.js                              copié depuis démo
src/assets/logo-cobimag.png                         logo école
```

## Fichiers modifiés

```
src/app.routes.ts                                   vitrine, parent, app, article
src/app/layout/components/app.menu.ts               entrée Fiche élève
src/index.html                                      Google Fonts Lora+Work Sans, doc-page.js
angular.json                                        assets: src/assets déclaré
```

---

## Clés i18n créées

**Scope `vitrine`** (`fr.json` + `en.json`) :
`nav.*`, `topbar.*`, `accueil.*`, `sousSystemes.*`, `ecole.*`, `formations.*`,
`vieScolaire.*`, `actualites.*`, `admissions.*`, `footer.*`, `article.*`

**Scope `parent`** (`fr.json` + `en.json`) :
`connexion.*` (onglets, champs, boutons, force mdp, retour site),
`dashboard.*` (enfants, scolarité, résultats, discipline, historique),
`quittance.*`

**Scope `app`** (`fr.json` + `en.json`) :
`fiche.*` (titre, recherche, infos, filiation, solde, boutons), `menu.*`

---

## Bugs résolus en cours de session

| Problème | Cause | Fix |
|---|---|---|
| `NG2007` — CobimagBase non décorée | Angular 21 exige `@Injectable()` sur les classes abstraites utilisant `inject()` | Ajout `@Injectable()` sur CobimagBase |
| 404 `/assets/*` au runtime | Builder `application` ne sert pas `src/assets` implicitement | Déclaration explicite dans `angular.json` |
| `Missing translation 'topbar.adresse'` | Transloco v8 : `prefix:` obligatoire sur la directive scope | `prefix: 'xxx'` ajouté sur tous les `*transloco` |
| Mauvaises polices (Figtree au lieu de Lora) | `index.html` Poseidon n'avait que ses propres polices | Ajout Lora + Work Sans (Google Fonts) dans `index.html` |
| Boutons nav rechargent la page | Angular Router intercepte `href="#section"` | Méthode `scrollTo(e, id)` dans CobimagBase via `scrollIntoView` |
| Header sticky masqué au scroll | `overflow-x: hidden` sur div racine crée un scroll container, casse `sticky` | Remplacé par `overflow-x: clip` |
| "Lire la suite" ne fait rien (fallback statique) | Bloc `@else` statique avait `noop` ; `NEWS` sans `id` | `id` ajouté à `NEWS`, `ARTICLES` statiques créés avec contenu complet, `goArticle()` branché |

---

## Corrections post-livraison (hors scope F04)

- **Barre contact repliable** après 80 px de scroll — `scrollY` signal + `computed topbarStyle`, transition `max-height 0.28s`.
- **Logo local en fallback** — `displayLogoUrl = computed(() => logoUrl() ?? '/assets/logo-cobimag.png')` dans vitrine et article, évite les initiales quand l'API ne répond pas.
- **`goArticle(id, e?)`** ajouté à `CobimagBase` — navigation vers `/vitrine/actualites/:id`.

---

## TODOs explicites pour prompts suivants

```typescript
// vitrine.data.ts
// TODO(API): STATS → EtablissementService.getStatistiques()
// TODO(API): PRESENTATION → VitrineService.getContenu('PRESENTATION_*')
// TODO(API): CYCLES → VitrineService.getCycles()
// TODO(API): NEWS → VitrineService.getActualites()   ← liste déjà branchée, statique en fallback
// TODO(API): STEPS → VitrineService.getContenu('ETAPES_INSCRIPTION')

// parent.data.ts
// TODO(API): KIDS → GET /api/parent/mes-enfants
// TODO(API): STUDENTS → GET /api/eleves?query=

// quittance.ts
// TODO(API): bouton "Télécharger PDF officiel" → GET /api/finances/quittances/{id}/pdf

// article.ts
// TODO(API): GET /api/vitrine/actualites/{id} public inexistant — filtrage sur liste (max 100)
//            À revoir si le backend expose cet endpoint
```

---

## Décisions à documenter (ADR)

1. **`overflow-x: clip` au lieu de `hidden`** sur les wrappers de pages publiques — règle à généraliser à tous les futurs composants vitrine/parent pour ne jamais casser `position: sticky`.

2. **Fallback logo local** — convention : `displayLogoUrl = computed(() => logoUrl() ?? '/assets/logo-cobimag.png')` partout où le logo est affiché dans les zones publiques. Ne pas afficher d'initiales comme substitut.

3. **Page article sans GET by ID public** — `GET /api/vitrine/actualites/{id}` n'existe pas en accès public (seul le listing est public). La page article charge la liste complète (max 100 items) et filtre côté client. Fallback sur `ARTICLES` statiques si l'API est indisponible.

4. **`prefix:` obligatoire sur `*transloco`** — jsverse/transloco v8.4.0 : sans `prefix: 'scope-name'`, `t('clé')` cherche la clé nue dans le store `fr` (vide) au lieu de `scope.clé`. Règle : toujours écrire `*transloco="let t; scope: 'xxx'; prefix: 'xxx'"`.
