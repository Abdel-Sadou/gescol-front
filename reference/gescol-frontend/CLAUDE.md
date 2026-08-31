# GESCOL Frontend — Instructions permanentes

Avant toute tâche, lis et respecte strictement, dans cet ordre :

1. `docs/FRONTEND_CONTEXT.md` — stack, architecture à trois zones,
   stratégie de style (CSS propre vs PrimeNG), branding.
2. `docs/backend-reference/` — copie de référence du backend, à consulter
   systématiquement :
   - `MASTER_CONTEXT.md` — carte API, rôles (P1-P6), règles métier (R1-R21)
   - `API_CONTRACT.md` — **détail exact de chaque endpoint** (noms de
     champs JSON réels, types, contraintes de validation, codes d'erreur).
     À consulter systématiquement avant d'écrire un appel HTTP — ne jamais
     supposer un nom de champ (ex. `motDePasse`, pas `password`)
   - `CONVENTIONS.md` — format exact des réponses API (pagination, erreurs)
     et des DTO, indispensable pour bien consommer l'API sans deviner
   - `adr/*.md` — décisions d'architecture backend. Toutes ne concernent
     pas le frontend, mais certaines sont directement structurantes :
     **ADR-006** (l'établissement est résolu depuis le JWT, jamais envoyé
     par le frontend), **ADR-007** (le solde est calculé à la volée, ne
     jamais le mettre en cache côté client comme une valeur stable),
     **ADR-010** (le cahier de texte utilise un id généré CÔTÉ CLIENT —
     c'est une responsabilité du frontend, pas juste une note backend)
   - `ROADMAP.md` — état d'avancement du backend, utile pour savoir si un
     module qu'on veut consommer est bien terminé
   **Cette copie n'est pas synchronisée automatiquement** — si l'API
   évolue côté backend, elle doit être remise à jour manuellement ici
   (relancer PROMPT_17 côté backend si besoin, puis recopier le fichier).
3. Tous les fichiers `docs/adr/*.md` (dossier frontend, pas
   `backend-reference/adr/`) — décisions d'architecture propres au
   frontend. **Numérotation partagée avec le backend** : le frontend
   continue la même séquence (ADR-011 et suivants) — avant de créer un
   nouvel ADR, vérifier le dernier numéro utilisé entre les deux dossiers
   ADR (frontend ET `backend-reference/adr/`), qui peut être en retard par
   rapport au dépôt backend réel. En cas de doute, demander plutôt que de
   risquer une collision de numéro.
4. `docs/ROADMAP.md` (frontend) — état d'avancement des prompts frontend.

## Règles de conduite

- Ne remets jamais en question une décision actée dans un ADR sans le
  signaler explicitement d'abord. Ne dévie pas silencieusement.
- Si une décision d'architecture nouvelle émerge pendant une tâche,
  signale-le clairement à la fin de ta réponse sous la forme « Décision à
  documenter : ... ».
- Le prompt de la tâche précise du jour est fourni séparément (fichier
  dans `docs/prompts/PROMPT_FXX_....md`, référencé explicitement dans le
  message). Ce fichier CLAUDE.md ne contient jamais la tâche elle-même.
- Vitrine et Espace Parent n'utilisent JAMAIS de composant PrimeNG — CSS
  propre uniquement, fidèle à `reference/DEMO_DESIGN_SPEC.md` une fois
  généré (ADR-011). L'application interne utilise PrimeNG normalement.
- Aucune couleur de marque codée en dur dans un composant — toujours via
  le mécanisme de branding dynamique décrit dans FRONTEND_CONTEXT.md §3.
- Le backend reste la seule source de vérité pour les règles métier et les
  autorisations — le frontend ne fait que du confort UX (afficher/masquer),
  jamais un contrôle qui remplacerait une vérification serveur.
- Tout texte affiché à l'utilisateur passe par une clé de traduction
  Transloco (fr + en, cf. ADR-012) — jamais une chaîne de caractères en
  dur dans un template ou un composant, y compris pour un nouveau texte
  ajouté en cours de correctif.

## Avant de commencer une tâche longue

Résume en une ligne le contenu de FRONTEND_CONTEXT.md §2 (architecture à
trois zones) et de chaque ADR frontend, pour confirmer que le contexte est
bien chargé avant de lancer la tâche.

## Structure du dépôt

```
.
├── CLAUDE.md                    (ce fichier)
├── reference/
│   ├── COBIMAG-site-SPA.html    (démo déjà validée — référence visuelle)
│   └── DEMO_DESIGN_SPEC.md      (extraction précise du design, PROMPT_F00)
├── docs/
│   ├── FRONTEND_CONTEXT.md
│   ├── ROADMAP.md
│   ├── backend-reference/
│   │   ├── MASTER_CONTEXT.md
│   │   ├── CONVENTIONS.md
│   │   ├── ROADMAP.md
│   │   └── adr/                 (ADR-001 à ADR-010, copie du backend)
│   ├── adr/
│   │   └── ADR-011-...md        (et suivants, propres au frontend)
│   └── prompts/
│       └── PROMPT_F00_....md    (et suivants, au fur et à mesure)
└── src/...                       (projet Poseidon existant)
```
