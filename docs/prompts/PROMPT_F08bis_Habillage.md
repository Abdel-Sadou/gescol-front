# PROMPT_F08bis — Intégration de l'habillage visuel "Institutionnel chaud"

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md fournis en
contexte. **Place d'abord le contenu du zip fourni dans
reference/angular-dashboard/** à la racine du projet (comme pour
`reference/angular-demo/` en F04).

**Portée** : remplace l'habillage Poseidon par défaut (AppLayout) de la
zone Application interne, et construit le vrai tableau de bord d'accueil.
Ne touche PAS à Vitrine/Espace Parent (déjà en CSS propre, ADR-011) ni à
fiche-eleve.ts (exception déjà actée, laisse-le tel quel pour l'instant).

---

## Prompt

```
Contexte : reference/angular-dashboard/ contient un vrai projet Angular 21
généré par Claude Design (AppShellComponent + DashboardHomeComponent,
README détaillé sur l'intégration PrimeNG). Lis d'abord ce README en
entier avant de commencer.

## PARTIE 1 — Jetons de design

Fusionne les variables CSS de reference/angular-dashboard/src/styles.css
dans le fichier de styles global du projet (src/styles.css) — coexistence
avec Tailwind déjà en place, pas de conflit attendu (le nouveau code
n'utilise pas de classes utilitaires Tailwind, du CSS classique en
variables). Vérifie qu'aucune variable ne collisionne avec des noms déjà
utilisés par Vitrine/Espace Parent (--color-primary existe déjà depuis
F01/F03 — assure-toi que la valeur reste cohérente, pas un doublon
contradictoire).

## PARTIE 2 — Remplacement de la coque (AppLayout)

1. Copie AppShellComponent (+ IconComponent, ICONS) dans le projet
   (src/app/layout/ ou src/app/shared/ selon ce qui est cohérent avec
   l'existant).
2. Remplace le contenu de AppLayout (le layout Poseidon actuel de la zone
   /app) pour utiliser cette nouvelle coque, avec <router-outlet /> projeté
   dedans (cf. exemple du README).
3. Navigation réelle : remplace les liens décoratifs (href="#") de
   AppShellComponent par la vraie structure de menu déjà construite en F08
   (app.menu.ts, filtrée par rôle) — pas la version statique/décorative de
   la démo. Utilise RouterLink/RouterLinkActive comme indiqué dans le
   README.
4. pageTitle/pageSubtitle : branche sur les données de route (route.data
   title) plutôt que la valeur statique codée dans la démo.
5. Sélecteur de langue FR/EN de la coque : remplace par le vrai
   LanguageService/Transloco déjà utilisé partout ailleurs dans le projet
   (PROMPT_F02bis) — ne garde pas la logique de démo isolée (signal local
   'FR'/'EN' non connecté).

## PARTIE 3 — Tableau de bord réel

1. Copie DashboardHomeComponent, branche-le sur la route index de /app
   (remplace le placeholder MarketingDashboard de Poseidon).
2. Garde les données statiques de school-data.ts POUR L'INSTANT (cohérent
   avec le pattern déjà suivi pour Vitrine/Espace Parent — visuel d'abord,
   données réelles dans un prompt séparé une fois qu'on sait quels
   endpoints existent ou doivent être créés). Commente clairement
   // TODO(API) sur chaque section.
3. Signale explicitement dans le résumé de fin les 2 sections qui
   nécessiteront un endpoint backend qui n'existe pas encore tel quel :
   "Recouvrement scolarité" (taux global agrégé) et "Dernières activités"
   (fil d'activité croisant plusieurs modules) — ne les invente pas, juste
   les signaler.

## PARTIE 4 — Approfondissement du thème PrimeNG

Étends le preset PrimeNG existant (app.config.ts, déjà modifié en F01)
avec les mêmes jetons que la Partie 1 : couleurs de surface, rayons de
bordure, ombres — pas seulement la couleur primaire comme c'était le cas
jusqu'ici. Objectif : que les tableaux/formulaires PrimeNG déjà construits
(module Élèves, F08) et ceux à venir (F09+) partagent la même identité
visuelle que la nouvelle coque, sans avoir à toucher aux composants
eux-mêmes — uniquement la configuration du preset.

## PARTIE 5 — Icônes

Garde le système d'icônes SVG personnalisé (IconComponent + ICONS) pour la
coque (sidebar, barre du haut) — cohérent avec la direction visuelle. Les
composants PrimeNG eux-mêmes (tri de tableau, etc.) continuent d'utiliser
PrimeIcons en interne, c'est normal et attendu — pas besoin d'unifier les
deux systèmes, ils servent des couches différentes.

## VÉRIFICATION

- Le menu réel (F08, filtré par rôle) s'affiche dans la nouvelle coque,
  pas les liens décoratifs de la démo
- Navigation complète : cliquer un lien du menu charge bien la bonne route
  à l'intérieur de la coque
- Module Élèves (F08) : le tableau/formulaire PrimeNG s'affiche maintenant
  avec les couleurs/rayons du nouveau thème, pas l'ancien preset bleu par
  défaut
- Bascule FR/EN dans la coque fonctionne via le vrai LanguageService
- Aucune classe Tailwind cassée côté Vitrine/Espace Parent (zones non
  concernées par ce prompt)

NE PAS FAIRE à cette étape :
- Brancher les vraies données du tableau de bord (Partie 3, reporté)
- Toucher à fiche-eleve.ts (exception déjà actée, hors scope)
- Modifier Vitrine ou Espace Parent

À la fin, génère le résumé de handoff complet, en particulier la liste des
2 sections du dashboard nécessitant un futur endpoint backend (Partie 3
point 3).
```
