# COBIMAG — Tableau de bord (Angular 21)

Direction visuelle **« Institutionnel chaud »** : fond papier, vert profond,
serif de titrage, chaleur institutionnelle plutôt que style SaaS.

## Démarrer

```bash
npm install
npm start        # http://localhost:4200
```

## Build de production

```bash
npm run build    # dist/cobimag-dashboard
```

## Les deux composants

### 1. `AppShellComponent` — `src/app/layout/app-shell/`
La coque : sidebar (logo, navigation icônes + libellés, sélecteur FR/EN en bas)
et barre du haut (recherche, notifications, profil).

Le contenu central est un **`<ng-content />`** : la coque accueille n'importe
quel écran, pas seulement le tableau de bord.

```html
<cob-app-shell>
  <router-outlet />
</cob-app-shell>
```

Le menu est **décoratif** dans cette maquette (`href="#"`). Pour brancher la
vraie navigation : importer `RouterLink` / `RouterLinkActive` dans le composant,
remplacer `href="#"` par `[routerLink]="item.route"`, et laisser
`routerLinkActive="nav__item--active"` piloter l'état actif au lieu de
`item.active`.

Le titre de page est un signal (`pageTitle`) — à alimenter depuis les données
de route (`title`) ou un service de page.

### 2. `DashboardHomeComponent` — `src/app/features/dashboard-home/`
Uniquement les cartes : **Élèves inscrits**, **Recouvrement scolarité**,
**Dernières activités**, **Alertes en attente**, **Prochains événements**.
Chargé en `loadComponent` sur la route `''`.

## Couleurs et jetons

Toutes les couleurs sont des **variables CSS** déclarées une seule fois dans
`src/styles.css` (`:root`) — aucune valeur hexadécimale n'est dispersée dans
les composants :

| Variable | Valeur | Rôle |
|---|---|---|
| `--color-primary` | `#008B47` | vert de marque |
| `--color-primary-dark` | `#173D2A` | sidebar, titres, carte recouvrement |
| `--color-primary-deep` | `#1F5C3D` | libellés forts, barre francophone |
| `--color-primary-soft` | `#EAF3ED` | pastilles de succès |
| `--color-accent` | `#E8722C` | points d'attention (usage rare) |
| `--color-accent-deep` | `#8A4416` | texte sur fond chaud |
| `--color-canvas` | `#FBF8F2` | fond papier |
| `--color-surface` | `#FFFDF8` | cartes |
| `--color-text-muted` | `#736A5C` | texte secondaire (contraste ≥ 4.5:1) |

Y figurent aussi les familles typographiques (`--font-serif` = Lora,
`--font-sans` = Work Sans), les rayons (`--radius-*`), les ombres
(`--shadow-*`) et la géométrie de la coque (`--shell-sidebar-width`,
`--shell-topbar-height`).

Pour un thème sombre ou une seconde marque : redéfinir ces variables sous un
sélecteur (`[data-theme='dark']`), rien d'autre à toucher.

## Données

`src/app/data/school-data.ts` — données statiques réalistes, typées par les
interfaces de `src/app/core/models.ts`. À remplacer par les appels API en
conservant les mêmes formes ; les composants n'ont alors pas à changer.

## Organisation

```
src/
  styles.css                        ← jetons de design (source unique)
  app/
    app.component.ts                ← coque + <router-outlet>
    app.routes.ts
    core/
      models.ts                     ← interfaces
      icons.ts                      ← tracés SVG (indirection PrimeIcons)
    data/school-data.ts             ← données statiques
    shared/icon/                    ← <cob-icon>
    layout/app-shell/               ← composant 1
    features/dashboard-home/        ← composant 2
```

## Notes d'intégration

- **Angular 21** : composants standalone (pas de `NgModule`), `input()` signal,
  blocs de contrôle `@for` / `@if`, `ChangeDetectionStrategy.OnPush` et
  détection de changement *zoneless* (`provideZonelessChangeDetection`).
- **PrimeNG** : la structure est volontairement conservatrice — `p-card` peut
  remplacer `.card`, `p-badge` les `.chip`, `p-progressBar` la `.gauge`,
  `p-menu` la navigation. Les jetons CSS peuvent alimenter les variables de
  thème PrimeNG.
- **Icônes** : `<cob-icon>` rend un tracé de `ICONS`. Pour passer à PrimeIcons,
  remplacer le composant et garder les clés.
- **Accessibilité** : contrastes de texte vérifiés ≥ 4.5:1, `aria-label` sur la
  barre de répartition et les actions de la barre du haut.
- Le logo est en `src/assets/logo-cobimag.png`.
