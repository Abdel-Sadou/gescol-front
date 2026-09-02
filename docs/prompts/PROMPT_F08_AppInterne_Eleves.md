# PROMPT_F08 — Application interne : menu complet, composants réutilisables, module Élèves

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md,
docs/backend-reference/API_CONTRACT.md, docs/backend-reference/CONVENTIONS.md,
docs/backend-reference/MASTER_CONTEXT.md fournis en contexte.

**Portée** : ce prompt est le plus structurant de la phase App interne — il
pose le menu définitif et les briques réutilisables que F09 à F16 vont
tous exploiter. Prends le temps de bien faire les Parties 1 et 2, le reste
de la feuille de route en dépend directement.

---

## Prompt

```
Contexte : jusqu'ici, seuls Vitrine et Espace Parent sont construits (CSS
propre, ADR-011). Ce prompt démarre l'Application interne (Poseidon/
PrimeNG), pour le personnel (tous rôles sauf PARENT).

## PARTIE 1 — Menu complet (remplace l'existant, ne le complète pas)

Reconstruis entièrement app.menu.ts selon PAGES_ET_NAVIGATION.md §1.
Retire explicitement les entrées actuelles qui ne correspondent à rien
dans cette structure cible : "Scolarité" et "Quittances" en top-level de
Finances, "Vitrine" en top-level de Communication, "Inscriptions" sous
Élèves, le doublon "Emplois du temps" sous Paramétrage. Construis le menu
dynamiquement par rôle (filtré depuis authService.role(), cohérent avec le
pattern déjà établi en F01), avec tous les sous-menus décrits — même si la
plupart des routes ne pointent encore que vers un composant Placeholder à
ce stade (seul le module Élèves, Partie 4, a un vrai contenu dans ce
prompt).

## PARTIE 2 — Composants réutilisables (le plus important de ce prompt)

1. **Composant de table générique paginée** : colonnes/tri/pagination
   configurables par un @Input (liste de définitions de colonnes + nom des
   champs), branché sur le format PageResponse déjà établi côté backend
   (CONVENTIONS.md — content/page/size/totalElements/totalPages). Gère les
   3 états chargement/erreur/vide de façon cohérente avec le pattern déjà
   utilisé en Espace Parent (found/loading/error). Whitelist de tri
   respectée (le composant ne doit permettre de trier que sur les colonnes
   explicitement marquées triables, cohérent avec CONVENTIONS.md).

2. **Composant de dialog de confirmation de suppression générique** :
   affiche un message de confirmation standard, mais si le backend
   rejette avec 409 (règle métier bloquante comme R2 ou R10), affiche le
   message d'erreur RÉEL renvoyé par le backend dans le dialog (pas un
   message générique "Erreur") — c'est le comportement le plus utile pour
   l'utilisateur final (ex. "Impossible de supprimer : des versements
   existent pour cet élève").

3. **Un preset de style de formulaire cohérent** pour les futurs écrans de
   création/édition (espacement, validation visuelle des champs
   obligatoires, affichage des erreurs de validation retournées par le
   backend) — pas un composant unique, plutôt une convention de structure
   à documenter dans le résumé de fin pour que F09+ la suivent.

Documente ces 3 briques clairement dans le résumé de fin (emplacement des
fichiers, comment les utiliser) — F09 va s'appuyer dessus immédiatement.

## PARTIE 3 — EleveService

Service partagé (remplace les appels HTTP ad hoc actuels de
fiche-eleve.ts, cf. note ROADMAP) :
- rechercher(params, page, size) → GET /api/eleves
- getById(id) → GET /api/eleves/{id}
- creer(data) → POST /api/eleves
- modifier(id, data) → PUT /api/eleves/{id}
- supprimer(id) → DELETE /api/eleves/{id}

Vérifie API_CONTRACT.md pour le détail exact des champs de EleveRequest/
EleveResponse avant de coder — ne suppose aucun nom de champ.

Si le temps le permet, migre fiche-eleve.ts pour utiliser ce service
plutôt que ses appels HTTP directs actuels — sinon signale-le comme
reporté, ce n'est pas bloquant pour ce prompt.

## PARTIE 4 — Écran Liste des élèves

Route /app/eleves. Utilise le composant de table générique (Partie 2) :
recherche (nom, prénom, matricule, classe), pagination, actions par ligne
(voir fiche → navigue vers fiche-eleve existante, éditer, supprimer avec
le dialog de confirmation).

## PARTIE 5 — Écran Nouvel/édition élève

Étant donné le nombre de champs (13, cf. cahier des charges §5.1), utilise
une page dédiée plutôt qu'un dialog compact (contrairement à ce que F09
fera probablement pour ses entités plus simples — signale cette
distinction dans le résumé de fin comme convention pour la suite : dialog
pour les entités simples de Paramétrage, page dédiée pour les entités
complexes comme Élève/futur Personnel).

Champs du formulaire : nom, prénom, sexe, date/lieu de naissance, classe
(select, utilise l'endpoint Classe existant — accessible à ce rôle,
contrairement à PARENT), redoublant, sous-système, apte au sport, groupe
sanguin, nom du père/tuteur, nom de la mère, quartier, personne à
contacter + téléphone. Le matricule n'est PAS un champ du formulaire (R1,
généré automatiquement) — affiche-le en lecture seule en mode édition
uniquement.

Validation côté frontend cohérente avec les contraintes Bean Validation du
backend (nom/prénom/sexe/date de naissance obligatoires) — juste pour le
confort UX, le backend reste la seule source de vérité (cf.
FRONTEND_CONTEXT §7).

## PARTIE 6 — i18n

Tout texte de cette phase passe par une clé Transloco, scope 'app'
(ADR-012) — menu, table, formulaire, messages de confirmation/erreur, en
FR et EN.

## TESTS MANUELS (documentés dans le résumé)

- Connexion SUPER_ADMIN → menu complet visible avec tous les sous-menus
- Connexion SECRETARIAT → menu réduit selon PAGES_ET_NAVIGATION §1
- Liste des élèves : recherche, pagination, tri sur colonnes autorisées
  uniquement
- Création d'un élève → matricule généré visible après coup
- Suppression d'un élève ayant des versements → dialog affiche le vrai
  message d'erreur backend, pas un message générique
- Bascule FR/EN sur tous les nouveaux écrans

NE PAS FAIRE à cette étape :
- Construire le contenu réel des autres sections du menu (F09-F16) — de
  simples Placeholder suffisent pour l'instant
- Migrer fiche-eleve.ts si ça complique le prompt (reporter, signaler)

À la fin, génère le résumé de handoff complet — en particulier la
documentation précise des 3 briques réutilisables de la Partie 2, c'est
la partie la plus importante à bien transmettre pour F09.
```
