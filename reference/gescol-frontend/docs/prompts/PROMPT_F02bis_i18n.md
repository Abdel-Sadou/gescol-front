# PROMPT_F02bis — Internationalisation FR/EN (Transloco) + rattrapage F01

**À utiliser avec** : FRONTEND_CONTEXT.md, ADR-012 fournis en contexte.
**À lancer avant PROMPT_F03** — pour ne pas construire un écran de plus
avec du texte français en dur.

---

## Prompt

```
Contexte : mise en place de l'internationalisation (ADR-012), puis
rattrapage des écrans déjà construits en PROMPT_F01 (page de connexion,
menu de l'application interne) qui contiennent du texte français en dur.

## PARTIE 1 — Installation et configuration Transloco

1. Installe @jsverse/transloco.
2. Configure 2 langues : fr (défaut), en. Scope les fichiers de traduction
   par zone (cf. ADR-012) : src/assets/i18n/vitrine/fr.json +
   /vitrine/en.json, /parent/fr.json + /parent/en.json, /app/fr.json +
   /app/en.json (structure exacte à adapter selon les conventions
   Transloco pour le scoping par module — vérifie leur doc officielle pour
   la bonne convention de nommage de scope).
3. Persistance du choix de langue dans localStorage, lu au démarrage.

## PARTIE 2 — Composant sélecteur de langue

1. Un composant simple (bouton ou petit menu) FR/EN, sans dépendance
   PrimeNG pour les zones Vitrine/Parent (cohérent ADR-011 — HTML natif
   stylé), utilisable avec PrimeNG pour la zone Application interne si tu
   préfères un composant plus riche là-bas.
2. Visible sur les trois zones : dans le header de la Vitrine, dans le
   header/topbar de l'Espace Parent, dans la topbar de l'Application
   interne (Poseidon).

## PARTIE 3 — Rattrapage : page de connexion (PROMPT_F01)

Dans src/app/pages/connexion/connexion.ts, extrait TOUT le texte affiché
(labels, placeholders, boutons, messages d'erreur) vers des clés de
traduction dans le scope 'parent' (cette page sert l'accès à l'espace
parent). Exemples de clés à créer : connexion.titre, connexion.onglet.
seConnecter, connexion.onglet.creerCompte, connexion.champ.identifiant,
connexion.champ.motDePasse, connexion.lien.motDePasseOublie,
connexion.bouton.seConnecter, etc. — structure les clés de façon
cohérente, pas un nommage improvisé au fil de l'eau.

Traduis en anglais le contenu de chaque clé (en.json du scope 'parent') —
une vraie traduction, pas un texte français laissé tel quel par défaut.

## PARTIE 4 — Rattrapage : menu de l'application interne (PROMPT_F01)

Dans src/app/layout/components/app.menu.ts, extrait tous les libellés de
menu (Tableau de bord, Élèves, Finances, Paie, Personnel, Paramétrage,
Emploi du temps, Résultats, Discipline, Cahier de texte, Communication)
vers des clés de traduction dans le scope 'app', avec leur traduction
anglaise.

## PARTIE 5 — Rattrapage : page Vitrine (PROMPT_F03, exécuté avant cette
mise en place de l'i18n)

Dans src/app/pages/vitrine/vitrine.ts, extrait tout le texte affiché vers
des clés de traduction dans le scope 'vitrine', notamment :
- Les 6 titres/sous-titres de section (#accueil, #ecole, #formations,
  #vie-scolaire, #actualites, #admissions)
- Les liens de navigation (nav sticky + menu burger mobile)
- Le contenu statique de #formations (Francophone SIL→BAC, Anglophone
  Nursery→GCE A-Level)
- Les libellés de la grille équipe pédagogique si du texte fixe
  l'accompagne (ex. "Notre équipe")
- Le message de repli "bientôt disponible" affiché quand une clé
  ContenuVitrine est absente (404)
- Le texte du bouton CTA "Inscrire mon enfant" et du lien "Espace Parent"
- Tout message d'état vide (ex. liste d'actualités vide, équipe vide)

Ne touche PAS au contenu dynamique récupéré via getContenu()/
getActualites()/getEquipePedagogique() — ce texte-là est rédigé par
l'établissement dans une seule langue, ce n'est pas de l'interface (cf.
PROMPT_F03, distinction déjà actée).

Traduis chaque clé en anglais dans le scope 'vitrine' — vraie traduction,
pas un texte français laissé par défaut.

## VÉRIFICATION (mise à jour)

- Bascule FR → EN sur la page de connexion : tout le texte change
  instantanément, sans rechargement de page
- Idem sur le menu de l'application interne (nécessite une connexion de
  test)
- Idem sur la page Vitrine complète (les 6 sections, la nav, les messages
  de repli)
- Aucun texte français en dur ne subsiste dans connexion.ts, app.menu.ts,
  ni vitrine.ts (grep les trois fichiers pour du texte entre guillemets
  contenant des caractères accentués français)

À la fin, résumé de handoff : structure de fichiers de traduction créée,
clés définies pour les trois écrans (connexion, menu, vitrine),
confirmation du grep de vérification sur les trois fichiers.
```
