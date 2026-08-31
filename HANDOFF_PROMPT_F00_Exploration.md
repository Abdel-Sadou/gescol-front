# HANDOFF — PROMPT_F00 Exploration Poseidon

Rapport de fin d'exploration. Aucun fichier de code applicatif créé (sauf `reference/DEMO_DESIGN_SPEC.md` pour la Partie 2).

---

## PARTIE 1 — Structure réelle du projet Poseidon

### 1. Arborescence complète de `src/app/`

```
src/
├── main.ts
├── app.component.ts
├── app.config.ts          ← configuration PrimeNG + routing
└── app.routes.ts          ← routing principal

src/app/
├── layout/
│   ├── service/
│   │   └── layout.service.ts
│   └── components/
│       ├── app.authlayout.ts
│       ├── app.breadcrumb.ts
│       ├── app.configurator.ts
│       ├── app.footer.ts
│       ├── app.landinglayout.ts
│       ├── app.layout.ts
│       ├── app.menu.ts
│       ├── app.menuitem.ts
│       ├── app.rightmenu.ts
│       ├── app.search.ts
│       ├── app.sidebar.ts
│       ├── app.topbar.ts
│       └── ui/
│           ├── creditcard.ts
│           └── sectioncard.ts
│
├── lib/
│   └── utils.ts
│
├── types/
│   ├── blog.ts
│   ├── customer.ts
│   ├── file.ts
│   ├── folder.ts
│   ├── image.ts
│   ├── kanban.ts
│   ├── mail.ts
│   ├── member.ts
│   ├── message.ts
│   ├── metric.ts
│   ├── product.ts
│   └── task.ts
│
├── pages/
│   ├── aboutus/
│   │   └── aboutus.ts
│   ├── auth/
│   │   ├── access.ts
│   │   ├── forgotpassword.ts
│   │   ├── lockscreen.ts
│   │   ├── login.ts
│   │   ├── newpassword.ts
│   │   ├── register.ts
│   │   ├── verification.ts
│   │   └── components/
│   │       ├── authlogowidget.ts
│   │       ├── applewidget.ts
│   │       └── googlewidget.ts
│   ├── blocks/
│   │   ├── blocks.ts
│   │   ├── blocks.routes.ts
│   │   └── components/
│   │       └── blockviewer.ts
│   ├── contactus/
│   │   └── contactus.ts
│   ├── crud/
│   │   └── crud.ts
│   ├── dashboards/
│   │   ├── banking/
│   │   │   ├── bankingdashboard.ts
│   │   │   └── components/
│   │   │       ├── accounthistorywidget.ts
│   │   │       ├── creditwidget.ts
│   │   │       ├── lastcardmovementswidget.ts
│   │   │       ├── overviewwidget.ts
│   │   │       └── statwidget.ts
│   │   ├── ecommerce/
│   │   │   ├── ecommercedashboard.ts
│   │   │   └── components/
│   │   │       ├── leaderboardwidget.ts
│   │   │       ├── productlistwidget.ts
│   │   │       ├── sellerswidget.ts
│   │   │       ├── statswidget.ts
│   │   │       ├── topproductswidget.ts
│   │   │       └── trafficwidget.ts
│   │   └── marketing/
│   │       ├── marketingdashboard.ts  ← page d'accueil par défaut (route '')
│   │       └── components/
│   │           ├── audiencebygenderwidget.ts
│   │           ├── emaildatachartwidget.ts
│   │           ├── emailhistorywidget.ts
│   │           ├── globalrankwidget.ts
│   │           └── inventorymanagementwidget.ts
│   ├── empty/
│   │   └── empty.ts
│   ├── help/
│   │   └── help.ts
│   ├── landing/
│   │   ├── index.ts
│   │   ├── about/
│   │   │   └── index.ts
│   │   ├── contact/
│   │   │   ├── index.ts
│   │   │   └── components/
│   │   │       └── contactherowidget.ts
│   │   ├── pricing/
│   │   │   ├── index.ts
│   │   │   └── components/
│   │   │       ├── pricingcomparewidget.ts
│   │   │       └── pricingherowidget.ts
│   │   └── components/
│   │       ├── customerslogowidget.ts
│   │       ├── feature1.ts
│   │       ├── footerwidget.ts
│   │       ├── patternwidget.ts
│   │       └── testimonialwidget.ts
│   ├── service/
│   │   └── photo.service.ts
│   └── uikit/
│       ├── miscdemo.ts
│       ├── panelsdemo.ts
│       └── uikit.routes.ts
│       (+ autres démos chargées en lazy)
│
└── apps/
    ├── apps.routes.ts
    ├── chat/
    │   ├── index.ts
    │   ├── chat-menu.ts
    │   ├── chatbox.ts
    │   └── chatsidebar.ts
    ├── cms/
    │   ├── cms.routes.ts
    │   ├── detail.ts
    │   ├── detail2.ts
    │   ├── edit.ts
    │   └── list.ts
    ├── files/
    │   ├── index.ts
    │   └── files.ts
    ├── mail/
    │   ├── mail.routes.ts
    │   ├── mail.service.ts
    │   ├── index.ts
    │   ├── compose-dialog.ts
    │   ├── mail-detail.ts
    │   └── mail-inbox.ts
    └── tasklist/
        ├── index.ts
        └── task-drawer.ts

Autres pages chargées en lazy (non listées par Glob, présentes dans app.routes.ts) :
  pages/notfound/, pages/oops/, pages/documentation/, pages/invoice/,
  pages/faq/, pages/usermanagement/, pages/ecommerce/
```

---

### 2. `src/app/layout/service/layout.service.ts` — gestion thème et menus

**Types exportés :**
```typescript
type ColorScheme = 'light' | 'dark' | 'dim';
type MenuMode    = 'static' | 'overlay' | 'slim' | 'slim-plus'
                 | 'horizontal' | 'compact' | 'reveal' | 'drawer';
```

**Signal `layoutConfig` (état initial) :**
```typescript
{
  preset:    'Aura',
  primary:   'blue',
  darkTheme: false,
  menuMode:  'static'
}
```

**Signal `layoutState` (état initial) :**
```typescript
{
  staticMenuInactive:  false,
  overlayMenuActive:   false,
  rightMenuVisible:    false,
  configSidebarVisible: false,
  mobileMenuActive:    false,
  searchBarActive:     false,
  sidebarExpanded:     false,
  menuHoverActive:     false,
  activePath:          null,
  anchored:            false
}
```

**Dark mode :**
- Ajoute/retire la classe `.app-dark` sur `document.documentElement`
- Utilise l'API `document.startViewTransition()` si disponible (animation native)
- Méthode publique : `toggleDarkMode(config?)`

**Modes menu :**
- `static` (défaut) — sidebar toujours visible, toggle via `staticMenuInactive`
- `overlay` — sidebar par-dessus le contenu, toggle via `overlayMenuActive`
- `slim / slim-plus / horizontal / compact` — sous-menus en overlay (computed `hasOverlaySubmenu`)
- `reveal / drawer` — variantes d'ouverture

**Méthodes publiques :**
- `changeMenuMode(mode)` — change le mode et remet à zéro l'état du menu
- `toggleMenu()` / `onMenuToggle()` — bascule le menu selon le mode actif
- `toggleConfigSidebar()` / `showConfigSidebar()` / `hideConfigSidebar()`
- `toggleRightMenu()`
- `updateBodyBackground(color)` — applique le gradient de fond (`--surface-ground`) selon la couleur primaire et le mode light/dark
- `isDesktop()` — `window.innerWidth > 991`

**`bodyBackgroundPalette` :**  
Dictionnaire de 18 couleurs (noir, blue, green, violet, orange, rose, cyan, pink, red, amber, yellow, lime, emerald, teal, sky, purple, fuchsia, indigo), chacune avec une valeur `light` (gradient CSS) et `dark` (couleur pleine foncée).

---

### 3. `src/app/layout/components/app.menu.ts` — modèle du menu

Structure : array d'objets avec `label`, `icon`, `path`, `items[]`, `routerLink[]`, `url[]`, `separator: true`.

**Sections du menu Poseidon par défaut (à remplacer entièrement pour COBIMAG) :**

| Section | Items principaux |
|---------|-----------------|
| Dashboards | Marketing (`/`), E-Commerce, Banking |
| Apps | CMS (Detail/List/Edit), Chat, Files, Mail, Task List |
| UI Kit | Form Layout, Input, Button, Table, List, Tree, Panel, Overlay, Media, Menu, Message, File, Chart, Timeline, Misc |
| Prime Blocks | Free Blocks, All Blocks (lien externe) |
| Utilities | Figma (lien externe) |
| Pages | Landing, Auth×8, Crud, Invoice, About Us, Help, Oops, Not Found, Empty, FAQ, Contact Us |
| E-Commerce | Product Overview/List/New, Shopping Cart, Checkout, Order History/Summary |
| User Management | List, Create |
| Hierarchy | Démonstration de sous-menus 3 niveaux |
| Start | Buy Now (primefaces.org), Documentation |

Le template du composant itère avec `@for` sur `model[]`, délègue le rendu à `<li app-menuitem>` et gère les séparateurs avec `class="menu-separator"`.

---

### 4. Configuration du preset PrimeNG — `src/app.config.ts`

```typescript
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',  /* ... */  950: '{blue.950}'  // palette bleue
    },
    overlay: {
      modal:   { borderRadius: '1.5rem' },
      popover: { borderRadius: '10px' }
    },
    colorScheme: {
      light: {
        surface: {
          0:   'color-mix(in srgb, {primary.950}, white 100%)',
          // ...
          950: 'color-mix(in srgb, {primary.950}, white 5%)'
        }
      },
      dark: {
        surface: {
          0:   'color-mix(in srgb, var(--surface-ground), white 100%)',
          // ...
          950: 'color-mix(in srgb, var(--surface-ground), white 5%)'
        }
      }
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }), withEnabledBlockingInitialNavigation()),
    provideHttpClient(withFetch()),
    provideZonelessChangeDetection(),
    providePrimeNG({ theme: { preset: MyPreset, options: { darkModeSelector: '.app-dark' } } })
  ]
};
```

**Points clés :**
- Base : thème **Aura** de PrimeNG
- Couleur primaire actuelle : **bleue** (à remplacer par le vert COBIMAG `#008B47`)
- Dark mode selector : `.app-dark` (cohérent avec `layout.service.ts`)
- Surfaces générées dynamiquement par `color-mix()` à partir de la couleur primaire
- Routing zoneless (Angular 21, signal-based)

---

### 5. Routing existant — `src/app.routes.ts`

Trois layouts :

**`AppLayout`** (sidebar + topbar — route `''`) :

| Chemin | Composant chargé |
|--------|-----------------|
| `` (vide) | MarketingDashboard ← **page d'accueil par défaut** |
| `dashboard-ecommerce` | EcommerceDashboard |
| `dashboard-banking` | BankingDashboard |
| `uikit/**` | lazy `uikit.routes` |
| `documentation` | Documentation |
| `pages/**` | lazy `pages.routes` |
| `apps/**` | lazy `apps.routes` |
| `blocks/**` | lazy `blocks.routes` |
| `ecommerce/**` | lazy `ecommerce.routes` |
| `profile/**` | lazy `usermanagement.routes` |

**`LandingLayout`** (route `landing`) :

| Chemin | Composant |
|--------|-----------|
| `` (vide) | Landing |
| `about` | About |
| `pricing` | Pricing |
| `contact` | Contact |
| `login` | Login |
| `register` | Register |
| `verification` | Verification |
| `forgot-password` | ForgotPassword |
| `new-password` | NewPassword |
| `lock-screen` | LockScreen |
| `oops` | Oops |
| `access` | Access (access denied) |
| `error` | redirect `/notfound` |

**`AuthLayout`** (route `auth`) : vide pour l'instant.

**Fallback** :
- `notfound` → composant `Notfound` (direct, sans layout)
- `**` → redirect `/notfound`

---

### 6. Versions installées

Fichier `package.json` :

| Package | Version déclarée | Version réelle |
|---------|-----------------|----------------|
| `@angular/core` et consorts | `^21` | Angular **21** |
| `primeng` | `^21.0.4` | PrimeNG **21.0.4** |
| `@primeuix/themes` | `^2.0.0` | **2.0.0** |
| `tailwindcss` | `^4.1.11` | **4.1.11** |
| `typescript` | `~5.9.3` | **5.9.3** |
| `primeicons` | `^7.0.0` | **7** |
| `chart.js` | `4.4.2` | **4.4.2** |

---

### 7. Page de connexion utilisable telle quelle ?

**Oui, une page de connexion complète existe** à la route `/landing/login`, sous `LandingLayout`.

Fichier : `src/app/pages/auth/login.ts`

**Structure de la page :**
- Conteneur `section` avec padding vertical généreux (py-36 / lg:py-52)
- Trois couches de cartes glassmorphism empilées (fond blanc 64% opacité, `backdrop-blur-[90px]`, rotations `±4°` / `±7°`, shadow bleue multi-stops)
- Formulaire centré `max-w-184` :
  - Logo (`<auth-logo-widget />`)
  - Titre "Login" (h1 4xl–6xl)
  - Sous-titre explicatif
  - Boutons "Sign in with Google" et "Sign in with Apple" (pill, border, icônes widgets)
  - Séparateur "or"
  - Input email (`pInputText`)
  - Input password (`pInputText`, type password)
  - Checkbox "Remember me" + lien "Forgot password?"
  - Bouton `p-button` rounded plein largeur "Login"
  - Lien "Create an Account"

**Ce qu'il faut adapter pour COBIMAG :**
- Remplacer la couleur primaire bleue par le vert `#008B47` dans le preset (affecte `p-button`, `text-primary`, `bg-primary`, etc.)
- Remplacer les textes anglais par "Se connecter", "Nom d'utilisateur", "Mot de passe", etc.
- Supprimer ou remplacer les boutons OAuth Google/Apple (la démo utilise des onglets login/signup sans OAuth)
- Adapter le fond : la démo utilise un fond plein vert `#00532B` avec pattern diagonal, pas le glassmorphism bleu du template
- Ajouter l'onglet "Créer un compte" avec indicateur de force de mot de passe

---

## RÉSUMÉ

- **Aucun fichier de code applicatif créé** dans ce prompt.
- **Fichier de design créé** : `reference/DEMO_DESIGN_SPEC.md`
- Le projet Poseidon est un template Angular 21 / PrimeNG 21 complet avec dashboards, apps, UI kit et pages d'auth prêtes.
- La page login existe et est fonctionnelle comme point de départ, mais son style (glassmorphism bleu) diverge de la démo validée (fond vert plein + carte blanche sobre).
- Le menu et les routes sont à vider/remplacer entièrement pour COBIMAG — le template sert uniquement de base technique (layout, routing, PrimeNG wiring).
- Prochaine étape recommandée : adapter le preset PrimeNG (remplacer `blue` par `green` / `#008B47`) avant de toucher aux composants.
