# ROADMAP — GESCOL Frontend

État d'avancement des prompts frontend. Mis à jour après chaque handoff.
Encore léger — se remplira au fur et à mesure, comme le backend l'a fait.

## État actuel

| # | Prompt | Statut | Dépend de |
|---|---|---|---|
| F00 | Exploration Poseidon + extraction design démo | ✅ Fait | — |
| F01 | Fondations (auth, routing, branding) — v2 basée sur la vraie structure | ✅ Fait | F00 |
| F02-correctif | Alignement champs login/inscription sur API_CONTRACT.md | ✅ Fait | F01 |
| F02bis | Internationalisation FR/EN (Transloco) + rattrapage F01 + F03 | 🔄 En cours | F01, F03 |
| F03 | Vitrine publique (6 sections) | ⚠️ Remplacé par F04 | F01 |
| F04 | Intégration du vrai code Angular de la démo (Vitrine, Connexion, Espace Parent, Quittance, Fiche élève) | ✅ Fait (correctif page article en attente) | F01, F02bis, F03 |
| Backend-18 | Endpoint public GET /api/vitrine/actualites/{id} | ✅ Fait | — |
| F05 | Correctif page article (vrai endpoint + retrait contenu inventé) | ✅ Fait | F04, Backend-18 |
| F06 | Données réelles : Espace Parent + Fiche élève (retrait KIDS/STUDENTS) | ✅ Fait | F05 |
| F07 | Audit fonctionnel/logique Vitrine + Espace Parent | ✅ Fait | F06 |
| F07-correctifs | Correction des 8 bugs critiques + points mineurs détectés par F07 | ✅ Fait | F07 |
| F07bis | Espace Parent — workflow d'inscription 5 étapes + lettre d'engagement | 🔄 Partie 1 faite (Service, Étape 1, Mes inscriptions) — étapes 2-5 en correctif | F06, Backend-20 |
| Backend-20 | Endpoint PARENT classes-disponibles (déblocage F07bis) | ✅ Fait | — |
| F07bis-suite | Étapes 2-5 du workflow d'inscription (sélection classe, réservation, infos, confirmation) | ✅ Fait | F07bis, Backend-20 |

## 🎉 Espace Parent : complet

Vitrine publique et Espace Parent (compte, dashboard, quittances, workflow
d'inscription 5 étapes, lettre d'engagement) sont maintenant entièrement
fonctionnels, audités (F07) et corrigés (F07-correctifs). Prochaine étape
naturelle : F08, démarrage de l'application interne (Poseidon/PrimeNG).
| F08 | App interne — Élève CRUD complet (établit le pattern PrimeNG de référence : table + formulaire) | ⏳ À faire | F01 |
| F09 | App interne — Paramétrage (classes, trimestres, taux, quotas, matières, coefficients, niveaux, modèles lettre) | ⏳ À faire | F08 |
| F10 | App interne — Personnel (CRUD + désactivation R10) + Emploi du temps (vue calendrier, R4) | ⏳ À faire | F08 |
| F11 | App interne — Résultats (saisie notes, validation R13/R21, bulletins) | ⏳ À faire | F08, F10 |
| F12 | App interne — Discipline (sanctions, bons de sortie, règles R5/R15) | ⏳ À faire | F08 |
| F13 | App interne — Finances (versements, validation bancaire R18, moratoires, états) | ⏳ À faire | F08 |
| F14 | App interne — Paie (barèmes, bulletins R17/R19, ordres de virement) | ⏳ À faire | F10 |
| F15 | App interne — Cahier de texte (saisie + vraie logique offline, R20) | ⏳ À faire | F10, F11 |
| F16 | Back-office Vitrine (actualités, contenu, équipe pédagogique — CRUD SUPER_ADMIN/COMMUNICATION) | ⏳ À faire | F08 |
| F17 | Passe qualité : revue visuelle, accessibilité, responsive, lint/analyse statique | ⏳ À faire | Tout le reste |

## Notes de séquencement

- **F08 est stratégique** : premier module CRUD de l'app interne, il établit le
  pattern réutilisable (liste PrimeNG paginée + formulaire de création/édition)
  que F09-F14 vont tous suivre — à bien roder avant de le dupliquer partout.
- **F09 regroupe plusieurs petits écrans** (Paramétrage) plutôt qu'un prompt
  par entité — même pattern CRUD simple répété 7 fois, pas la peine de
  fragmenter comme pour les modules plus complexes.
- **F15 (Cahier de texte) est techniquement le plus dur** — la vraie gestion
  hors connexion (détection de connectivité, file d'attente locale,
  synchronisation) est un sujet frontend à part entière, jamais traité
  jusqu'ici. À isoler en fin de parcours, comme PROMPT_12 côté backend.
- **F17 correspond à la discussion sur le niveau "expert"** : revue de code
  humaine, scan de vulnérabilités, vérification visuelle réelle — tout ce
  qui manque encore à la méthode purement textuelle qu'on suit depuis le
  début.

## Notes

- **Scope creep détecté en F04** : une page article (`/vitrine/actualites/:id`)
  a été construite sans avoir été demandée, avec un contournement (fetch de
  100 items + filtrage client) faute d'endpoint dédié, ET du contenu
  d'article entièrement inventé en repli. Décision : régulariser plutôt que
  retirer (PROMPT_18 backend + PROMPT_F05 frontend), mais à surveiller pour
  les prochains prompts — signaler un manque plutôt que contourner.
- **Contenu inventé, sujet plus large** : tout le texte Vitrine généré par
  Claude Design (mot du fondateur, étapes d'inscription, historique...) est
  fictif, jamais validé par l'établissement. À faire valider avant mise en
  ligne publique réelle — voir liste à dresser avec Bertrand.

## Notes

- F01 confirmé : layouts VitrineLayout/ParentLayout créés neufs après vérification
  que AuthLayout/LandingLayout importent tous deux PrimeNG via AppConfigurator
  (donc inutilisables tels quels sous ADR-011) — bonne vérification, pas une
  supposition.
- `API_CONTRACT.md` (backend, PROMPT_17) ajouté aux références — à consulter
  systématiquement pour tout nouvel appel API, plus besoin de deviner un nom
  de champ.
- ADR-012 (Transloco) décidé après coup, une fois F01 et F03 déjà construits
  avec du texte français en dur — F02bis rattrape les deux. Tout prompt futur
  (Espace Parent, modules internes) doit produire ses clés de traduction dès
  sa construction, pas dans un rattrapage ultérieur.
- **F08 doit créer un vrai `EleveService` partagé** — `fiche-eleve.ts` (F06)
  appelle `/api/eleves` directement en HTTP sans service dédié, faute de
  besoin à l'époque. F08 (CRUD Élèves) est le bon moment pour créer ce
  service correctement et, si pertinent, migrer `fiche-eleve.ts` dessus.
- **`EnfantResponse` n'a pas de champ `sousSysteme`** (DTO backend d'origine,
  PROMPT_08) — le dashboard parent (F06) utilise une heuristique par nom de
  classe pour l'affichage, explicitement documentée comme non-officielle.
  Correctif backend possible si l'heuristique se révèle trop fragile à
  l'usage (pas urgent).
  depuis DEMO_DESIGN_SPEC.md (texte) s'est révélée insuffisante. Un vrai
  projet Angular a été généré par Claude Design à partir de la démo
  originale — F04 intègre ce vrai code (structure + styles exacts) au lieu
  de retraduire une spec texte. F03 reste dans l'historique mais son rendu
  visuel est remplacé.
- Exception ADR-011 actée : l'écran "Fiche élève" (secrétariat, app interne)
  garde le style CSS custom de la démo plutôt que PrimeNG — décision
  explicite, bornée à cet écran.
