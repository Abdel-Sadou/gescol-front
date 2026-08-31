# COBIMAG — version Angular

Portage Angular (v18, composants standalone) de la maquette du Collège Bilingue Marie Gisèle.

## Démarrer

```bash
npm install
npm start        # http://localhost:4200
```

## Build de production

```bash
npm run build    # sortie dans dist/cobimag
```

## Écrans et routes

| Route | Composant | Écran |
|---|---|---|
| `/` | `LandingComponent` | Site vitrine |
| `/connexion` | `LoginComponent` | Connexion / création de compte |
| `/espace-parent` | `ParentSpaceComponent` | Espace Parent |
| `/quittance` | `ReceiptComponent` | Quittance A5 imprimable |
| `/secretariat` | `StudentRecordComponent` | Recherche & fiche élève (back-office) |

## Organisation

- `src/app/shared/cobimag-base.ts` — navigation entre écrans + points de rupture responsive partagés.
- `src/app/data/school-data.ts` — jeu de données de démonstration (élèves, cycles, actualités…). À remplacer par vos appels API.
- `src/app/pages/*` — un composant standalone par écran, template HTML séparé.
- `src/styles.css` — reset, styles de liens, variables de marque et règles `:hover`.

## Charte graphique

| Rôle | Couleur |
|---|---|
| Vert principal | `#008B47` |
| Gris texte | `#5F6161` |
| Orange accent | `#E8722C` |

Typographies : **Lora** (titres) et **Work Sans** (textes), chargées depuis Google Fonts dans `src/index.html`.

## Points d'attention

- La quittance utilise le web component `<doc-page>` (`src/assets/doc-page.js`), chargé dans `index.html` ; le composant déclare `CUSTOM_ELEMENTS_SCHEMA`.
- Le QR code et le code-barre sont des **placeholders visuels**. Pour de vrais codes, brancher une librairie (`angular-qrcode`, `jsbarcode`) sur les données élève.
- Les images sont des zones de réservation décrites par leur contenu ; remplacer par les photos réelles de l'établissement.
- Les options d'affichage (ordre des sous-systèmes, densité, style du sélecteur d'enfant…) sont de simples propriétés publiques sur les composants.
