# PROMPT_F00 — Exploration Poseidon + extraction du design de la démo

**À utiliser avec** : FRONTEND_CONTEXT.md fourni en contexte. Pas de code à
écrire dans ce prompt — uniquement de l'exploration et de la documentation.
Place d'abord le fichier `COBIMAG-site-SPA.html` (démo déjà envoyée à
Bertrand) à la racine du projet, dans un dossier `reference/`.

---

## Prompt

```
Contexte : avant de coder quoi que ce soit, j'ai besoin d'un état des lieux
précis de deux choses : la structure réelle du projet Poseidon tel qu'il est
chez moi, et le design exact de la démo déjà validée (reference/COBIMAG-site-SPA.html).
Ne code rien dans ce prompt — uniquement de l'exploration et un rapport.

## PARTIE 1 — Structure réelle du projet Poseidon

Explore le projet et documente précisément :
1. Arborescence complète de src/app/ (pas juste layout/ et demo/, tout)
2. Contenu de src/app/layout/service/layout.service.ts — comment il gère
   le thème, le mode (light/dim/dark), les menus
3. Contenu de src/app/layout/components/app.menu.ts — structure exacte du
   modèle de menu actuel
4. Où et comment le preset PrimeNG actuel est configuré (cherche
   definePreset, providePrimeNG, ou équivalent — probablement dans
   app.config.ts ou main.ts)
5. Structure du routing actuel (app.routes.ts) — quelles routes existent
   déjà par défaut dans le template
6. Version exacte d'Angular et de PrimeNG installées (package.json)
7. Le template propose-t-il déjà une page de connexion utilisable telle
   quelle (mentionnée dans leur doc) ? Si oui, où est-elle et à quoi
   ressemble-t-elle ?

## PARTIE 2 — Extraction précise du design de la démo

Lis reference/COBIMAG-site-SPA.html et extrais, sous forme de document
Markdown structuré (reference/DEMO_DESIGN_SPEC.md) :

1. Toutes les couleurs hexadécimales utilisées, avec leur usage (ex.
   "#008B47 — vert primaire, utilisé pour les bordures de cartes et le
   texte des liens" / "#1c2a20 — presque noir, texte principal" / "#5F6161
   — gris, texte secondaire" / "#E8722C — orange accent, boutons d'action")
2. Polices utilisées (probablement 'Lora' pour les titres, 'Work Sans' ou
   équivalent pour le texte courant) — confirme lesquelles exactement et
   où (import Google Fonts en tête de fichier)
3. Pour CHAQUE écran contenu dans le fichier (Landing, Connexion/Inscription,
   Tableau de bord parent, Quittance, Fiche élève — selon ce qui est
   réellement présent, ne suppose rien) :
   - Sa structure générale (sections, disposition en grille, cartes)
   - Les valeurs de style précises réutilisables (rayons de bordure,
     ombres, espacements) pour rester cohérent entre tous les écrans
     futurs
4. Note explicitement la syntaxe de template propriétaire rencontrée
   (sc-if, sc-camel-on-click, {{variable}}) — traduis en pseudo-code ce que
   chaque bloc dynamique est censé afficher, pour qu'on sache quelle donnée
   réelle de l'API viendra remplacer chaque placeholder plus tard

## RÉSUMÉ ATTENDU

Un handoff classique, mais uniquement descriptif (aucun fichier de code
applicatif créé, à part reference/DEMO_DESIGN_SPEC.md) :
- Arborescence réelle du projet Poseidon
- Réponses aux 7 points de la Partie 1
- Confirmation que reference/DEMO_DESIGN_SPEC.md a été créé, avec son
  contenu inclus dans le résumé (pas juste "fichier créé", colle le
  contenu réel pour que je puisse le lire directement dans le handoff)
```
