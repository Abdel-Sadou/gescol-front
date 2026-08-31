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
| F07 | Audit fonctionnel Vitrine + Espace Parent — rapport `docs/AUDIT_F07_VITRINE_PARENT.md` | ✅ Fait | F06 |
| F07-correctifs | Corrections issues 🔴 identifiées en F07 (8 bugs critiques) | ✅ Fait | F07 |
| F08 | Menu complet `app.menu.ts` (toutes sections/sous-menus, filtre par rôle) | ⏳ À faire | F07 |

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
- **Pivot majeur (F04)** : la fidélité visuelle obtenue en reconstruisant
  depuis DEMO_DESIGN_SPEC.md (texte) s'est révélée insuffisante. Un vrai
  projet Angular a été généré par Claude Design à partir de la démo
  originale — F04 intègre ce vrai code (structure + styles exacts) au lieu
  de retraduire une spec texte. F03 reste dans l'historique mais son rendu
  visuel est remplacé.
- Exception ADR-011 actée : l'écran "Fiche élève" (secrétariat, app interne)
  garde le style CSS custom de la démo plutôt que PrimeNG — décision
  explicite, bornée à cet écran.
