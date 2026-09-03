# PROMPT_F09 — Paramétrage (8 écrans)

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md,
docs/backend-reference/API_CONTRACT.md, docs/backend-reference/CONVENTIONS.md
fournis en contexte.

**Nouvelle cadence** : ce prompt couvre les 8 écrans d'un coup. Auto-vérifie
ton propre travail contre les documents de référence avant de conclure
(cf. section AUTO-VÉRIFICATION en fin de prompt) plutôt que d'attendre une
relecture externe à chaque écran.

---

## Prompt

```
Contexte : F08 a posé le pattern PrimeNG de référence (GescolTableComponent,
DeleteConfirmDialogComponent, convention de formulaire en dialog pour les
entités simples). Ce prompt construit les 8 écrans de Paramétrage en
réutilisant ces briques — pas en les recréant.

## RÈGLE GÉNÉRALE

Pour CHAQUE entité ci-dessous : vérifie ses champs exacts dans
API_CONTRACT.md avant de coder le formulaire — ne suppose aucun nom de
champ. Utilise GescolTableComponent pour le listing, un dialog PrimeNG
compact pour la création/édition (convention F08), DeleteConfirmDialogComponent
pour la suppression avec affichage du message d'erreur réel si 409.

## Les 8 écrans

1. **Classes** (/app/parametrage/classes) : CRUD standard. Ajoute aussi un
   bouton/action "Désigner professeur principal" par ligne (endpoint séparé
   PUT /api/classes/{id}/professeur-principal, déjà existant côté backend —
   un petit dialog de sélection suffit, pas besoin de l'intégrer au
   formulaire principal de la classe).

2. **Trimestres & séquences** (/app/parametrage/trimestres) : Trimestre et
   Sequence sont liées (une séquence appartient à un trimestre). Structure
   en maître-détail : liste des trimestres, et pour chaque trimestre
   sélectionné, ses séquences (table imbriquée ou vue déroulante — à toi de
   juger ce qui est le plus clair). CRUD sur les deux entités.

3. **Taux de scolarité** (/app/parametrage/taux-scolarite) : CRUD standard,
   écriture réservée à la permission SCOLARITE_TAUX_MODIFIER (vérifie le
   rôle/permission exact dans MASTER_CONTEXT avant de restreindre le
   bouton "Nouveau"/"Modifier" côté UI — rappel : c'est juste du confort
   UX, le backend reste la seule vraie barrière).

4. **Quotas horaires** (/app/parametrage/quotas-horaires) : CRUD standard,
   permission QUOTAS_MODIFIER (même logique que le point 3).

5. **Matières** (/app/parametrage/matieres) : CRUD standard, simple.

6. **Coefficients** (/app/parametrage/coefficients) : CRUD standard,
   écriture réservée SUPER_ADMIN uniquement (pas SECRETARIAT).

7. **Niveaux** (/app/parametrage/niveaux) : CRUD standard, simple.

8. **Modèles de lettre d'engagement** (/app/parametrage/modeles-engagement) :
   EXCEPTION à la convention dialog — le champ contenu (texte avec
   variables de substitution type {{nomEleve}}) est trop long pour un
   dialog compact. Utilise une page dédiée (comme Élève/Personnel), avec
   une zone de texte large et, si simple à ajouter, un rappel visuel des
   variables disponibles à côté du champ.

## SÉCURITÉ UI

Pour chaque écran, n'affiche les boutons de création/édition/suppression
que si le rôle/permission de l'utilisateur connecté le permet (cohérent
avec MASTER_CONTEXT §7) — masquage uniquement, jamais un contrôle qui
remplace la vérification serveur (FRONTEND_CONTEXT §7).

## i18n

Toutes les clés en Transloco, scope 'app', FR + EN — cohérent avec tout ce
qui précède (ADR-012).

## AUTO-VÉRIFICATION (à faire avant de conclure, documente le résultat)

Avant de rédiger le résumé de fin, vérifie toi-même :
1. Chaque champ de chaque formulaire correspond exactement à
   API_CONTRACT.md (pas de nom de champ deviné)
2. Chaque écran utilise bien GescolTableComponent et
   DeleteConfirmDialogComponent — pas de table ou dialog réécrit à la main
3. Aucun texte français en dur (grep les 8 fichiers pour des caractères
   accentués hors clés i18n et commentaires)
4. Les routes correspondent exactement à PAGES_ET_NAVIGATION.md §2
   (chemins déjà définis) — signale toute divergence plutôt que de la
   corriger silencieusement si le chemin existant dans app.routes.ts
   diffère de ce que le document préconise
5. Le dialog de suppression affiche bien un message d'erreur backend réel
   sur au moins un cas testable (ex. tenter de supprimer un Niveau
   référencé par une Classe, si une telle règle existe côté backend —
   vérifie dans MASTER_CONTEXT si c'est le cas, sinon signale l'absence de
   contrainte plutôt que d'en inventer une)

À la fin, un seul résumé de handoff couvrant les 8 écrans, avec le
résultat de cette auto-vérification en premier (pas en dernier) — si
quelque chose cloche, je veux le voir tout de suite en lisant le handoff,
pas après avoir tout parcouru.
```
