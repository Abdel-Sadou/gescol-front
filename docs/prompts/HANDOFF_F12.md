# HANDOFF F12 — Discipline

## Auto-vérification

1. ✅ **Champs conformes à API_CONTRACT.md** — tous les champs des requêtes et réponses correspondent exactement à la spécification : `eleveId`, `typeSanction`, `dateSanction`, `motif`, `enregistreParId?` (POST sanctions) ; `eleveId`, `dateSortie`, `motif`, `autoriseParId` (POST bons-sortie) ; `typeSanctionDeclencheur`, `seuilDeclenchement`, `sanctionResultante` (POST/PUT règles).

2. ✅ **Aucun filtre R12 appliqué par erreur** — la recherche d'élève dans `sanctions.ts` est totalement ouverte : `eleveService.rechercher({ nom: q })` ou `{ matricule: q }` sans aucun paramètre de classe ou matière. Un ENSEIGNANT peut saisir une sanction pour tout élève de l'établissement.

3. ✅ **Sanction escalade visuellement distincte** — `genereParEscalade === true` → badge `sc-escalade-badge` orange avec icône `pi pi-bolt` et libellé "Générée automatiquement" / "Auto-generated", visible dans l'historique élève ET dans l'historique classe.

4. ✅ **Bouton "Valider le retour" absent sur bon RENTRE** — template conditionnel `@if (bon.statut === 'SORTI')` : le bouton n'est rendu que pour les bons `SORTI`. Pour `RENTRE`, seule la date de retour est affichée. Aucun bouton qui pourrait échouer silencieusement.

5. ✅ **Règles d'escalade en dialog compact** — `regles-escalade.ts` suit exactement le pattern F09 (GescolTableComponent + p-dialog + DeleteConfirmDialogComponent), sans page dédiée ni routing imbriqué. Les labels TypeSanction sont traduits via des propriétés virtuelles (`declencheurLabel`, `resultanteLabel`) injectées au chargement.

6. ✅ **Aucun texte français en dur** — toutes les chaînes passent par Transloco (`scope: 'app'`, `prefix: 'app'`). Clés ajoutées dans `fr.json` et `en.json` sous `discipline.sanctions.*`, `discipline.bonsSortie.*`, `discipline.regles.*`.

7. ✅ **Routes conformes à PAGES_ET_NAVIGATION.md §2** — `/app/discipline/sanctions`, `/app/discipline/bons-sortie`, `/app/discipline/regles` remplacent les placeholders dans `app.routes.ts`.

---

## Fichiers créés / modifiés

| Fichier | Changement |
|---|---|
| `src/app/core/services/discipline.service.ts` | Créé — interfaces (SanctionResponse, BonSortieResponse, RegleDisciplineResponse + requests), TypeSanction enum, ALL_TYPES_SANCTION[], tous les appels HTTP |
| `src/app/pages/app/discipline/sanctions.ts` | Créé — recherche élève (sans filtre R12), historique élève (avec badge escalade), formulaire saisie, historique par classe |
| `src/app/pages/app/discipline/bons-sortie.ts` | Créé — recherche élève, liste bons avec "Valider le retour" (SORTI only), formulaire nouveau bon |
| `src/app/pages/app/discipline/regles-escalade.ts` | Créé — dialog compact F09, GescolTableComponent, SUPER_ADMIN uniquement |
| `src/app.routes.ts` | 3 routes discipline → composants réels |
| `src/assets/i18n/app/fr.json` | Clés `discipline.*` ajoutées |
| `src/assets/i18n/app/en.json` | Clés `discipline.*` ajoutées |
| `docs/ROADMAP.md` | F12 → ✅ Fait |

---

## Points d'attention pour la suite

- **dateSanction / dateSortie** : l'input `datetime-local` envoie `YYYY-MM-DDTHH:mm` ; le helper `datetimeLocalToISO()` ajoute `:00` pour obtenir le format `LocalDateTime` attendu par Spring.
- **autoriseParId** (BonSortieRequest) est **obligatoire** dans l'API — le composant récupère `utilisateurId` depuis le JWT via `AuthService.currentUser()`. Si ce champ est absent (compte sans JWT valide), la création est bloquée avec un message d'erreur.
- **Pagination règles** : `getRegles()` retourne un `List<>` plat (pas paginé) — le composant encapsule dans un objet `PageResponse` mock pour compatibilité GescolTableComponent.
- **Langue dynamique** : les labels TypeSanction dans la table règles sont traduits au moment du chargement. Un changement de langue sans rechargement des données laisserait les libellés dans l'ancienne langue — acceptable pour une app interne (rechargement manuel ou rappel de `resetPage()` après changement de langue si nécessaire).
