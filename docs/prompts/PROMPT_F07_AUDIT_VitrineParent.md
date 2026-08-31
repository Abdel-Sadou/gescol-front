# PROMPT_F07_AUDIT — Audit fonctionnel et logique : Vitrine + Espace Parent

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md,
docs/backend-reference/API_CONTRACT.md fournis en contexte.

**Nature de ce prompt** : audit uniquement, aucune correction automatique.
Produit un rapport structuré — les corrections seront des prompts séparés,
une fois qu'on sait précisément quoi corriger.

---

## Prompt

```
Contexte : premier test réel avec le backend fonctionnel (proxy corrigé,
bugs token/roles corrigés). Avant de continuer sur F08, audit complet de
tout ce qui existe déjà côté Vitrine et Espace Parent — pas de correction
dans ce prompt, juste un rapport.

Périmètre : src/app/pages/vitrine/** (landing + article),
src/app/pages/connexion/**, src/app/pages/parent/** (dashboard + quittance).

## 1. Navigation et liens morts

Pour chaque bouton/lien de ces écrans, vérifie qu'il a une vraie
destination fonctionnelle :
- Liste tout `noop()`, `href="#"`, `(click)` vide, ou tout bouton dont
  l'action ne fait rien de visible
- Liste tout lien qui pointe vers une route qui n'existe pas dans
  app.routes.ts
- Vérifie que chaque section de navigation (nav Vitrine, footer, sélecteur
  d'enfant, historique de versements) mène bien où son libellé le suggère

## 2. Complétude des appels API

Pour chaque écran, vérifie qu'il utilise bien les services réels
(VitrineService, ParentDashboardService, AuthService) et PAS de données
statiques oubliées :
- grep pour d'anciens noms (KIDS, STUDENTS, ARTICLES) au cas où un import
  résiduel traînerait
- Vérifie qu'aucun appel HTTP n'est fait en double (ex. le même endpoint
  appelé par erreur à deux endroits différents pour la même donnée)

## 3. États de chargement/erreur/vide

Pour chaque source de données asynchrone, vérifie que les 3 états
(chargement, erreur réseau, résultat vide) sont bien distincts et
implémentés — pas seulement le cas "tout va bien" :
- Liste tout endroit où une erreur silencieuse pourrait laisser un écran
  vide sans explication à l'utilisateur

## 4. Internationalisation (ADR-012)

- grep les 3 dossiers pour du texte contenant des caractères accentués
  français en dehors des fichiers i18n et des commentaires — signale toute
  régression depuis PROMPT_F02bis/F05
- Vérifie que chaque nouvel élément ajouté depuis (dashboard, quittance)
  a bien ses clés dans le scope 'parent'

## 5. Accessibilité de base (vérifiable dans le code)

- Toute `<img>` a un attribut `alt` non vide et pertinent
- Tout `<input>` a un `<label>` associé (via `for`/`id` ou `aria-label`)
- Tout bouton n'affichant qu'une icône a un `aria-label`
- Aucune suppression globale de `outline`/`focus` en CSS qui empêcherait la
  navigation au clavier

## 6. Cohérence avec les conventions déjà établies

- ADR-011 : aucun composant PrimeNG importé dans ces trois zones
  (vérification grep des imports `primeng/*`)
- `overflow-x: clip` respecté partout où un scroll horizontal accidentel
  pourrait casser un `position: sticky` (cf. bug déjà rencontré en F04)
- Pattern de téléchargement blob (pas de token en URL) respecté partout où
  un fichier est téléchargé

## 7. Écarts avec PAGES_ET_NAVIGATION.md et le cahier des charges

- Toute fonctionnalité décrite dans PAGES_ET_NAVIGATION.md §2 pour ces
  écrans mais absente du code
- Tout écran ou bouton présent dans le code mais qui ne correspond à rien
  dans la spec (comme la page article en son temps) — à signaler, pas à
  retirer toi-même

## FORMAT DU RAPPORT

Un tableau par section (1 à 7), avec pour chaque problème trouvé : le
fichier concerné, la ligne si possible, une description courte, et une
sévérité (🔴 bloquant / 🟡 à corriger / 🔵 mineur). Pas de correction de
code dans ce prompt — uniquement le rapport.
```
