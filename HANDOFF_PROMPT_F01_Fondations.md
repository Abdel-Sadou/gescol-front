# HANDOFF — PROMPT_F01 Fondations Frontend

Build : **✅ succès** (`ng build --configuration development`, 11.7s, 0 erreur).

---

## Arborescence des fichiers créés/modifiés

```
src/
├── app.config.ts                           ← modifié (preset vert COBIMAG + APP_INITIALIZER)
├── app.routes.ts                           ← modifié (3 zones + guards)
└── app/
    ├── core/                               ← nouveau dossier
    │   ├── services/
    │   │   ├── etablissement.service.ts    ← nouveau
    │   │   └── auth.service.ts             ← nouveau
    │   ├── interceptors/
    │   │   └── auth.interceptor.ts         ← nouveau
    │   └── guards/
    │       ├── auth.guard.ts               ← nouveau
    │       └── role.guard.ts               ← nouveau
    ├── layout/components/
    │   ├── app.vitrinelayout.ts            ← nouveau (coquille sans PrimeNG)
    │   ├── app.parentlayout.ts             ← nouveau (coquille sans PrimeNG)
    │   └── app.menu.ts                     ← modifié (menu GESCOL par rôle)
    └── pages/
        ├── connexion/
        │   └── connexion.ts               ← nouveau (page login/signup fidèle démo)
        ├── vitrine/
        │   └── vitrine.ts                 ← nouveau (placeholder)
        ├── parent/dashboard/
        │   └── parent-dashboard.ts        ← nouveau (placeholder)
        └── placeholder/
            └── placeholder.ts             ← nouveau (module en cours de développement)
```

---

## PARTIE 1 — Preset PrimeNG vert COBIMAG

Fichier `src/app.config.ts`. Palette complète 50-950 dérivée autour de `#008B47` :

| Niveau | Hex |
|--------|-----|
| 50  | `#f0faf5` |
| 500 | `#008B47` (couleur de base) |
| 800 | `#00532b` (fond connexion) |
| 950 | `#001f10` |

- Dark mode selector inchangé : `.app-dark`
- `overlay.modal.borderRadius: 1.5rem` et `overlay.popover.borderRadius: 10px` conservés
- Surfaces générées par `color-mix()` comme dans l'original

---

## PARTIE 2 — EtablissementService

Fichier `src/app/core/services/etablissement.service.ts`.

- Appelé via `APP_INITIALIZER` au bootstrap (avant le premier rendu)
- `GET /api/etablissement/courant` (endpoint public, pas de token nécessaire)
- En cas d'erreur : fallback silencieux avec les couleurs de la démo (#008B47, #5F6161, #E8722C)
- Injecte 5 CSS custom properties sur `document.documentElement` :
  - `--color-primary` (#008B47)
  - `--color-secondary` (#5F6161)
  - `--color-accent` (#E8722C)
  - `--color-primary-dark` (darkened 40% ≈ #00532B)
  - `--color-primary-light` (lightened 90% ≈ #EAF5EE)
- Appelle `updatePreset()` pour mettre à jour dynamiquement le preset PrimeNG de la zone interne
- `buildPalette()` : dérive une palette 50-950 depuis un hex unique (approximation par mélange linéaire)

---

## PARTIE 3 — Décision de layout (documentée explicitement)

### Espace Parent → `ParentLayout` (nouveau)

**Décision** : nouveau layout minimal `src/app/layout/components/app.parentlayout.ts`, pas `AuthLayout`.

**Raison** : `AuthLayout` importe `AppConfigurator` qui dépend de `DrawerModule`, `SelectButtonModule`, `ToggleSwitchModule`, `RadioButtonModule` (tous PrimeNG). Réutiliser `AuthLayout` aurait violé ADR-011.

`ParentLayout` : un seul import (`RouterModule`), template réduit à `<router-outlet />`.

### Vitrine → `VitrineLayout` (nouveau)

**Décision** : nouveau layout minimal `src/app/layout/components/app.vitrinelayout.ts`, pas `LandingLayout`.

**Raison** : `LandingLayout` importe `TopbarWidget`, `FooterWidget`, `AppConfigurator` — tous liés au style Poseidon (glassmorphism bleu, thème PrimeNG). Incompatible avec le design COBIMAG validé. Violation ADR-011.

`VitrineLayout` : même structure que `ParentLayout` — coquille `router-outlet` pure.

### Vérification ADR-011

Checklist des imports dans les deux nouveaux layouts :
- `RouterModule` — Angular core, ✅ autorisé
- Aucun import `primeng/*`, `@primeuix/*`, `primeicons` dans les templates — ✅

---

## PARTIE 4 — Authentification

### `AuthService` (`src/app/core/services/auth.service.ts`)

- `login(credentials)` → POST /api/auth/login → stock token + refreshToken
- `refresh()` → POST /api/auth/refresh (retourne `boolean`)
- `logout()` → vide localStorage + redirect `/connexion`
- `getToken()` → token actuel (pour l'intercepteur)
- Signals : `_token`, `isAuthenticated`, `currentUser`, `role`
- `isAuthenticated` vérifie l'expiration JWT (`exp * 1000 > Date.now()`)

**Décodage JWT** : `atob()` sur la partie payload (base64url → base64), lecture de `sub`, `role`, `exp`. Jamais de vérification de signature côté client.

**Stockage localStorage** — compromis documenté dans le code : acceptable pour SPA interne sans contenus tiers, mais à revoir si les exigences de sécurité évoluent (alternative : httpOnly cookie + CSRF).

### `AuthInterceptor` (`src/app/core/interceptors/auth.interceptor.ts`)

- Ajoute `Authorization: Bearer <token>` sur toutes les requêtes sortantes (si token présent)
- Sur 401 : tente un refresh unique (verrou `isRefreshing` pour éviter les appels concurrents)
- Si refresh réussi : rejoue la requête originale avec le nouveau token
- Si refresh échoue : propage l'erreur (AuthService.refresh() appelle logout() avant)

Enregistré via `withInterceptors([authInterceptor])` dans `app.config.ts` (approach fonctionnelle Angular 21).

---

## PARTIE 5 — Routing à trois zones

Fichier `src/app.routes.ts`.

| Route | Layout | Guard | Note |
|-------|--------|-------|------|
| `/` | — | — | Redirect → `/vitrine` |
| `/connexion` | Aucun (lazy) | — | Page login/signup |
| `/vitrine/**` | `VitrineLayout` | — | Public |
| `/parent/**` | `ParentLayout` | `authGuard + roleGuard(['PARENT'])` | JWT PARENT |
| `/app/**` | `AppLayout` | `authGuard + roleGuard([SUPER_ADMIN, SECRETARIAT, ECONOMAT, ENSEIGNANT, COMMUNICATION])` | JWT interne |
| `/landing/**` | `LandingLayout` | — | Conservé — démo Poseidon |
| `/notfound` | Aucun | — | Composant direct |
| `**` | — | — | Redirect → `/notfound` |

**`authGuard`** : vérifie `authService.isAuthenticated()`, redirige vers `/connexion` sinon.

**`roleGuard(allowed)`** : fabrique retournant un `CanActivateFn` qui vérifie `authService.role()`.

**Redirect post-login** (dans `Connexion.onLogin()`) : `role === 'PARENT'` → `/parent`, sinon → `/app`.

---

## PARTIE 6 — Menu de l'application interne

Fichier `src/app/layout/components/app.menu.ts`.

- Tout le contenu de démo Poseidon supprimé (Dashboards E-Commerce/Banking, Apps Chat/Mail/CMS, UI Kit, Prime Blocks, Utilities, E-Commerce, User Management, Hierarchy, Start)
- Nouveau menu dynamique : `model = computed(() => this.buildMenu(this.authService.role()))`
- Template mis à jour de `model` → `model()` (signal)

**Menu par rôle :**

| Rôle | Sections visibles |
|------|------------------|
| `SUPER_ADMIN` | Tableau de bord, Élèves, Finances, Paie, Personnel, Paramétrage, Emploi du temps, Résultats, Discipline, Cahier de texte, Communication |
| `SECRETARIAT` | Tableau de bord, Élèves |
| `ECONOMAT` | Tableau de bord, Finances, Paie |
| `ENSEIGNANT` | Tableau de bord, Emploi du temps, Résultats, Discipline, Cahier de texte |
| `COMMUNICATION` | Tableau de bord, Communication |
| _(null/unknown)_ | Tableau de bord uniquement |

Toutes les routes de menu (`/app/eleves`, `/app/finances`, etc.) sont des placeholders définis dans `app.routes.ts` → composant `Placeholder`.

**Fichiers démo non supprimés** : `src/app/pages/uikit/`, `apps/`, `dashboards/ecommerce/`, etc. sont conservés. Seul le menu qui y pointait est retiré.

---

## PARTIE 7 — Page de connexion

Fichier `src/app/pages/connexion/connexion.ts`. Route : `/connexion`.

**Fidélité DEMO_DESIGN_SPEC.md — Écran 2 :**
- Fond plein `var(--color-primary-dark,#00532B)` + pattern diagonal repeating-linear-gradient + dégradé radial
- Carte blanche centrée `max-width:420px`, `border-radius:6px`, `padding:36px 32px`, `box-shadow:0 20px 50px rgba(0,0,0,0.35)`
- Logo circulaire (placeholder "CB") + "Espace Parent" (Lora 700 15px) + sous-titre italique
- Onglets "Se connecter" / "Créer un compte" avec border-bottom coloré dynamique
- Formulaire connexion : username, password (toggle œil SVG natif), lien mot de passe oublié, bouton vert
- Formulaire inscription : nom, prénom (side-by-side), email, password + indicateur de force
- Bouton CTA : `background:var(--color-primary,#008B47)` — couleur dynamique

**Zéro PrimeNG** — vérifié : `imports: []` dans le composant, HTML natif uniquement.

**Couleurs** : toutes via `var(--color-*)` avec fallback hardcodé. Seuls `#1c2a20` (texte), `#FFFFFF`, `#C9CBC9`, `#E7E7E5`, `#5F6161` (fixes neutres) et `#C0392B` (erreur) sont codés en dur — pas des couleurs de marque (ADR-011 conforme).

---

## Tests manuels à exécuter

```
ng serve
```

| Test | URL | Résultat attendu |
|------|-----|-----------------|
| Accès racine | `/` | Redirect → `/vitrine` → placeholder Vitrine |
| Page connexion | `/connexion` | Fond vert foncé, carte blanche, onglets |
| Accès /app sans token | `/app` | Redirect → `/connexion` |
| Accès /parent sans token | `/parent` | Redirect → `/connexion` |
| Connexion SUPER_ADMIN (test) | POST /api/auth/login | Redirect → `/app`, menu complet |
| Connexion PARENT (test) | POST /api/auth/login | Redirect → `/parent`, placeholder |
| Branding DOM | DevTools | `--color-primary` visible sur `html` dès le chargement |
| Vérification PrimeNG /vitrine | DevTools HTML | Aucune classe `p-*` ou composant PrimeNG dans le DOM |
| Vérification PrimeNG /parent | DevTools HTML | Idem |

---

## Choix techniques et écarts

| Point | Décision | Raison |
|-------|----------|--------|
| `VitrineLayout` et `ParentLayout` = coquilles vides | Recréés depuis zéro plutôt que modifiés | AuthLayout et LandingLayout importent PrimeNG via AppConfigurator |
| `localStorage` pour les tokens | Accepté avec compromis documenté | httpOnly cookie nécessite CSRF + backend Spring Security modifié |
| `buildPalette()` par mélange linéaire | Approximation | Dérivation HSL correcte nécessiterait une lib de couleurs externe |
| `app.menu.ts` : `model` devient signal | Breaking change mineur | Nécessaire pour la réactivité au changement de rôle |
| Placeholder pour tous les modules | Routes définies, composant générique | Écrans réels à venir dans PROMPT_F02+ |

---

## Questions ouvertes

1. **Champ username vs email** : le formulaire de connexion utilise `username`. Si l'API attend un `email`, adapter le payload dans `AuthService.login()`.
2. **Payload `/api/parent/comptes`** : nom, prenom, email, password supposés — à confirmer avec le DTO réel du backend.
3. **Indicateur de force** du mot de passe : logique approximative (longueur + majuscule + chiffre + spécial). Si une règle exacte est définie côté backend, aligner.
4. **`/app/tableau-de-bord`** : pointe encore vers `MarketingDashboard` (démo Poseidon). À remplacer par un vrai tableau de bord GESCOL dans un prompt dédié.

---

## Décision à documenter (CLAUDE.md demande de signaler)

**Layout Vitrine et Espace Parent : deux nouveaux layouts vides créés** — décision prise après vérification que ni `AuthLayout` ni `LandingLayout` ne peut servir de coquille sans transporter des dépendances PrimeNG (via `AppConfigurator`). Pas de nouvel ADR nécessaire : confirme et précise ADR-011.
