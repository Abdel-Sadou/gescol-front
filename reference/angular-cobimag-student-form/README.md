# COBIMAG — Écran « Nouvel élève » (direction 2b)

Angular 21 + PrimeNG. Saisie dense sectionnée à gauche, récapitulatif vivant
et contrôle des champs obligatoires à droite.

## Démarrer

```bash
npm install
npm start        # http://localhost:4200
```

## Ce que fait le rail de droite

Ce n'est pas de la décoration — il répond à trois besoins d'un secrétariat qui
enchaîne les inscriptions :

1. **Fiche en construction** — vérifier d'un regard qu'on saisit le bon élève à
   la vingtième saisie de la matinée.
2. **Compteur n / 7** — savoir s'il reste quelque chose à remplir sans scroller
   ni cliquer sur « Créer » pour découvrir l'erreur.
3. **Avertissement contextuel** — le premier champ obligatoire manquant passe en
   bordure orange dans le formulaire, et sa conséquence est énoncée dans le rail
   (« l'élève ne pourra pas être affecté à un emploi du temps »).

Les champs déjà renseignés passent en bordure verte (`.field-ok`), le champ
bloquant en bordure orange (`.field-blocking`).

## Les deux composants

| Composant | Rôle |
|---|---|
| `StudentFormPageComponent` | Orchestration : état du brouillon, calculs dérivés, sections de saisie |
| `StudentSummaryRailComponent` | Rail purement présentationnel — reçoit tout en `input()`, émet ses intentions en `output()` |

Le rail ne connaît pas le formulaire : il peut être réutilisé pour un écran
d'inscription en ligne ou de modification de fiche.

## Thème PrimeNG

`src/app/theme/cobimag-preset.ts` — préréglage `definePreset` basé sur Aura.
Ses jetons **pointent vers les variables CSS** de `src/styles.css` : changer
`--color-primary` repeint l'ensemble des composants PrimeNG, sans toucher au
préréglage.

Les surcharges de composants sont regroupées dans une **couche CSS nommée**
(`@layer cobimag`) déclarée dans l'ordre `theme, base, primeng, cobimag` — pas
de `::ng-deep` dispersé pour la thématisation ; le `::ng-deep` restant sert
uniquement à la mise en page interne des composants.

### Jetons principaux

| Variable | Valeur | Rôle |
|---|---|---|
| `--color-primary` | `#008B47` | actions primaires |
| `--color-primary-deep` | `#1F5C3D` | états sélectionnés, libellés forts |
| `--color-primary-dark` | `#173D2A` | fiche en construction, titres |
| `--color-accent` | `#E8722C` | points d'attention — 2 usages max par écran |
| `--color-canvas` | `#FBF8F2` | fond papier |
| `--color-text-muted` | `#736A5C` | secondaire, contraste ≥ 4.5:1 |
| `--tap-target` | `44px` | hauteur minimale de toute action |

## Choix de composants

- **`p-selectbutton`** pour Sexe (M/F) — un menu déroulant pour deux options
  est un mauvais choix.
- **Cartes de choix** pour le sous-système FR/EN, avec plage de classes et
  diplômes : c'est l'identité de l'école, pas un champ optionnel.
- **`p-select`** pour Classe, **filtré par sous-système** — les listes FR et EN
  sont disjointes, changer de sous-système réinitialise la classe.
- **`p-checkbox`** avec libellé *et* conséquence (« cocher uniquement si le
  certificat médical est au dossier »).
- **`p-datepicker`** au format `jj/mm/aaaa`, icône dans le champ.

## Responsive

**Container queries**, pas media queries : le composant réagit à sa propre
largeur, ce qui reste juste quand la sidebar de la coque se replie.

- `> 1080px` — deux colonnes, rail collant.
- `≤ 1080px` — le rail passe **au-dessus** en bandeau sur deux colonnes, les
  actions en ligne (elles restent atteignables sans remonter).
- `≤ 720px` — un champ par ligne, rail en pile, actions empilées.

`100dvh` et non `100vh`. `prefers-reduced-motion` respecté.

## À brancher

- `onSubmit()` — remplacer le `setTimeout` par l'appel API réel.
- `onSaveDraft()` — persistance du brouillon.
- Le bouton retour de l'en-tête — `routerLink` vers la liste des élèves.
- `src/app/data/student-form-data.ts` — classes et groupes sanguins depuis l'API.
- Intégrer la page dans la coque existante (`cob-app-shell`) : elle est conçue
  pour vivre dans une zone de contenu, pas en pleine page.
