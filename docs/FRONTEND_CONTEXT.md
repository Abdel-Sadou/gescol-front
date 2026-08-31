# FRONTEND_CONTEXT — GESCOL (Frontend Angular)

Document de référence pour les sessions Claude Code sur le frontend.
À fournir en contexte au début de chaque prompt frontend (reference-first),
au même titre que MASTER_CONTEXT.md côté backend (dont il dépend pour
tout ce qui touche à l'API, aux rôles et aux règles métier).

---

## 1. Stack technique

- **Framework** : Angular 21 (standalone components — pas de NgModules)
- **Composants UI** : PrimeNG 21
- **Base du projet** : template Poseidon (PrimeTek), déjà installé et
  fonctionnel en local
- **Backend** : API REST du projet gescol-backend (voir MASTER_CONTEXT.md
  côté backend pour la carte API complète, §8)
- **Projet unique** : une seule application Angular pour les trois zones
  (vitrine publique, espace parent, application interne) — pas de projets
  séparés

## 2. Architecture à trois zones

| Zone | Layout | Système de style | Authentification |
|---|---|---|---|
| **Vitrine publique** | Layout custom (pas Poseidon) | CSS propre, fidèle à la démo Claude Design | Aucune — accès public |
| **Espace Parent** | Layout custom, simple, mobile-first — PAS le layout admin Poseidon | CSS propre, **exactement le même CSS que la démo déjà envoyée à Bertrand** — pas une réinterprétation via PrimeNG | JWT, rôle PARENT |
| **Application interne** | Layout Poseidon standard (menu latéral, thème) | PrimeNG (composants + preset, §3bis) | JWT, tous rôles sauf PARENT |

Référence de design pour Vitrine ET Espace Parent : la maquette Claude
Design déjà présentée à l'établissement (fichier `COBIMAG-site-SPA.html`,
HTML/CSS avec un peu de logique React sous le capot — non réutilisable tel
quel, mais la structure et les styles exacts (couleurs, polices `Lora`/
`Work Sans`, espacements) doivent être reproduits fidèlement, pas
réinterprétés). Couleurs de marque : vert `#008B47`, gris `#5F6161`, accent
orange `#E8722C`.

**Important** : Espace Parent n'utilise PAS les composants PrimeNG — même
les éléments interactifs (connexion, mot de passe) sont construits en HTML
natif stylé avec le CSS extrait de la démo, pour garantir un rendu
identique à ce qui a déjà été validé, plutôt que de risquer un écart visuel
en passant par la réinterprétation d'un composant PrimeNG.

## 3. Branding — Vitrine et Espace Parent (CSS brut)

Au démarrage de l'app (`APP_INITIALIZER` ou resolver de route), appel à
`GET /api/etablissement/courant` (public — l'endpoint est déjà `permitAll()`
en lecture côté backend), puis injection des couleurs en CSS custom
properties, consommées par les styles des deux zones :

```typescript
document.documentElement.style.setProperty('--color-primary', etablissement.couleurPrimaire);
document.documentElement.style.setProperty('--color-secondary', etablissement.couleurSecondaire);
document.documentElement.style.setProperty('--color-accent', etablissement.couleurAccent);
```

Valeurs de secours (si l'appel échoue) : vert `#008B47`, gris `#5F6161`,
accent orange `#E8722C` — les couleurs déjà validées dans la démo.

## 3bis. Branding — Application interne uniquement (preset PrimeNG)

Même source de données (`GET /api/etablissement/courant`), appliquée cette
fois via le système de design tokens de PrimeNG, uniquement pour la zone
Application interne :

```typescript
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura'; // preset de base déjà utilisé par Poseidon

const CobimagPreset = definePreset(Aura, {
  semantic: {
    primary: { /* dérivé de etablissement.couleurPrimaire, remplace la palette 'blue' actuelle */ },
  },
});
```

**Note confirmée par exploration (PROMPT_F00)** : le package réel est
`@primeuix/themes` (pas `@primeng/themes`). Le preset actuel de Poseidon
utilise `Aura` avec une palette bleue — à remplacer par le vert COBIMAG.

Ce preset est défini une seule fois, au bootstrap de l'app, et ne s'applique
qu'à la zone Application interne — jamais à la Vitrine ni à l'Espace Parent,
qui n'utilisent pas PrimeNG.

**Note confirmée par exploration (PROMPT_F00)** : Tailwind CSS 4.1.11 est
déjà installé et utilisé par Poseidon lui-même (ses pages internes s'en
servent, ex. classes utilitaires `py-36`, `max-w-184`). "CSS propre" pour
Vitrine et Espace Parent signifie donc concrètement : classes utilitaires
Tailwind + variables CSS personnalisées pour les couleurs de marque — pas
besoin d'écrire des feuilles de style à la main depuis zéro, Tailwind est
déjà disponible sans coût supplémentaire.

**Layouts réels disponibles dans le projet (PROMPT_F00)** :
- `AppLayout` (sidebar + topbar) — correspond exactement à notre zone
  Application interne, à utiliser tel quel
- `LandingLayout` — contient déjà les pages marketing et auth par défaut du
  template (style glassmorphism bleu, OAuth Google/Apple) ; diverge du
  design de notre démo validée — probablement à ne PAS réutiliser tel quel
  pour Vitrine/Parent, une décision à confirmer explicitement dans
  PROMPT_F01 plutôt qu'à supposer
- `AuthLayout` — actuellement vide, candidat naturel pour un layout minimal
  Espace Parent (pas de menu, pas de chrome Poseidon)

**Point de cohérence à ne jamais casser** : les trois zones tirent leur
couleur de la même lecture de `Etablissement` — jamais de valeur différente
selon la zone, même si le mécanisme d'application diffère (CSS brut vs
preset PrimeNG).

## 4. Authentification et gestion du JWT

- Stockage du token : à trancher en PROMPT_F01 (localStorage le plus simple
  pour une SPA, avec les limites de sécurité connues — signale si tu
  préfères une autre approche et pourquoi, avant de l'imposer)
- `HttpInterceptor` : injecte le token sur chaque requête vers l'API,
  gère le refresh token (`POST /api/auth/refresh`) de façon transparente
- Route guards Angular par rôle, alignés sur `RoleUtilisateur`
  (MASTER_CONTEXT backend §5) : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`,
  `ENSEIGNANT`, `PARENT`, `COMMUNICATION`
- Redirection post-login différente selon le rôle : `PARENT` → Espace
  Parent (layout simple), tout autre rôle → Application interne (layout
  Poseidon)

## 5. Menu de l'application interne (Poseidon)

Le menu latéral (`src/app/layout/components/app.menu.ts`) doit être
**filtré dynamiquement par rôle**, pas statique — un `SECRETARIAT` ne doit
pas voir les entrées de menu Paie/Barèmes, un `ENSEIGNANT` ne voit que
Emploi du temps/Notes/Discipline/Cahier de texte, etc. Construis la
structure de menu en te basant sur la matrice de permissions MASTER_CONTEXT
backend §7 (P1-P6).

## 6. Correspondance modules backend → écrans frontend

| Module backend | Écrans frontend prévus | Zone |
|---|---|---|
| Vitrine | Accueil, actualités, équipe, contact | Publique |
| Auth | Connexion, inscription parent | Publique + Parent |
| Élève | Liste/recherche, fiche, création/édition | Interne |
| Paramétrage | Classes, taux, quotas, matières (écrans de config) | Interne |
| Personnel, EmploiDuTemps | Liste personnel, planning | Interne |
| Résultats | Saisie notes, validation, bulletins | Interne |
| Discipline | Sanctions, bons de sortie | Interne |
| Finances | Versements, quittances, moratoires, états | Interne |
| Paie | Barèmes, bulletins, ordres de virement | Interne |
| Parent | Compte, inscription 5 étapes, suivi (solde/notes/discipline) | Parent |
| Cahier de texte | Saisie (avec queue offline), consultation | Interne (enseignant) |

## 7. Contraintes de non-régression

- Jamais de couleur/texte de marque codé en dur — toujours via le
  branding dynamique (§3)
- Le layout Poseidon (menu, thème) reste réservé à l'application interne —
  ne pas l'utiliser pour Vitrine ou Espace Parent
- Toute règle métier déjà appliquée côté backend (validations, permissions)
  n'est PAS dupliquée en dur côté frontend au-delà du confort UX (afficher/
  masquer un bouton) — le backend reste la source de vérité, le frontend
  ne fait pas de contrôle d'autorisation qui remplacerait le backend
