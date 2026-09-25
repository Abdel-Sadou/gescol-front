# PROMPT_F08bis_CORRECTIF3 — Intégration des tableaux de bord par rôle

**À utiliser avec** : FRONTEND_CONTEXT.md, docs/backend-reference/API_CONTRACT.md
(mis à jour avec le module tableau de bord, cf. PROMPT_23 backend — vérifie
qu'il y est avant de lancer ce prompt), DESIGN_SYSTEM.md fournis en
contexte. **Place d'abord le contenu du zip fourni dans
reference/angular-role-dashboards/** à la racine du projet.

**Remplace** DashboardHomeComponent (F08bis, données statiques
génériques) par le système à 5 tableaux de bord par rôle.

---

## Prompt

```
Contexte : reference/angular-role-dashboards/ contient un système complet
de 5 tableaux de bord par rôle (direction, secrétariat, économat,
enseignant, communication), avec file d'actions et bascule mock/API déjà
prête. Lis son README.md en entier avant de commencer.

## PARTIE 1 — Intégration du code

1. Copie src/app/features/dashboard/ dans le projet (structure suggérée
   par le README : src/app/features/dashboard/, ou adapte à l'arborescence
   déjà en place si elle diffère — documente ton choix).
2. Remplace la route index de /app (actuellement DashboardHomeComponent de
   F08bis, données statiques) par le nouveau dashboard-home.component.ts
   de ce package. Passe-lui le rôle et le nom d'affichage depuis
   AuthService réel (pas les valeurs de démonstration).
3. Bascule DASHBOARD_USE_MOCK à false dans app.config.ts — le système
   passe sur les vrais appels API dès cette étape (les 5 endpoints
   existent déjà depuis PROMPT_23 backend).

## PARTIE 2 — Cohérence visuelle avec le reste du projet

Le package a son propre dashboard-tokens.css avec valeurs de repli —
vérifie qu'il n'entre pas en conflit avec les jetons déjà posés en F08bis
(_cobimag.scss) et DESIGN_SYSTEM.md. Si les valeurs correspondent déjà
(même palette "Institutionnel chaud"), tu peux te passer de
dashboard-tokens.css et laisser le CSS global existant prendre le relais
— vérifie et documente ce que tu choisis.

## PARTIE 3 — Ancien composant

DashboardHomeComponent (F08bis) et dashboard-data.ts (données statiques
génériques) deviennent obsolètes — supprime-les si plus aucune route ne
les référence après ce changement, ou signale-les comme code mort restant
si une suppression complète te semble risquée à cette étape.

## VÉRIFICATION

- Connexion avec un compte de chaque rôle (cf. comptes test déjà créés
  pour la checklist de vérification des rôles) → chaque rôle voit bien
  SON tableau de bord, pas un générique
- Une tâche de type COMMANDE (ex. valider une déclaration bancaire depuis
  la file) fonctionne et la tâche disparaît après rechargement
- Une tâche de type NAVIGUER ouvre bien le bon écran existant
- États chargement/erreur/vide corrects sur chaque tableau de bord
- ENSEIGNANT connecté à son propre compte ne voit que ses propres
  créneaux/notes (R12) — vérifie, ne suppose pas

À la fin, résumé de handoff — confirme explicitement que
DASHBOARD_USE_MOCK est bien à false et que les 5 rôles ont été testés un
par un, pas seulement SUPER_ADMIN.
```
