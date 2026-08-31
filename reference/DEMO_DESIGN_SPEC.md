# DEMO_DESIGN_SPEC — COBIMAG-site-SPA.html

Extraction complète du design de la démo envoyée à Bertrand.
Source : `reference/COBIMAG-site-SPA.html` (bundle SPA, tout le contenu est en JS inline).

---

## 1. Palette de couleurs

| Hex | Usage |
|-----|-------|
| `#008B47` | Vert primaire COBIMAG — fond logo SVG, bordures top des cartes, badges "en règle", liens actifs, bouton CTA connexion |
| `#00532B` | Vert très foncé — fond de l'écran Connexion (background plein) |
| `#00733b` | Vert intermédiaire — dégradé radial écran connexion |
| `#0F1F16` | Quasi-noir verdâtre (réservé thème sombre éventuel) |
| `#1c2a20` | Presque noir — texte principal, titres (h1, h2, h3), valeurs monétaires |
| `#5F6161` | Gris — texte secondaire, labels, sous-titres, lien "Déconnexion" |
| `#E8722C` | Orange accent — boutons d'action principaux ("+ Nouvelle inscription", CTAs), couleur d'alerte solde |
| `#c85f1f` | Orange foncé — état hover sur `#E8722C` |
| `#8a4416` | Brun-orange — texte dans les alertes de paiement (fond orange pâle) |
| `#B7B8B7` | Gris clair — bordures légères, séparateurs discrets |
| `#BFE3CD` | Vert très pâle — fond badge filière "en règle" |
| `#C9CBC9` | Gris moyen — bordures des inputs de formulaire |
| `#E3E4E2` | Gris très clair |
| `#E7E7E5` | Gris clair — séparateurs, bordures de sections, border-bottom header |
| `#EAF5EE` | Vert très pâle — fond badge "Secrétariat" (back-office) |
| `#EDEEEC` | Gris pâle légèrement verdâtre — fond avatars placeholder |
| `#EEEEEC` | Gris pâle — variante fond |
| `#F0C39E` | Orange très pâle — bordure de la bannière alerte paiement |
| `#F0F0EE` | Gris très clair — fond hover sur les suggestions de recherche |
| `#F7F8F6` | Fond général des écrans authentifiés (gris légèrement verdâtre) |
| `#faf9f5` | Fond body du SPA au chargement (beige très clair) |
| `#FDECE1` | Orange très pâle — fond bannière alerte paiement restant |
| `#FFFFFF` | Blanc pur — cartes, modals, formulaires, header |

---

## 2. Typographie

| Police | Usage |
|--------|-------|
| `'Lora', serif` | Titres et noms propres : h1 (parentName), h2 (nom enfant), h3 (titres de cartes), nom de l'école dans le header, titres des sections landing |
| `'Work Sans', sans-serif` | Corps de texte intégral, labels, inputs, boutons, navigation, paragraphes |
| `Georgia, serif` | Uniquement le monogramme "CB" dans le logo SVG |
| `monospace` | Codes matricule, numéro de quittance, code-barre |

Tailles clés (responsive avec `clamp`) :
- Hero H1 landing : `clamp(34px, 6vw, 60px)`
- H2 sections landing : `clamp(24px, 3.4vw, 34px)`
- H1 espace parent (nom parent) : `clamp(20px, 3vw, 26px)`
- Nom école header : `15px` (Lora, 700)
- Label filière header : `10.5px` italique
- Corps courant : `13px–14px`
- Labels secondaires : `12px–12.5px`
- Micro-labels (quittance) : `5.5px–8px`

---

## 3. Écrans présents

### Écran 1 — Landing (site public COBIMAG)

**Contrôle** : `{{screenIsLanding}}`

**6 sections** (navigation interne par ancres) :
1. `#accueil` — Hero avec H1 "Discipline. Rigueur. Méthode.", fond neutre
2. `#ecole` — "Notre histoire, nos repères" + "Une même école, deux parcours d'excellence"
3. `#formations` — "Nos cycles, dans les deux systèmes" (tableau ou cartes selon `{{cyclesLayoutIsCards/Table}}`)
4. `#vie-scolaire` — "Le quotidien de nos élèves" + "La vie du collège"
5. `#actualites` — Liste d'articles (item.title, item.date, item.tag, item.excerpt)
6. `#admissions` — "Comment inscrire votre enfant" (fond sombre avec H2 blanc `#FFFFFF`)

**Layout** :
- Navigation sticky en haut (desktop/mobile), liens `{{navLinks}}` (label + href)
- Logo circulaire (`border-radius:50%`) + nom "Lora" dans header
- Max-width container pour le contenu

**Valeurs de style** :
- Cards cycles : `border-radius:4px` ou `border-radius:20px`
- Fond page : `#faf9f5` (beige clair)

---

### Écran 2 — Connexion / Inscription

**Contrôle** : `{{screenIsConnexion}}`

**Structure** :
```
DIV plein écran (min-height:100vh)
├── Fond #00532B (couche 1)
├── Pattern diagonal repeating-linear-gradient rgba(255,255,255,0.07), blur(6px) (couche 2)
├── Dégradé radial circle at 50% 30%, rgba(0,139,71,0.35) → rgba(0,40,20,0.88) (couche 3)
└── Carte blanche centrée z-index:2
    ├── Logo circulaire 56×56 + "Espace Parent" (Lora 700 15px) + sous-titre italique
    ├── Onglets "Se connecter" / "Créer un compte"
    │   └── border-bottom actif : 2px solid (couleur dynamique {{loginTabBorder}})
    ├── [sc-if isLogin] Formulaire connexion
    │   ├── Input "Nom d'utilisateur" (border:1.5px solid #C9CBC9, radius:3px, padding:12px 14px)
    │   ├── Input "Mot de passe" + toggle visibilité (SVG œil)
    │   ├── Lien "Mot de passe oublié ?"
    │   └── Bouton CTA "Se connecter" (vert #008B47, plein)
    └── [sc-if isSignup] Formulaire inscription
        ├── Inputs nom/email/mot de passe + indicateur de force ({{strengthPct}}, {{strengthColor}}, {{strengthLabel}})
        └── Bouton CTA "Créer un compte"
```

**Valeurs de style** :
- Carte : `max-width:420px`, `border-radius:6px`, `padding:36px 32px`, `box-shadow:0 20px 50px rgba(0,0,0,0.35)`, fond `#FFFFFF`
- Inputs : `border:1.5px solid #C9CBC9`, `border-radius:3px`, `font-size:14px`, `padding:12px 14px`
- Lien secondaire : `font-size:12.5px`, `color:#5F6161`

---

### Écran 3 — Tableau de bord parent (Espace Parent)

**Contrôle** : `{{screenIsEspaceParent}}`

**Structure** :
```
DIV fond #F7F8F6
├── HEADER sticky (z-index:50, bg:#FFFFFF, box-shadow:0 1px 0 rgba(0,0,0,0.08))
│   ├── Logo + "Espace Parent" (Lora 700 15px, couleur #1c2a20)
│   ├── Sous-titre "COBIMAG – Marie Gisèle Bilingual College" (italique, #5F6161)
│   ├── [sc-if showNewEnrollmentButton] Bouton "+ Nouvelle inscription" (#E8722C, radius:2px)
│   └── Lien "Déconnexion" (#5F6161, 13px)
└── MAIN (max-width:1180px, margin:0 auto, padding:24px 20px 64px)
    ├── "Bonjour," (13.5px, #5F6161) + H1 {{parentName}} (Lora, clamp(20px,3vw,26px))
    ├── [sc-if showMultipleChildren] Label "MES ENFANTS" (orange, uppercase, letter-spacing:1.3px)
    ├── Sélecteur d'enfants
    │   ├── Mode cards (childSelectorIsCards) : cartes 180px, radius:4px, border coloré
    │   │   └── Avatar placeholder + nom (Lora) + classe + badge filière (radius:20px)
    │   └── Mode onglets (childSelectorIsTabs) : border-bottom:3px solid couleur active
    ├── H2 {{selectedChild.name}} + classe + badge filière
    ├── [sc-if showPaymentAlert] Bannière alerte paiement
    │   └── Fond #FDECE1, border:#F0C39E, radius:4px, padding:14px 18px
    │       Texte brun #8a4416 + lien orange "Voir les quittances →"
    ├── Grille de cartes statistiques (auto-fit, minmax(240px,1fr), gap:20px)
    │   └── Cartes : bg:#FFFFFF, border-top:3px solid #008B47, radius:2px,
    │              padding:22px, box-shadow:0 1px 3px rgba(0,0,0,0.05)
    │       ├── "Scolarité" : totalFmt, verseFmt, soldeFmt
    │       ├── "Résultats" : selectedChild.resultats.mention / value / metricLabel
    │       └── "Discipline" : selectedChild.discipline.incidents
    └── Historique des paiements (tableau) : h.date, h.mode, h.montantFmt, h.resteFmt
```

**Valeurs de style** :
- Badge filière (track) : `border-radius:20px`, `padding:3px 9px` (petit) / `4px 10px` (normal), fond/couleur/bordure dynamiques
- Séparateurs horizontaux dans cartes : `height:1px`, fond gris
- Fond général : `#F7F8F6`

---

### Écran 4 — Quittance de paiement

**Contrôle** : `{{screenIsQuittance}}`

**Structure** : Document A5 portrait (`148mm × 210mm`)

```
Lien "← Retour à l'accueil" fixe (no-print, radius:20px, border:#E7E7E5)
doc-page (A5)
└── section.page (padding:20px 24px, flex-column, gap:8px, font 'Work Sans', color:#1c2a20, bg:#FFFFFF)
    ├── En-tête (border:1px solid #1c2a20, radius:2px, padding:10px 12px)
    │   ├── Watermark logo (opacity:0.06, rotate(-10deg), 130×130px)
    │   ├── Logo 26×26 + "COLLÈGE BILINGUE MARIE GISÈLE" (Lora 700, 8px)
    │   │   + sous-titre 6px + adresse 5.5px (#5F6161)
    │   └── Code-barre (100×16px, repeating-linear-gradient vertical #1c2a20)
    ├── Bandeau titre (border-top/bottom:1.5px solid #008B47, text-align:center)
    │   └── "QUITTANCE DE PAIEMENT DE SCOLARITÉ" (Lora 700, 10.5px)
    ├── Numéro + date (font-size:6.8px, monospace pour N°)
    ├── Tableau infos élève (border:#C9CBC9)
    ├── Tableau paiements (date, montant, reste, mode)
    └── Section signatures
```

**Valeurs de style spécifiques à la quittance** :
- Micro-typographie : 5.5px–10.5px (format A5 contraint)
- Toutes les bordures importantes : `#1c2a20` (quasi-noir) ou `#008B47` (vert)
- `border-radius:2px` pour tous les blocs (carré, sobre)

---

### Écran 5 — Fiche élève (Back-office)

**Contrôle** : `{{screenIsFiche}}`

**Structure** :
```
DIV fond #F7F8F6
├── HEADER (bg:#FFFFFF, border-bottom:1px solid #E7E7E5)
│   ├── Logo + "Back-office COBIMAG" (Lora 700 15px) + sous-titre "Recherche & fiche élève"
│   ├── Lien "← Retour à l'accueil" (#5F6161)
│   ├── Nom agent "Mme Solange Ateba" (13px 600 #1c2a20)
│   └── Badge "Secrétariat" (bg:#EAF5EE, color:#008B47, radius:20px, padding:4px 10px)
└── MAIN (max-width:1040px, margin:0 auto, padding:24px 20px 64px)
    ├── Input recherche (width:100%, border:1.5px solid #C9CBC9, radius:3px, padding:14px 16px)
    ├── [sc-if showSuggestions] Dropdown suggestions
    │   └── bg:#FFFFFF, border:#E7E7E5, radius:3px, box-shadow:0 4px 14px rgba(0,0,0,0.1)
    │       Items : border-bottom:#F0F0EE, padding:10px 14px, hover bg:#F7F8F6
    │       └── Avatar 34×34 + nom (s.name) + matricule (s.matricule) + classe (s.classe)
    ├── [sc-if hasNoSelection] État vide (message ou illustration)
    └── [sc-if hasSelected] Fiche élève sélectionné
        ├── Nom (Lora 700, 20px) + classes + badge filière
        ├── Infos personnelles : selected.* (nom, prenom, naissance, sexe, classe, matricule,
        │   groupeSanguin, mere, pere, contact, quartier)
        ├── Badge solde : soldeBg/soldeColor/soldeBorder/soldeFmt
        └── Badges : redouble (redoubleLabel/Bg/Color), sport (sportLabel/Bg/Color)
```

---

## 4. Valeurs de style réutilisables (référence transversale)

| Propriété | Valeur | Contexte |
|-----------|--------|----------|
| Border-radius cartes | `2px` | Cartes statistiques, quittance, inputs (sobre, institutionnel) |
| Border-radius badges | `20px` | Filières, statuts, rôles |
| Border-radius modal connexion | `6px` | Carte login |
| Border-radius bouton retour | `20px` | Lien "← Retour" pill |
| Border-radius avatars | `50%` | Logos et photos de profil |
| Box-shadow cartes | `0 1px 3px rgba(0,0,0,0.05)` | Cartes dashboard (très discret) |
| Box-shadow modal | `0 20px 50px rgba(0,0,0,0.35)` | Carte connexion (prononcé) |
| Box-shadow header | `0 1px 0 rgba(0,0,0,0.08)` | Sticky header (trait fin) |
| Box-shadow dropdown | `0 4px 14px rgba(0,0,0,0.1)` | Suggestions de recherche |
| Border-top carte | `3px solid #008B47` | Cartes dashboard (accent vert) |
| Border input | `1.5px solid #C9CBC9` | Tous les inputs |
| Padding cartes | `22px` | Cartes dashboard standard |
| Padding inputs | `12px 14px` (sm) / `14px 16px` (lg) | Formulaires |
| Gap grille cartes | `20px` | Grid auto-fit dashboard |
| Max-width contenu | `1180px` (parent) / `1040px` (back-office) / `420px` (modal) | Conteneurs principaux |

---

## 5. Syntaxe de template propriétaire

| Syntaxe | Équivalent | Description |
|---------|-----------|-------------|
| `<sc-if value="{{bool}}">` | `*ngIf` Angular | Affiche le bloc si `bool` est truthy |
| `<sc-for list="{{array}}" as="item">` | `*ngFor` | Boucle sur `array`, expose chaque élément comme `item` |
| `sc-camel-on-click="{{handler}}"` | `(click)="handler()"` | Bind un handler de clic |
| `sc-camel-on-change="{{handler}}"` | `(change)="handler()"` | Bind un handler sur changement d'input |
| `sc-camel-on-focus="{{handler}}"` | `(focus)="handler()"` | Bind un handler sur focus |
| `sc-camel-view-box="0 0 w h"` | `viewBox="0 0 w h"` | Attribut SVG viewBox (camelCase → kebab-case) |
| `hint-placeholder-val="{{val}}"` | N/A | Valeur d'exemple visible en prévisualisation statique |
| `hint-placeholder-count="n"` | N/A | Nombre d'items fictifs affichés pour `sc-for` en mode preview |
| `style-hover="..."` | `:hover` CSS | Styles CSS appliqués au survol |
| `{{variable}}` | `{{ variable }}` Angular | Interpolation — remplacé par la valeur réelle de l'API |

---

## 6. Variables dynamiques → données API attendues

| Template var | Type de donnée API | Description |
|---|---|---|
| `{{parentName}}` | `string` | Nom complet du parent connecté |
| `{{children}}` | `Child[]` | Liste des enfants du compte parent |
| `{{child.name}}` / `{{child.classe}}` | `string` | Nom et classe de l'enfant |
| `{{child.trackLabel}}` | `string` | Filière : "Anglophone" ou "Francophone" |
| `{{child.cardBg}}` / `{{child.cardBorder}}` | CSS string | Styling dynamique de la carte enfant (sélectionné vs non) |
| `{{child.trackBg}}` / `{{child.trackColor}}` / `{{child.trackBorder}}` | CSS string | Styling dynamique du badge filière |
| `{{selectedChild.name}}` | `string` | Enfant actuellement affiché |
| `{{selectedChild.resultats.mention}}` | `string` | Mention scolaire ("Très bien", "Bien"…) |
| `{{selectedChild.resultats.value}}` | `number/string` | Valeur numérique (moyenne, rang…) |
| `{{selectedChild.resultats.metricLabel}}` | `string` | Label de la métrique ("Moyenne générale") |
| `{{selectedChild.discipline.incidents}}` | `number/string` | Nombre d'incidents disciplinaires |
| `{{totalFmt}}` | `string` | Scolarité totale due formatée (ex: "450 000 FCFA") |
| `{{verseFmt}}` | `string` | Montant versé formaté |
| `{{soldeFmt}}` | `string` | Solde restant formaté |
| `{{soldeLabel}}` / `{{soldeColor}}` / `{{soldeBg}}` / `{{soldeBorder}}` | `string` | Affichage coloré du statut de paiement |
| `{{historique}}` | `Paiement[]` | Tableau des paiements (h.date, h.mode, h.montantFmt, h.resteFmt) |
| `{{showPaymentAlert}}` | `boolean` | Affiche la bannière d'alerte si solde > 0 |
| `{{showMultipleChildren}}` | `boolean` | Cache le sélecteur enfants si enfant unique |
| `{{parentName}}` | `string` | Nom parent, affiché en H1 espace parent |
| `{{query}}` | `string` | Valeur de l'input de recherche (back-office) |
| `{{suggestions}}` | `Eleve[]` | Résultats de recherche : s.name, s.matricule, s.classe |
| `{{selected.*}}` | `Eleve` | Fiche complète : nom, prenom, naissance, sexe, classe, matricule, groupeSanguin, mere, pere, contact, quartier |
| `{{navLinks}}` | `NavLink[]` | Liens de navigation landing : link.label, link.href, link.onClick |
| `{{cycles}}` | `Cycle[]` | Cycles scolaires : cycle.fr, cycle.en, cycle.frClasses, cycle.enClasses, cycle.desc |
| `{{news}}` | `Article[]` | Actualités : item.title, item.date, item.tag, item.excerpt |
| `{{steps}}` | `Step[]` | Étapes d'admission : step.n, step.title, step.text |
| `{{stats}}` | `Stat[]` | Statistiques de l'établissement : stat.label, stat.value |
| `{{systems}}` | `System[]` | Systèmes éducatifs : system.title, system.desc, system.tags, system.badge, system.badgeBg… |
