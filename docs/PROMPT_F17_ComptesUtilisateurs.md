# PROMPT_F17 — Comptes utilisateurs (création, rôles, réinitialisation)

**À utiliser avec** : FRONTEND_CONTEXT.md, docs/backend-reference/API_CONTRACT.md
(mis à jour avec le module Comptes, cf. PROMPT_22 backend — vérifie qu'il
y est avant de lancer ce prompt), DESIGN_SYSTEM.md fournis en contexte.

**Priorité** : avant F15 — sans ce module, seul le compte SUPER_ADMIN
seedé peut utiliser l'application, tout le reste construit jusqu'ici
(F08-F16) reste inutilisable par le vrai personnel.

---

## Prompt

```
Contexte : nouveau module, réservé SUPER_ADMIN sans exception. Vérifie
les champs exacts dans API_CONTRACT.md avant de coder.

## PARTIE 1 — Action contextuelle depuis Personnel

Sur personnel-liste.ts (F10) et/ou personnel-form.ts : ajoute une action
"Créer un compte" pour un Personnel qui n'a pas encore de compte lié
(masquée s'il en a déjà un — vérifie via GET /api/utilisateurs filtré, ou
si le Personnel expose déjà cette info directement, utilise-la).

Dialog de création : email (à saisir, pas déductible automatiquement),
rôle (pré-sélectionné sur ENSEIGNANT si Personnel.typePersonnel =
ENSEIGNANT, sinon vide et obligatoire — jamais assigné silencieusement,
cf. discussion produit). personnelId pré-rempli automatiquement, non
modifiable dans ce contexte.

Après création réussie : affiche le mot de passe temporaire généré dans
une boîte de dialogue claire, avec un bouton "Copier", et un avertissement
explicite qu'il ne sera plus jamais affichable après fermeture de cette
fenêtre — l'admin doit le noter/communiquer immédiatement.

## PARTIE 2 — Écran "Comptes utilisateurs" (/app/administration/comptes)

Liste de TOUS les comptes staff (GescolTableComponent), filtres par rôle
et par statut actif/inactif. Colonnes : email, rôle, personnel lié (nom
si disponible), statut. Actions par ligne :
- Modifier le(s) rôle(s)
- Réinitialiser le mot de passe (même dialog "affiché une fois" que la
  création, avec confirmation avant l'action — ça invalide l'ancien mot
  de passe immédiatement)
- Désactiver/Réactiver

Ce même écran doit aussi permettre de créer un compte SANS Personnel lié
(cas SUPER_ADMIN/COMMUNICATION externe) — bouton "Nouveau compte" séparé
de l'action contextuelle de la Partie 1, personnelId laissé vide dans ce
cas.

## SÉCURITÉ UI

Route entière réservée SUPER_ADMIN — ajoute-la au menu (section
Administration, cohérent avec PAGES_ET_NAVIGATION.md, à étendre pour ce
nouveau module) et au guard de route.

## i18n

Scope 'app', FR + EN, ADR-012.

## AUTO-VÉRIFICATION (documente le résultat en tête du handoff)

1. Champs conformes à API_CONTRACT.md
2. Le mot de passe généré n'est JAMAIS stocké dans un état Angular
   persistant au-delà de l'affichage immédiat (pas de signal qui le garde
   en mémoire indéfiniment, pas de log console)
3. Rôle jamais pré-assigné silencieusement pour un personnel NON_ENSEIGNANT
   — toujours un choix explicite requis
4. Tentative d'assigner PARENT depuis cet écran → impossible dès l'UI
   (option absente du sélecteur, pas juste bloquée côté backend)
5. Un Personnel ayant déjà un compte ne propose plus l'action "Créer un
   compte" (ou le backend rejette proprement si tenté, cf. R22)
6. Aucun texte français en dur
7. Route accessible uniquement à SUPER_ADMIN (vérifié, pas supposé)

À la fin, un seul résumé de handoff avec le résultat de
l'auto-vérification en premier.
```
