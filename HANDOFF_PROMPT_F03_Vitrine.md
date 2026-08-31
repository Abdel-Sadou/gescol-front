# HANDOFF — PROMPT_F03 : Vitrine publique

## Résumé d'exécution

Build final : **zéro erreur, zéro warning.** Artefacts dans `dist/poseidon-ng`.

---

## Fichiers créés / modifiés

| Fichier | Statut | Description |
|---|---|---|
| `src/app/core/services/vitrine.service.ts` | CRÉÉ | VitrineService + 4 interfaces DTO |
| `src/app/core/services/etablissement.service.ts` | MODIFIÉ | Ajout signaux `nom`, `nomCourt`, `logoUrl` |
| `src/app/pages/vitrine/vitrine.ts` | REMPLACÉ | Page complète 6 sections |

---

## Partie 1 — VitrineService

**Fichier :** `src/app/core/services/vitrine.service.ts`

Interfaces exportées :
- `ContenuVitrineResponse` — `{ id, cle, contenu:string|null, fichierUrl:string|null, dateCreation, dateModification }`
- `ActualiteResponse` — `{ id, titre, contenu, datePublication:string, imageUrl:string|null, publie, dateCreation, dateModification }`
- `MembreEquipePedagogiqueResponse` — `{ id, nom, fonction, photoUrl:string|null, ordre }`
- `PageResponse<T>` — `{ content, page, size, totalElements, totalPages }`

Méthodes :
- `getContenu(cle)` → `GET /api/vitrine/contenu/{cle}`
- `getActualites(page=0, size=6)` → `GET /api/vitrine/actualites?page=...&size=...`
- `getEquipePedagogique()` → `GET /api/vitrine/equipe-pedagogique`

---

## Partie 2 — EtablissementService (enrichi)

**Fichier :** `src/app/core/services/etablissement.service.ts`

Ajouts :
- `EtablissementDto` : champs `nomCourt:string|null` et `logoUrl:string|null` ajoutés
- Signaux publics en lecture : `readonly nom`, `readonly nomCourt`, `readonly logoUrl`
- Fallback si API indisponible : `nom='COBIMAG'`, `nomCourt=null`, `logoUrl=null`
- `load()` hydrate ces signaux avant le premier rendu (APP_INITIALIZER)

---

## Partie 3 — Page Vitrine (6 sections)

**Fichier :** `src/app/pages/vitrine/vitrine.ts`

### Architecture du composant
- Standalone, imports : `[RouterLink]` uniquement — zéro PrimeNG (ADR-011 respecté)
- Données dynamiques via `toSignal()` + `catchError(() => of(null))` — aucun crash si clé absente
- Réactivité : `EtablissementService.nom/nomCourt/logoUrl` (hydratés avant le rendu)

### Données chargées
| Signal | Endpoint | Clé |
|---|---|---|
| `contenuMotFondateur` | `GET /api/vitrine/contenu/MOT_FONDATEUR` | — |
| `contenuOrganigramme` | `GET /api/vitrine/contenu/ORGANIGRAMME` | — |
| `contenuHoraires` | `GET /api/vitrine/contenu/HORAIRES_COURS` | — |
| `contenuActivites` | `GET /api/vitrine/contenu/ACTIVITES_PERISCOLAIRES` | — |
| `contenuAdmissions` | `GET /api/vitrine/contenu/COMMENT_INSCRIRE` | — |
| `equipe` | `GET /api/vitrine/equipe-pedagogique` | — |
| `actualites` | `GET /api/vitrine/actualites?page=0&size=6` | — |

### Structure des 6 sections

| # | id | Fond | Données |
|---|---|---|---|
| 1 | `#accueil` | `#faf9f5` | Statique — devise de l'établissement |
| 2 | `#ecole` | `#FFFFFF` | `MOT_FONDATEUR`, `ORGANIGRAMME`, `getEquipePedagogique()` |
| 3 | `#formations` | `#faf9f5` | **Statique** (voir note ci-dessous) |
| 4 | `#vie-scolaire` | `#FFFFFF` | `HORAIRES_COURS`, `ACTIVITES_PERISCOLAIRES` |
| 5 | `#actualites` | `#faf9f5` | `getActualites(0,6)` |
| 6 | `#admissions` | `var(--color-primary-dark)` ← sombre | `COMMENT_INSCRIRE` + CTA → `/connexion` |

### Style (fidèle DEMO_DESIGN_SPEC.md)
- Fonts : `'Lora', serif` (H1, H2, H3, nom école) + `'Work Sans', sans-serif` (corps, nav, boutons)
- H1 hero : `font-size:clamp(34px,6vw,60px)`, `font-weight:700`, `color:#1c2a20`
- H2 sections : `font-size:clamp(24px,3.4vw,34px)`, `font-weight:600`, `margin:0 0 40px`
- H2 admissions : `color:#FFFFFF` sur fond `var(--color-primary-dark,#00532B)`
- Cards formations : `border-radius:2px` (cartes) + `border-radius:20px` (badges cycles)
- Couleurs via CSS custom properties uniquement : `var(--color-primary)`, `var(--color-accent)`, etc.
- Navigation sticky hauteur `64px`, `box-shadow:0 1px 0 rgba(0,0,0,0.08)`
- Logo circulaire `border-radius:50%` + fallback initiales si `logoUrl=null`

### Choix de conception signalés
- **Équipe pédagogique** : DEMO_DESIGN_SPEC.md ne détaille pas cette sous-section. Choix : grille auto-fill de cartes simples (photo circulaire ou avatar SVG, nom en Lora, fonction en Work Sans gris) — cohérent avec le style général de la page.
- **Mobile nav** : burger button qui bascule un menu déroulant stacked. Tailwind classes `hidden md:flex` / `flex md:hidden` pour le breakpoint.

---

## Note sur la section #formations

La section `#formations` est actuellement **statique** (contenu hardcodé). Deux sous-systèmes décrits : Francophone (SIL → BAC A/C/D) + Anglophone (Nursery → GCE A-Level).

**Ce qu'il faudrait pour la rendre dynamique :** un endpoint public `GET /api/vitrine/niveaux` (ou équivalent) renvoyant la liste des niveaux par sous-système. Cet endpoint n'existe pas actuellement — il serait dans le module Paramétrage, réservé aux utilisateurs authentifiés. **Ne pas créer ce endpoint depuis un prompt frontend — nécessite validation backend.**

---

## Tests manuels à effectuer

- [ ] Navigation par ancre : cliquer chaque lien nav → section correspondante en scroll fluide
- [ ] Burger mobile (< 768px) : s'ouvre / se ferme, liens fonctionnels
- [ ] Logo affiché si `logoUrl` renseigné, fallback initiales sinon
- [ ] Si une clé ContenuVitrine n'existe pas (404) : section affiche "bientôt disponible" sans crash
- [ ] Équipe pédagogique : grille vide si API retourne liste vide
- [ ] Actualités : grille vide avec message si aucun article
- [ ] CTA "Inscrire mon enfant" (section admissions) → `/connexion`
- [ ] Lien "Espace Parent" (nav + footer) → `/connexion`
- [ ] Vérification zéro composant PrimeNG dans le DOM (DevTools : aucun `p-*` dans la Vitrine)
- [ ] Couleurs suivent le branding dynamique si `couleurPrimaire` modifiée en base

---

## Ce qui N'a PAS été fait (hors périmètre)

- Endpoint public niveaux/cycles → voir note #formations ci-dessus
- Calendrier scolaire ou listes de manuels — absent de DEMO_DESIGN_SPEC.md
- Formulaire de contact — absent de la démo
- Pagination des actualités (page 2, 3…) — la page charge les 6 plus récentes

---

## Prochain prompt suggéré

**PROMPT_F04 — Espace Parent** : layout, tableau de bord parent (solde, quittances récentes), et page de consultation des quittances avec génération PDF A5 fidèle à DEMO_DESIGN_SPEC.md Écran 4.
