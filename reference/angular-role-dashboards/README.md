# COBIMAG — Tableaux de bord par rôle (Angular 21)

Contenu seul (sans sidebar), à placer dans la zone de contenu de votre coque
Poseidon/PrimeNG. Un composant par rôle, une file « À traiter » commune.

## Intégration

1. Copier `src/app/features/dashboard/` dans votre projet.
2. Route :

```ts
{ path: '', loadComponent: () => import('./features/dashboard/dashboard-home.component')
    .then(m => m.DashboardHomeComponent) }
```

3. Template de la page (le rôle vient de votre service d'authentification) :

```html
<cob-dashboard-home [role]="auth.role()" [displayName]="auth.displayName()" />
```

4. `provideHttpClient()` doit être fourni (déjà le cas dans un projet API).
5. Polices Lora + Work Sans chargées dans `index.html` ; variables CSS COBIMAG
   dans `styles.css` (sinon, copier `dashboard-tokens.css` — optionnel, tout a
   une valeur de repli).

## Passer des données statiques à l'API

Les données de `data/dashboard.mock.ts` sont servies tant que
`DASHBOARD_USE_MOCK` vaut `true`. Une fois le backend prêt :

```ts
// app.config.ts
providers: [
  { provide: DASHBOARD_USE_MOCK, useValue: false },
  // { provide: DASHBOARD_API_BASE, useValue: environment.api + '/tableau-de-bord' },
]
```

Les contrats de réponse sont dans `models/dashboard.models.ts` et décrits
endpoint par endpoint dans **API_TABLEAU_DE_BORD.md**.

## Structure

```
features/dashboard/
  dashboard-home.component.ts     ← aiguillage par rôle
  models/dashboard.models.ts      ← contrats d'API (DTO) + modèles de vue
  services/
    dashboard-api.service.ts      ← 5 GET, bascule mock / API
    task-action.service.ts        ← exécute les actions de la file (navigation ou commande)
  data/dashboard.mock.ts          ← données statiques réalistes
  shared/
    role-dashboard.base.ts        ← chargement, état, actions, rechargement
    loadable.ts                   ← état chargement / erreur / prêt en signal
    dashboard-hero / kpi-grid / task-queue / dashboard-state  ← briques communes
    dashboard-layout.css          ← grille + panneaux communs
    format.ts                     ← FCFA, millions, dates FR
  roles/
    direction-dashboard      (SUPER_ADMIN)   → Pouls des classes (notes validées FR/EN × niveaux)
    secretariat-dashboard    (SECRETARIAT)   → Portail du jour (bons de sortie)
    economat-dashboard       (ECONOMAT)      → Encaissements 7 jours
    enseignant-dashboard     (ENSEIGNANT)    → Ma journée (créneaux)
    communication-dashboard  (COMMUNICATION) → Vitrine en ce moment
```

## Principes

- **L'action avant la statistique** : chaque écran s'ouvre sur ce qui est à faire
  aujourd'hui, pas sur des graphiques.
- **Textes composés côté front** à partir de chiffres : le backend ne renvoie
  jamais de phrases, seulement des données (sauf `echeanceLibelle` des tâches).
- **L'orange est réservé** aux tâches urgentes et aux indicateurs en alerte.
- **États gérés** : squelette de chargement, erreur avec « Réessayer », file vide.
- **Container queries** : la grille s'adapte à la largeur de la zone de contenu,
  pas de la fenêtre (juste quand la sidebar se replie).
- **Accessibilité** : `aria-label` sur les graphiques, focus visible, contrastes ≥ 4.5:1,
  `prefers-reduced-motion` respecté sur les squelettes.

## Points ouverts

- **Paramétrage pour ENSEIGNANT** : accès en lecture d'après la carte des pages,
  mais sans valeur au quotidien — recommandation : masquer du menu, garder la route.
- **Enseignant professeur principal (R21)** : ajouter une tâche « Valider les notes
  de ma classe » dans sa file — le backend peut l'inclure sans changer le front.
- `EnseignantDashboardComponent` accepte `[now]` pour les tests et les démos.
