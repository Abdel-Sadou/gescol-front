# PROMPT_F03 — Vitrine publique (landing page réelle)

**À utiliser avec** : FRONTEND_CONTEXT.md, reference/DEMO_DESIGN_SPEC.md
(Écran 1 — Landing), docs/backend-reference/API_CONTRACT.md et
MASTER_CONTEXT.md fournis en contexte.

---

## Prompt

```
**Note** : ce prompt a déjà été exécuté avant la mise en place de l'i18n
(PROMPT_F02bis) — son rattrapage est intégré à PROMPT_F02bis Partie 5, pas
besoin de relancer ce fichier-ci. Conservé pour référence sur la structure
et les choix déjà faits (endpoints, sections, gestion des 404).

Contexte : suite de PROMPT_F01 (VitrineLayout existant, branding dynamique
en place) et PROMPT_F02bis (Transloco configuré, scope 'vitrine' créé).
Ce prompt construit la vraie page vitrine, fidèle à DEMO_DESIGN_SPEC.md
Écran 1, connectée aux vrais endpoints du module Vitrine (voir
API_CONTRACT.md section correspondante pour le détail exact des réponses —
ne suppose aucun nom de champ, vérifie-le dans le document).

Tout texte affiché (titres de section, labels, boutons) passe par une clé
de traduction du scope 'vitrine' (fr + en) — jamais de texte français en
dur, cf. ADR-012. Le contenu dynamique récupéré via getContenu() (rédigé
par l'établissement) reste tel quel, une seule langue à la fois — pas de
traduction automatique du contenu éditorial, seulement de l'interface.

Rappel ADR-011 : zéro composant PrimeNG dans cette page. Tailwind CSS +
variables CSS de branding uniquement (déjà en place depuis PROMPT_F01).

## PARTIE 1 — VitrineService

Crée un service qui expose :
- getContenu(cle: string) → GET /api/vitrine/contenu/{cle}
- getActualites(page, size) → GET /api/vitrine/actualites
- getEquipePedagogique() → GET /api/vitrine/equipe-pedagogique
Vérifie le format exact de pagination dans CONVENTIONS.md (backend) pour
getActualites — ne suppose pas la structure de l'enveloppe de réponse.

## PARTIE 2 — Structure de la page (6 sections, cf. DEMO_DESIGN_SPEC.md)

Respecte fidèlement la structure, les couleurs et les valeurs de style
listées dans DEMO_DESIGN_SPEC.md (fond #faf9f5, cards cycles, navigation
sticky avec ancres, logo circulaire + nom en Lora).

1. **#accueil** — Hero "Discipline. Rigueur. Méthode." : contenu fixe
   (c'est la devise de l'établissement, pas un contenu éditable), mais
   couleurs via les variables de branding dynamique.

2. **#ecole** — "Notre histoire, nos repères" + présentation de l'équipe :
   - Récupère via getContenu() les clés MOT_FONDATEUR et ORGANIGRAMME
     (déjà en base côté backend, cf. module Vitrine PROMPT_16)
   - Affiche l'équipe pédagogique via getEquipePedagogique() (photo, nom,
     fonction, triée par ordre) — si DEMO_DESIGN_SPEC.md ne détaille pas
     cette sous-section précisément, construis une présentation simple en
     cartes cohérente avec le reste du style de la page, et signale ce
     choix dans le résumé de fin plutôt que d'improviser sans le dire

3. **#formations** — "Nos cycles, dans les deux systèmes" :
   PAS de données dynamiques ici — l'endpoint de lecture des Niveau
   (Paramétrage) n'est pas public actuellement (réservé aux utilisateurs
   authentifiés, cf. MASTER_CONTEXT). Affiche un contenu statique
   descriptif des deux sous-systèmes (Francophone/Anglophone) pour
   l'instant. Signale explicitement dans le résumé de fin qu'un futur
   endpoint public GET /api/vitrine/niveaux (ou équivalent) serait
   nécessaire pour rendre cette section dynamique — ne le construis pas
   toi-même sans validation, ce serait modifier le périmètre backend
   depuis un prompt frontend.

4. **#vie-scolaire** — "Le quotidien de nos élèves" :
   Récupère via getContenu() les clés HORAIRES_COURS et
   ACTIVITES_PERISCOLAIRES.

5. **#actualites** — Liste d'articles :
   getActualites() — affiche les plus récentes (titre, date, image si
   présente, extrait du contenu tronqué). Respecte le filtre publie=true
   déjà appliqué côté backend (rien à filtrer côté frontend).

6. **#admissions** — "Comment inscrire votre enfant" (fond sombre, cf.
   DEMO_DESIGN_SPEC.md) :
   Récupère via getContenu() la clé COMMENT_INSCRIRE. Bouton CTA principal
   "Inscrire mon enfant" → redirige vers /connexion (pas directement
   /parent, puisque l'utilisateur n'est pas encore authentifié).

## PARTIE 3 — Navigation et robustesse

1. Navigation sticky avec liens vers les ancres des 6 sections (scroll
   fluide, pas de rechargement de page).
2. Si un appel getContenu() échoue ou retourne 404 (clé pas encore
   configurée par l'établissement) : affiche la section avec un espace
   vide plutôt qu'une erreur visible — ce n'est pas une erreur système,
   juste un contenu pas encore renseigné par l'administration.
3. Logo et nom de l'établissement dans le header : depuis EtablissementService
   déjà existant (PROMPT_F01), pas un nouvel appel.

## TESTS MANUELS (documentés dans le résumé)

- Les 6 sections s'affichent avec le contenu réel de la base de test
- Navigation par ancre fonctionne
- Aucune classe/composant PrimeNG dans le DOM rendu (vérifie comme en F01)
- Comportement correct si une clé ContenuVitrine n'existe pas encore (pas
  de crash, section vide)
- CTA "Inscrire mon enfant" redirige bien vers /connexion

NE PAS FAIRE à cette étape :
- Endpoint public pour les Niveau/cycles — signalé, pas construit
- Affichage du calendrier scolaire ou des listes de manuels/fournitures —
  absents de DEMO_DESIGN_SPEC.md, pas de référence design à suivre pour
  l'instant
- Formulaire de contact fonctionnel (juste les coordonnées si présentes
  dans ContenuVitrine, pas de soumission de formulaire — pas mentionné
  dans la démo)

À la fin, génère le résumé de handoff complet.
```
