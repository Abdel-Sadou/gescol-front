# HANDOFF F08bis — Habillage « Institutionnel chaud »

## 1. Résumé de la tâche

Intégration du thème visuel « Institutionnel chaud » issu de la démo validée
(`reference/angular-dashboard/`). Remplace entièrement la coque Poseidon
(`AppLayout`) par un `AppShell` personnalisé responsive, et ajoute le composant
`DashboardHome` branché sur des données statiques.

---

## 2. Fichiers créés / modifiés

### Nouveaux fichiers

| Fichier | Rôle |
|---|---|
| `src/app/shared/icon/icon.component.ts` | Composant `cob-icon` — SVG linéaire, `currentColor` |
| `src/app/shared/icon/icons.ts` | Table `ICONS: Record<string, string>` (18 icônes) |
| `src/app/core/models.ts` | Interfaces TypeScript du dashboard (`Enrolment`, `Collection`, `Alert`, `Activity`, `SchoolEvent`) |
| `src/app/data/dashboard-data.ts` | Données statiques de démonstration avec `// TODO(API)` |
| `src/assets/layout/variables/_cobimag.scss` | Jetons de design (couleurs, typo, rayons, ombres, géométrie) |
| `src/app/pages/app/dashboard/dashboard-home.ts` | Tableau de bord COBIMAG (4 cartes) |

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/app/layout/components/app.layout.ts` | **Réécriture complète** — AppShell autonome, styles inline |
| `src/assets/layout/layout.scss` | Ajout `@use './variables/_cobimag'` |
| `src/app.config.ts` | Surface PrimeNG : palette papier chaud (#fffdf8 → #4a3f34) |
| `src/app.routes.ts` | Route `tableau-de-bord` → `DashboardHome` (était `MarketingDashboard`) |

---

## 3. Architecture de la coque (AppLayout)

### Responsive en trois états

| Breakpoint | État sidebar | Comportement |
|---|---|---|
| ≥ 1081 px | Pleine (266 px) | Labels, groupes, année visibles |
| 768–1080 px | Icônes seules (78 px) | Textes masqués, bordure active à droite |
| ≤ 767 px | Masquée → overlay | Burger topbar, `transform: translateX(-100%)` → `0` |

### Signaux clés du composant

```typescript
sidebarOverlayOpen = signal(false)          // état overlay mobile
pageTitle          = signal('Tableau de bord') // mis à jour sur NavigationEnd
currentLang        = this.langService.currentLang  // signal Lang 'fr'|'en'
navGroups          = computed(() => buildNav(role)) // réactif à rôle + langue
userInitials       = computed(() => sub.split('@')[0].substring(0,2).toUpperCase())
```

### Navigation par rôle

La méthode `buildNav(role)` construit des `NavGroup[]` (2 niveaux, pas de sous-menus
dans la sidebar) filtrant les groupes selon le rôle, identique à la logique de
`app.menu.ts`. Les labels sont fournis par Transloco `app.menu.*`.

Groupes générés :
- **Groupe sans label** : Tableau de bord (tous rôles)
- **Scolarité** : Élèves, EDT, Résultats, Discipline, Cahier de texte (selon rôle)
- **Finances** : Versements, Paie, Moratoires (selon rôle)
- **Administration** : Personnel, Paramétrage, Communication (selon rôle)

### Topbar

- Burger (mobile uniquement) — toggle overlay
- Titre de page — lu dans `route.data['breadcrumb']` sur chaque `NavigationEnd`
- Barre de recherche (desktop uniquement, pas encore branchée sur l'API)
- Badge notifications — valeur statique `PENDING_ALERT_COUNT` (TODO: API)
- Initiales utilisateur — dérivées de `JwtPayload.sub` (pas de `nom`/`prenom` dans le JWT)

### Sélecteur de langue

Appelle `LanguageService.setLang(lang)` → met à jour Transloco + localStorage.
Les labels du nav se recalculent automatiquement via `computed()` réactif à `langChanges$`.

---

## 4. Tableau de bord (DashboardHome)

### Structure des 4 cartes

| Carte | Données | Source attendue |
|---|---|---|
| Élèves inscrits | `ENROLMENT` (total, capacité, répartition FR/EN, tendance) | `GET /api/eleves` × plusieurs appels |
| Recouvrement scolarité | `COLLECTION` (taux, montants) | Endpoint agrégat manquant |
| Dernières activités | `ACTIVITIES` (5 entrées) | Endpoint agrégat manquant |
| Alertes + Calendrier | `ALERTS`, `UPCOMING_EVENTS` | Divers endpoints |

### Sections bloquantes (backend non encore créé)

- `GET /api/dashboard/effectifs` — agrégat inscriptions (total, capacité, tendance)
- `GET /api/dashboard/recouvrement` — taux + montants recouvrement scolarité
- `GET /api/dashboard/activites-recentes?limit=5` — fil d'activité multi-modules

Ces endpoints **ne figurent pas dans le ROADMAP backend actuel**. Il faudra les
demander explicitement une fois les modules métier finalisés.

---

## 5. Jetons de design (_cobimag.scss)

Variables CSS custom dans `:root`. Injectées dans toute l'application via
`layout.scss`. Les composants n'ont **pas accès** aux variables SCSS de l'ancien
système de thème Poseidon — ils utilisent les jetons `--color-*`, `--font-*`,
`--radius-*`, `--shadow-*`, `--shell-*` définis ici.

Variables géométrie de la coque :
```css
--shell-sidebar-width: 266px;
--shell-topbar-height: 74px;
```

---

## 6. PrimeNG — palette surface mise à jour

Dans `app.config.ts`, les surfaces `light.surface` passent de `color-mix(...)` à
des hex fixes. Échelle :

| Token | Valeur | Usage sémantique |
|---|---|---|
| 50 | `#fffdf8` | Cartes (surface) |
| 100 | `#fbf8f2` | Fond général (canvas) |
| 200 | `#f4efe4` | Champs, pastilles (surface-sunken) |
| 400 | `#e9e1d2` | Bordures |

---

## 7. Icônes

`cob-icon` est réservé à la coque topbar (search, bell, burger). Les items de
navigation utilisent des `<i [class]="'pi pi-xxx'">` (PrimeIcons), pour rester
cohérents avec les PrimeIcons déjà chargés dans l'application interne.

Ajouter un tracé dans `icons.ts` :
```typescript
export const ICONS = {
    ...,
    monNouvelIcone: 'M... (path d SVG 24×24)',
};
```

Utilisation :
```html
<cob-icon [path]="ICONS['monNouvelIcone']" [size]="20" />
```

---

## 8. Ce qui reste à faire (F09+)

- Brancher les endpoints dashboard réels une fois disponibles côté backend
- Brancher la barre de recherche sur l'API élèves (`GET /api/eleves?nom=...`)
- Brancher `schoolYear` depuis `EtablissementService`
- Brancher `alertCount` depuis l'API alertes finances
- Implémenter la déconnexion dans le menu profil (bouton avec `AuthService.logout()`)
- Ajouter les polices Lora + Work Sans dans `index.html` (Google Fonts ou local)

---

*Document généré à la fin de PROMPT_F08bis — 2 septembre 2026*
