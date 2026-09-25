# PROMPT_F11 — Résultats (saisie, validation, bulletins)

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md,
docs/backend-reference/API_CONTRACT.md, docs/backend-reference/MASTER_CONTEXT.md,
DESIGN_SYSTEM.md fournis en contexte.

**Nouvelle cadence** : un seul bloc, auto-vérification en fin de prompt.

---

## Prompt

```
Contexte : F10 a exposé EmploiDuTempsResponse (classeId/matiereId/
enseignantId) et PersonnelResponse.matiereIds, pensés pour préfiltrer ce
module. ClasseResponse porte professeurPrincipalId (PROMPT_14 backend) —
utile pour R21. Vérifie les champs exacts de chaque endpoint dans
API_CONTRACT.md avant de coder.

## PARTIE 1 — Sélecteur commun classe/matière/séquence

Construis un sélecteur réutilisé par Saisie ET Validation :
- SUPER_ADMIN : choix libre parmi toutes les classes/matières/séquences
  (GET /api/classes, /api/matieres, /api/sequences)
- ENSEIGNANT : classe/matière limitées à ses propres créneaux
  d'EmploiDuTemps (récupère son planning, déduis les combinaisons
  classe+matière distinctes qu'il enseigne réellement — ne propose pas de
  combinaison qu'il n'enseigne pas, le backend la rejetterait de toute
  façon avec R12, mais autant ne pas le laisser cliquer dans le vide)

## PARTIE 2 — Saisie des notes (/app/resultats/saisie)

1. Après sélection classe/matière/séquence : GET .../classe/.../matiere/
   .../sequence/... pour charger les notes existantes de tous les élèves
   de la classe.
2. Grille éditable : un élève par ligne, note en entrée numérique (0-20).
   Note déjà VALIDEE (R13) : lecture seule, badge "Validée" visible —
   aucune tentative de modification possible depuis cet écran.
3. Bouton "Enregistrer" : POST .../lot avec toutes les notes saisies/
   modifiées d'un coup (pas un appel par élève).
4. Gère l'erreur R12 (403/409 selon la convention établie — vérifie le
   code exact dans API_CONTRACT.md) si jamais une tentative arrive quand
   même côté serveur, avec un message clair.

## PARTIE 3 — Validation des notes (/app/resultats/validation)

1. Sélecteur classe/matière/séquence, MAIS pour ENSEIGNANT : n'affiche que
   les classes dont il est professeurPrincipalId (comparaison avec son
   propre personnelId) — en plus de SUPER_ADMIN qui voit tout. Un
   ENSEIGNANT qui n'est professeur principal d'aucune classe ne voit
   simplement aucune option ici (pas un écran cassé, juste un état vide
   avec message explicatif).
2. Grille de lecture (notes non encore validées de la sélection), cases à
   cocher pour sélectionner lesquelles valider (ou "tout sélectionner").
3. Bouton "Valider" : PUT .../valider avec la liste des ids sélectionnés.
   Gère explicitement l'échec fail-closed (cf. correctif backend R21) :
   si le lot est rejeté parce qu'une classe du lot n'est pas autorisée,
   affiche le message backend réel — mais comme ce sélecteur ne permet de
   choisir qu'UNE classe à la fois (Partie 3 point 1), ce cas ne devrait
   pas se produire en usage normal ; gère-le quand même proprement si le
   backend le renvoie.

## PARTIE 4 — Bulletins (/app/resultats/bulletins)

1. Sélection élève + séquence (élève : recherche similaire à
   fiche-eleve.ts, pas besoin de dupliquer toute la logique si un service
   de recherche élève existe déjà depuis F08 — réutilise-le).
2. Aperçu des moyennes avant téléchargement : GET .../moyennes/eleve/
   .../sequence/... affiché dans un tableau simple (matière, note,
   coefficient, moyenne générale) — évite de télécharger un PDF juste pour
   vérifier que les données sont correctes.
3. Bouton téléchargement PDF : pattern blob déjà établi (quittance, lettre
   d'engagement) — jamais de token en URL.

## DESIGN

Grilles de saisie/validation : tableau dense, pas un dialog — cohérent
avec DESIGN_SYSTEM (états vide/chargement/erreur/succès obligatoires).
Envisage un composant partagé entre Saisie et Validation si leur structure
de grille est proche (même logique que EdtGrille en F10) — sans forcer la
réutilisation si les deux vues divergent trop en pratique.

## SÉCURITÉ UI

Cohérent avec PAGES_ET_NAVIGATION.md §1 — rappel : tout masquage ici est
un confort UX, R12/R13/R21 restent appliquées côté backend quoi qu'il
arrive côté frontend.

## i18n

Scope 'app', FR + EN, ADR-012.

## AUTO-VÉRIFICATION (documente le résultat en tête du handoff)

1. Champs conformes à API_CONTRACT.md pour les 4 endpoints utilisés
2. ENSEIGNANT ne voit en saisie que ses propres combinaisons classe/matière
   (vérifiable en inspectant les options du sélecteur, pas juste en
   supposant que le filtre est appliqué)
3. Une note VALIDEE est bien en lecture seule sur l'écran de saisie
4. ENSEIGNANT sans classe en professeur principal → état vide explicite
   sur l'écran de validation, pas un écran cassé
5. Téléchargement bulletin : aucun token dans l'URL
6. Aucun texte français en dur
7. Routes conformes à PAGES_ET_NAVIGATION.md §2

À la fin, un seul résumé de handoff avec le résultat de
l'auto-vérification en premier.
```
