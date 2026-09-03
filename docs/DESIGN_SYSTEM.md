# DESIGN_SYSTEM — App interne GESCOL ("Institutionnel chaud")

Référence permanente pour tout écran de l'Application interne (Poseidon/
PrimeNG). À consulter systématiquement pour F09 et tous les prompts
suivants — ne pas re-décrire ces règles dans chaque prompt, y référer.

Ne concerne PAS Vitrine/Espace Parent (CSS propre, ADR-011, déjà fixé).

---

## 1. Jetons de couleur (fusionnés avec _cobimag.scss existant)

```css
:root {
  --color-primary: #008B47;
  --color-primary-dark: #173D2A;
  --color-primary-deep: #1F5C3D;
  --color-primary-soft: #EAF3ED;
  --color-accent: #E8722C;
  --color-accent-deep: #8A4416;
  --color-accent-soft: #FFF6EE;
  --color-danger: #C0392B;
  --color-canvas: #FBF8F2;
  --color-surface: #FFFDF8;
  --color-surface-sunken: #F4EFE4;
  --color-text: #173D2A;
  --color-text-body: #2E3B32;
  --color-text-muted: #736A5C;
  --color-border: #E9E1D2;
  --color-border-field: #D8CFBC;
  --font-serif: 'Lora', Georgia, serif;
  --font-sans: 'Work Sans', system-ui, sans-serif;
  --radius-sm: 7px; --radius-md: 12px; --radius-lg: 14px;
  --shadow-card: 0 2px 10px -4px rgba(23,61,42,0.12);
}
```

Aucune valeur hexadécimale dans un composant — toujours via ces variables.

## 2. Typographie

Lora (serif) : titres de page, titres de carte, chiffres clés uniquement.
Work Sans : tout le reste. Jamais de serif dans un champ ou un libellé.

## 3. L'orange est un budget, pas une couleur

Maximum 2 usages d'accent orange par écran — réservé à ce qui exige une
action (élément de menu actif, alerte, champ bloquant). Ne pas disperser.

## 4. Le bilinguisme FR/EN est visible partout où il s'applique

Pastille FR verte pleine / pastille EN cerclée de vert — partout où un
élève, une classe ou une statistique porte un sous-système. Jamais réduit
à un sélecteur de langue en coin d'écran quand c'est une donnée métier
(différent du sélecteur de langue d'interface, qui lui reste dans la
coque).

## 5. Règles non négociables

- **Contraste** : 4.5:1 minimum. Libellés en `--color-text`, 12px/600,
  jamais gris pâle. Placeholders montrent une vraie valeur d'exemple
  ("NKOA", "+237 6 99 12 34 56"), jamais une répétition du libellé.
- **Aucun bouton fantôme** : "Annuler" est un bouton bordé lisible. Toute
  cible cliquable ≥ 44px de haut.
- **Largeur de champ = longueur du contenu attendu** : `flex: N 1 Xpx`
  plutôt qu'une grille rigide uniforme.
- **Regroupement obligatoire au-delà de 6 champs** : sections numérotées,
  titre serif, phrase de contexte si utile. Un formulaire de 13 champs à
  plat est un échec de design (cf. constat sur le formulaire Élève).
- **Les cases à cocher énoncent leur conséquence** : pas "Apte au sport"
  seul, mais l'intitulé complet + la condition de cochage.
- **Barre d'action ancrée** en bas de carte, fond légèrement teinté, info
  contextuelle à gauche ("Le matricule est attribué automatiquement"),
  Annuler + action primaire à droite.
- **Pas de data slop** : aucun chiffre/badge/graphique sans valeur de
  décision. Une sparkline sans axe ni échelle : la rendre lisible ou la
  supprimer.
- **4 états obligatoires par écran** : vide, chargement (squelettes, pas
  de spinner centré), erreur, succès.

## 6. Mapping composants PrimeNG (ne pas remplacer par du HTML maison)

| Cas d'usage | Composant |
|---|---|
| Cartes | `p-card` |
| Pastilles/badges | `p-badge` / `p-tag` |
| Jauges | `p-progressbar` |
| Choix binaire court (Sexe, sous-système) | `p-selectbutton` — PAS `p-dropdown` |
| Date | `p-datepicker` |
| Liste déroulante (3+ options) | `p-select` |
| Texte | `p-inputtext` |
| Case à cocher | `p-checkbox` |
| Tableau | `p-table` + `p-paginator` |
| Confirmation | `p-toast` |
| Suppression | `p-confirmdialog` |
| Icônes | PrimeIcons, contour uniquement |

Surcharges de thème dans une feuille globale — jamais de `::ng-deep`
dispersé dans les composants.

## 7. Contraintes Angular (rappel, déjà la norme du projet)

Standalone, `ChangeDetectionStrategy.OnPush`, `@if`/`@for` (jamais
`*ngIf`/`*ngFor`), signaux pour l'état local, `input()`/`output()`
signal-based. Coque (sidebar/topbar) toujours séparée du contenu d'écran
— jamais fusionnées dans un même composant.

## 8. Responsive

Container queries plutôt que media queries pour un composant vivant dans
une zone à largeur variable. `100dvh`, jamais `100vh`. Sidebar en tiroir
avec overlay sur mobile (déjà le comportement établi en F08bis) — jamais
un rail permanent qui vole de la place sur petit écran.

## 9. Méthode (pour les redesigns interactifs, écran par écran)

Pour un prompt de redesign d'un écran EXISTANT (pas une construction
initiale comme F09) : lister d'abord les défauts de l'écran actuel,
annoncer la structure envisagée et attendre validation avant de coder.
Cette étape suppose une session interactive (l'utilisateur reste présent
pendant l'exécution) — ne s'applique pas aux prompts de construction en
un seul bloc comme F09.
