# ADR-013 — Pattern formulaire pleine page : saisie sectionnée + rail récapitulatif

**Date** : 2026-09-03
**Statut** : Accepté
**Contexte** : refonte de `eleve-form.ts` (F08/F09)

---

## Contexte

Le formulaire "Nouvel élève" généré en F08 suivait le pattern PrimeNG de
base : grille 2 colonnes plate, aucune section sémantique, champ orphelin
(téléphone seul sur sa ligne), checkboxes larguées en bas, titre dupliqué
dans le topbar ET dans la card. Jugé indigne d'un frontend expert après
revue visuelle.

Un prototype validé par Claude Design (`reference/angular-cobimag-student-form`)
apporte une réponse structurée au problème.

---

## Décision

Pour tout **formulaire pleine page complexe** (≥ 8 champs, plusieurs
sections sémantiques, au moins un champ obligatoire non trivial), adopter
le pattern suivant :

### 1. Architecture de composant

**Page principale** (`*-form.ts`) :
- `ChangeDetectionStrategy.OnPush`
- `signal<Draft>()` comme unique source de vérité (pas `FormBuilder`)
- `patch<K>(key, value)` : mutation atomique du brouillon ; invalide les
  champs dérivés si nécessaire (ex. changer le sous-système → vide la classe)
- `computed()` pour tout état dérivé : `filled`, `checklist`, `canSubmit`,
  `classOptions`, `blockingLabel`, etc.
- `FormsModule` avec `[ngModel]` / `(ngModelChange)` en template
- CSS dans un fichier dédié `*-form.css`

**Rail récapitulatif** (`*-summary-rail.ts`) :
- Composant séparé, purement présentationnel
- Reçoit tout via `input()`, émet via `output()`
- `ChangeDetectionStrategy.OnPush`

### 2. Layout

```
┌─────────────────────────────────────┬────────────────┐
│  Formulaire sectionné (flex: 1)     │  Rail (312px)  │
│                                     │  sticky        │
│  ● En-tête : ← Titre  [horodatage] │  ┌──────────┐  │
│  ─────────────────────────────────  │  │ Preview  │  │
│  § 1 · SECTION ────────────────     │  │ (sombre) │  │
│  [champ]  [champ]  [champ]          │  └──────────┘  │
│  ─────────────────────────────────  │  ┌──────────┐  │
│  § 2 · SECTION ────────────────     │  │ Checklis │  │
│  [cards sélectables]                │  │ 3 / 5    │  │
│  [champ]  [toggle]                  │  └──────────┘  │
│  ─────────────────────────────────  │  [⚠ Warning]   │
│  § 3 · SECTION ────────────────     │  [Créer ████]  │
│  [champ]  [champ]                   │  [Draft][Ann.] │
│  [champ]  [champ]  [champ]          └────────────────┘
└─────────────────────────────────────┘
```

Container queries (pas media queries) : le rail passe en bandeau horizontal
au-dessus du formulaire quand la colonne totale est ≤ 1080px.

### 3. Controls : règle de choix

| Situation | Control à utiliser |
|---|---|
| Choix binaire (2 options) | `p-selectbutton` (toggle M/F) |
| Choix structurant important (≤ 3 options) | Cards visuelles avec `aria-pressed` |
| Liste longue (> 3 options) | `p-select` avec `[filter]` si > 8 items |
| Case à cocher | `.ef-toggle` : checkbox + titre + hint contextuel |

Le sous-système FR/EN est **toujours** représenté par des cards visuelles,
jamais par un `<select>`.

### 4. Validation visuelle (pas de messages per-field)

- Champ renseigné (requis) : bordure verte (`ef-ok`)
- Premier champ obligatoire manquant : bordure orange (`ef-blocking`)
- Le rail checklist indique ce qui manque — pas de messages en rouge sous
  chaque champ
- Le bouton "Créer" est désactivé tant que `canSubmit() === false`

### 5. Tokens CSS

Les styles utilisent exclusivement :
- `var(--p-*)` pour les jetons PrimeNG (surface, primary, shadow…)
- `var(--color-accent, #E8722C)` pour l'accent dynamique (branding)
- Jamais de valeur hexadécimale de marque codée en dur dans un composant

---

## Périmètre d'application

| Type d'écran | Pattern applicable |
|---|---|
| Formulaire pleine page complexe (Élève, Personnel…) | ✅ Complet (formulaire + rail) |
| Formulaire pleine page simple (≤ 4 champs) | ⚡ Partiel : sections + cls(), sans rail |
| Formulaire pleine page éditeur (Modèle lettre) | ⚡ Rail = panneau de variables (déjà fait) |
| Dialog PrimeNG compact (Paramétrage entités) | ❌ Rail hors-sujet — dialog reste le bon choix |

---

## Ce qui NE change pas

- Les dialogs Paramétrage (Niveaux, Matières, Classes, etc.) restent des
  `p-dialog` compacts — le rail serait disproportionné pour 2-4 champs.
- Les écrans liste (`GescolTableComponent`) ne sont pas concernés.
- `ReactiveFormsModule` reste valide pour les dialogs (pattern F08 de
  référence conservé).

---

## Conséquences

- **`EleveForm`** : refondu en F09bis — signal-draft + rail + CSS dédié.
- **Futurs formulaires pleine page** (Personnel, peut-être Finances) :
  appliquer ce pattern dès la création, pas en rattrapage.
- **`reference/angular-cobimag-student-form`** : conservé comme référence
  visuelle et d'architecture. Ne pas supprimer.
