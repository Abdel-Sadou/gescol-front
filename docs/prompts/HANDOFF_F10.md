# HANDOFF — F10 : Personnel + Emploi du temps

**Date :** 2026-09-04  
**Statut :** ✅ Complet — build propre, 0 erreur TypeScript, 0 warning Angular

---

## 1. Ce qui a été produit

### PARTIE 1 — Personnel

| Fichier | Rôle |
|---|---|
| `src/app/core/services/personnel.service.ts` | Service complet : recherche paginée, CRUD, `desactiver()` / `reactiver()` |
| `src/app/shared/components/gescol-table.component.ts` | **Étendu** : `showToggleActive`, `tooltipDeactivate/Reactivate`, `toggleActive` output ; colonne `boolean` → `p-tag` success/danger |
| `src/app/pages/app/personnel/personnel-liste.ts` | Liste paginée + filtres (nom, matricule, typePersonnel) + toggle actif par ligne + suppression R10 |
| `src/app/pages/app/personnel/personnel-form.ts` | Formulaire ADR-013 : 4 sections + rail récapitulatif, signal-draft, `patch<K>()` |

**Pattern `PersonnelForm` :**
- Signal-draft `PersonnelDraft` + `patch<K>()` générique
- Section § 1 Identité · § 2 Contrat · § 3 Matières (masqué si NON_ENSEIGNANT) · § 4 Banque
- Rail sticky : aperçu nom/type, checklist 4 champs, boutons Annuler/Créer/Enregistrer
- Désactiver/Réactiver : boutons dans le rail (hors formulaire principal), dialog confirmation, message backend affiché
- Matricule en lecture seule en mode édition

### PARTIE 2 — Emploi du temps

| Fichier | Rôle |
|---|---|
| `src/app/core/services/emploi-du-temps.service.ts` | Service : `getByClasse()`, `getByEnseignant()`, `creerCreneau()`, `supprimerCreneau()` |
| `src/app/pages/app/emploi-du-temps/edt-grille.ts` | Composant partagé : grille hebdo 6 colonnes (LUNDI→SAMEDI), cartes par créneau, mode `'classe'` / `'enseignant'` |
| `src/app/pages/app/emploi-du-temps/emploi-du-temps-classe.ts` | Vue classe : sélecteur `p-select` + query param `?classeId=` + grille |
| `src/app/pages/app/emploi-du-temps/emploi-du-temps-enseignant.ts` | Vue enseignant : sélecteur si SUPER_ADMIN/SECRETARIAT ; auto-sélection `personnelId` JWT si ENSEIGNANT |
| `src/app/pages/app/emploi-du-temps/creneau-form.ts` | Nouveau créneau : classe + matière + enseignant + jour + heureDebut/Fin + anneeScolaire |

---

## 2. Décisions d'architecture

### GescolTableComponent étendu (pas de nouvelle abstraction)

`showToggleActive + toggleActive` ajoutés au composant existant. L'icône bascule dynamiquement `pi-pause` (actif) / `pi-play` (inactif) par lecture de `row['actif']`. Largeur colonne actions : 130 px.

### R10 — Suppression personnel (409)

`DeleteConfirmDialogComponent` extrait et affiche `err.error.message` sur tout 409 — aucun code spécifique dans `PersonnelListe`. Couvre automatiquement le message backend réel.

### R4 — Chevauchement EDT (409)

`CreneauForm.onSubmit()` branche explicitement sur `err.status === 409` et affiche le message backend dans un bloc stylisé `cf-r4` (fond warning, bordure gauche). Les autres erreurs tombent dans `genericError`.

### ENSEIGNANT auto-sélectionné (ADR-010 spirit)

`EmploiDuTempsEnseignant.ngOnInit()` teste `authService.role() === 'ENSEIGNANT'` + `currentUser()?.personnelId`. Si les deux sont vrais, il sélectionne immédiatement son propre planning sans afficher de dropdown. Seuls SUPER_ADMIN/SECRETARIAT voient le sélecteur.

### EDT — URL persistée via query params

Les deux vues EDT utilisent `?classeId=` / `?enseignantId=` plutôt qu'un `/:id` dans le path, ce qui évite de doubler les routes (avec et sans ID). La sélection est préchargée depuis `route.snapshot.queryParamMap` au démarrage.

### EdtGrille — composant partagé justifié

Les vues classe et enseignant partagent exactement la même grille. `mode: 'classe' | 'enseignant'` détermine quelle info secondaire afficher dans chaque carte (nom enseignant vs libellé classe). C'est la seule abstraction ajoutée hors du strict nécessaire.

---

## 3. Interfaces & types clés

```typescript
// personnel.service.ts
export type TypePersonnel = 'ENSEIGNANT' | 'NON_ENSEIGNANT';
export type TypeContrat   = 'VACATAIRE' | 'SEMI_PERMANENT' | 'PERMANENT';

export interface PersonnelResponse {
    id: string; matricule: string; nom: string; prenom: string;
    typePersonnel: TypePersonnel; typeContrat: TypeContrat;
    fonction: string | null; telephone: string | null; email: string | null;
    dateEmbauche: string | null; actif: boolean;
    salaireBase: number | null; indemniteTransport: number | null;
    numeroCompteBancaire: string | null; nomBanque: string | null;
    matiereIds: string[]; etablissementId: string;
    dateCreation: string; dateModification: string | null;
}
```

```typescript
// emploi-du-temps.service.ts
export type JourSemaine = 'MONDAY'|'TUESDAY'|'WEDNESDAY'|'THURSDAY'|'FRIDAY'|'SATURDAY'|'SUNDAY';

export interface EmploiDuTempsResponse {
    id: string; etablissementId: string;
    classeId: string; classeLibelle: string;
    matiereId: string; matiereLibelle: string;
    enseignantId: string; enseignantNom: string; enseignantPrenom: string;
    jourSemaine: JourSemaine;
    heureDebut: string;  // "HH:mm:ss"
    heureFin: string;    // "HH:mm:ss"
    anneeScolaire: string;
}
```

---

## 4. Routes câblées

```
/app/personnel                → PersonnelListe
/app/personnel/nouveau        → PersonnelForm (création)
/app/personnel/:id/editer     → PersonnelForm (édition)
/app/emploi-du-temps/classe   → EmploiDuTempsClasse (?classeId=)
/app/emploi-du-temps/enseignant → EmploiDuTempsEnseignant (?enseignantId=)
/app/emploi-du-temps/nouveau  → CreneauForm
```

---

## 5. i18n

Clés ajoutées dans `src/assets/i18n/app/fr.json` et `en.json` :

- `personnel.*` — liste, colonnes, filtres, statuts, typePersonnel, typeContrat, dialogs désactiver/réactiver, formulaire complet avec rail
- `emploiDuTemps.*` — titres vues, jours (MONDAY→SUNDAY), formulaire créneau, messages erreur (R4), dialog suppression

---

## 6. Auto-vérification F10 (7 points)

| # | Critère | Résultat |
|---|---|---|
| 1 | i18n FR + EN scope `'app'` — aucun texte en dur | ✅ |
| 2 | SUPER_ADMIN / SECRETARIAT = écriture ; ENSEIGNANT = lecture propre uniquement | ✅ |
| 3 | R10 — 409 suppression → message backend affiché (DeleteConfirmDialogComponent) | ✅ |
| 4 | R4 — 409 chevauchement → message backend affiché dans cf-r4 | ✅ |
| 5 | Désactiver/Réactiver = boutons dédiés, PAS un champ formulaire | ✅ |
| 6 | Matières masquées (DOM absent) si typePersonnel ≠ ENSEIGNANT | ✅ |
| 7 | Routes câblées — plus aucun placeholder pour ces 6 URLs | ✅ |

---

## 7. Prochains prompts

| Prompt | Dépend de |
|---|---|
| **F11** — Résultats (saisie notes R13/R21, validation, bulletins) | F10 |
| **F14** — Paie (barèmes, bulletins R17/R19, ordres de virement) | F10 |
| **F15** — Cahier de texte (offline, R20, ID client ADR-010) | F10, F11 |

### Points d'attention pour F11

- `EmploiDuTempsResponse` expose `classeId` + `matiereId` + `enseignantId` — utiles pour pré-filtrer la saisie de notes
- `PersonnelResponse.matiereIds` liste les matières d'un enseignant — s'en servir pour filtrer la vue "Mes notes à saisir"
- La grille EDT (`EdtGrille`) pourrait être réutilisée en lecture seule dans un contexte résultats si nécessaire

### Points d'attention pour F14 (Paie)

- R17 : VACATAIRE = pas de salaire fixe → le champ `salaireBase` est optionnel, traité différemment en paie
- `PersonnelResponse.salaireBase` + `indemniteTransport` sont les seuls champs de rémunération actuellement — F14 devra probablement consulter un endpoint dédié barèmes
- `PersonnelService.desactiver()` / `reactiver()` : un personnel inactif ne devrait pas figurer dans un bulletin de paie — vérifier côté backend si l'endpoint de génération paie le filtre déjà

---

## 8. Fichiers modifiés / créés (liste complète)

```
src/app/core/services/personnel.service.ts          CREATED
src/app/core/services/emploi-du-temps.service.ts    CREATED
src/app/shared/components/gescol-table.component.ts MODIFIED
src/app/pages/app/personnel/personnel-liste.ts       CREATED
src/app/pages/app/personnel/personnel-form.ts        CREATED
src/app/pages/app/emploi-du-temps/edt-grille.ts      CREATED
src/app/pages/app/emploi-du-temps/emploi-du-temps-classe.ts     CREATED
src/app/pages/app/emploi-du-temps/emploi-du-temps-enseignant.ts CREATED
src/app/pages/app/emploi-du-temps/creneau-form.ts   CREATED
src/app.routes.ts                                    MODIFIED (6 routes)
src/assets/i18n/app/fr.json                         MODIFIED (+personnel, +emploiDuTemps)
src/assets/i18n/app/en.json                         MODIFIED (+personnel, +emploiDuTemps)
docs/ROADMAP.md                                      MODIFIED (F10 → ✅)
```
