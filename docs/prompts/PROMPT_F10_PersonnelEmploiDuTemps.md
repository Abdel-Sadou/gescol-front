# PROMPT_F10 — Personnel + Emploi du temps

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md,
docs/backend-reference/API_CONTRACT.md, docs/backend-reference/CONVENTIONS.md,
docs/backend-reference/MASTER_CONTEXT.md, **DESIGN_SYSTEM.md** fournis en
contexte.

**Nouvelle cadence** : un seul bloc, avec auto-vérification en fin de
prompt (même format que F09).

---

## Prompt

```
Contexte : F08/F09 ont posé le pattern PrimeNG de référence
(GescolTableComponent, DeleteConfirmDialogComponent, DESIGN_SYSTEM.md).
Ce prompt construit Personnel (complexe → page dédiée, comme Élève) et
Emploi du temps (premier écran qui n'est pas une simple liste/formulaire —
un vrai planning).

Vérifie les champs exacts de chaque entité dans API_CONTRACT.md avant de
coder — ne suppose aucun nom de champ.

## PARTIE 1 — Personnel

1. **Liste** (/app/personnel) : GescolTableComponent, recherche (nom,
   matricule, typePersonnel), actions par ligne (voir/éditer, désactiver/
   réactiver — PAS supprimer par défaut, cf. R10 : la suppression n'est
   possible que si aucun EmploiDuTemps ni BulletinPaie n'existe pour ce
   personnel, sinon 409 explicite invitant à désactiver à la place — le
   bouton "Supprimer" peut rester disponible mais son échec doit afficher
   ce message backend réel, cohérent avec DeleteConfirmDialogComponent).

2. **Nouveau/édition** (/app/personnel/nouveau, /:id/editer) : page
   dédiée, sections DESIGN_SYSTEM (identité / contrat / matières
   enseignées / coordonnées bancaires) :
   - Identité : nom, prénom, téléphone, email, date d'embauche
   - Contrat : typePersonnel, typeContrat, fonction (matricule en lecture
     seule en édition, généré R8)
   - Matières enseignées : sélecteur multiple, affiché UNIQUEMENT si
     typePersonnel = ENSEIGNANT (masqué sinon, pas juste désactivé)
   - Coordonnées bancaires : numéro de compte, banque (nécessaires pour
     le virement de paie, R19 — champ optionnel ici mais rappelle en texte
     d'aide qu'ils seront requis pour générer un bulletin en virement)
   - Salaire de base / indemnité transport (pertinents PERMANENT/
     SEMI_PERMANENT — vérifie si ces champs doivent être conditionnés au
     typeContrat, cohérent avec R17 backend)

3. **Désactivation/réactivation** : actions dédiées (PUT .../desactiver,
   .../reactiver), pas un champ à cocher dans le formulaire principal —
   des boutons d'action clairs, avec confirmation.

## PARTIE 2 — Emploi du temps

1. **Vue par classe** (/app/emploi-du-temps/classe/:id) et **vue par
   enseignant** (/app/emploi-du-temps/enseignant/:id) : présente les
   créneaux sous forme de planning hebdomadaire (jours en colonnes ou
   lignes, créneaux horaires visibles) — PrimeNG n'a pas de composant
   dédié pour ça, construis une grille simple avec p-card/tableau HTML
   stylé selon DESIGN_SYSTEM plutôt que d'improviser un composant
   complexe. Sélecteur de classe/enseignant en haut de page pour changer
   de vue.

2. **Nouveau créneau** (/app/emploi-du-temps/nouveau) : formulaire simple
   (classe, matière, enseignant, jour, heure début/fin). Gère
   explicitement l'erreur R4 (chevauchement enseignant) avec un message
   clair citant le conflit si le backend le fournit dans sa réponse
   d'erreur (vérifie le format exact dans API_CONTRACT.md).

## SÉCURITÉ UI

Écriture (personnel, créneaux) réservée SUPER_ADMIN/SECRETARIAT — lecture
ENSEIGNANT limitée à son propre planning (cohérent avec
PAGES_ET_NAVIGATION.md §1, "lecture propre").

## i18n

Scope 'app', FR + EN, cohérent avec ADR-012.

## AUTO-VÉRIFICATION (documente le résultat en tête du handoff)

1. Champs de chaque formulaire conformes à API_CONTRACT.md
2. Personnel utilise GescolTableComponent (liste) — page dédiée pour le
   formulaire, cohérent avec la convention F08/F09
3. Le sélecteur de matières n'apparaît que pour typePersonnel = ENSEIGNANT
4. R10 : tentative de suppression d'un personnel avec historique affiche
   le vrai message backend (pas un message générique)
5. R4 : tentative de créneau en conflit affiche un message clair
6. Aucun texte français en dur (grep les fichiers concernés)
7. Routes conformes à PAGES_ET_NAVIGATION.md §2 — signale toute divergence

À la fin, un seul résumé de handoff avec le résultat de
l'auto-vérification en premier.
```
