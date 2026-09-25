# HANDOFF — F11 : Résultats (saisie, validation, bulletins)

**Date :** 2026-09-04  
**Statut :** ✅ Complet — build propre, 0 erreur TypeScript, 0 warning Angular

---

## Auto-vérification (7 points)

| # | Critère | Résultat |
|---|---|---|
| 1 | Champs conformes à API_CONTRACT.md pour les 4 endpoints | ✅ — `classeId/matiereId/sequenceId` (GET notes), `matiereId/sequenceId/notes[]` (POST lot), `noteIds[]` (PUT valider), `eleveId/sequenceId` (GET moyennes) |
| 2 | ENSEIGNANT ne voit en saisie que ses propres combinaisons classe/matière | ✅ — `NoteSelecteur.loadEnseignantClasses()` appelle `getByEnseignant(personnelId)`, construit les paires distinctes (classeId, matiereId) réellement enseignées, le dropdown matière se filtre au changement de classe |
| 3 | Une note VALIDEE est bien en lecture seule sur l'écran de saisie | ✅ — `@if (row.statut === 'VALIDEE')` affiche la valeur + badge, aucun `p-inputnumber`. `POST /lot` n'inclut que les lignes `!== 'VALIDEE'` |
| 4 | ENSEIGNANT sans classe en professeur principal → état vide explicite sur validation | ✅ — `NoteSelecteur.loadProfPrincipalClasses()` : si `profClasses.length === 0`, `showEmptyProfPrincipal.set(true)` → message i18n, pas de liste cassée |
| 5 | Téléchargement bulletin : aucun token dans l'URL | ✅ — `getBulletinPdf()` utilise `{ responseType: 'blob' }` ; le JWT passe dans `Authorization: Bearer` via l'intercepteur HTTP. URL créée via `URL.createObjectURL(blob)`, révoquée immédiatement après le clic |
| 6 | Aucun texte français en dur | ✅ — tout via `t('resultats.saisie.*')`, `t('resultats.validation.*')`, `t('resultats.bulletins.*')`, `t('resultats.selecteur.*')` |
| 7 | Routes conformes à PAGES_ET_NAVIGATION.md §2 | ✅ — `/app/resultats/saisie`, `/app/resultats/validation`, `/app/resultats/bulletins` câblées avec lazy loading |

---

## 1. Fichiers produits

| Fichier | Rôle |
|---|---|
| `src/app/core/services/resultats.service.ts` | Service : `getNotesByClasseMatiereSequence`, `saisirEnLot`, `validerNotes`, `getMoyennesEleve`, `getBulletinPdf` |
| `src/app/pages/app/resultats/note-selecteur.ts` | Sélecteur partagé Saisie/Validation : SUPER_ADMIN = choix libre, ENSEIGNANT = filtré EDT (saisie) ou professeurPrincipalId (validation) |
| `src/app/pages/app/resultats/saisie-notes.ts` | Grille éditable, notes VALIDEE en lecture seule, POST /lot |
| `src/app/pages/app/resultats/validation-notes.ts` | Grille lecture, checkboxes, tout sélectionner, PUT /valider, R21 handling |
| `src/app/pages/app/resultats/bulletins.ts` | Recherche élève (debounce 350ms), séquence, aperçu moyennes, PDF blob download |

---

## 2. Architecture & décisions

### NoteSelecteur — mode `'saisie'` vs `'validation'`

Le `@Input() mode` détermine le comportement à l'init :

- `mode='saisie'` + ENSEIGNANT → `loadEnseignantClasses()` : appelle `getByEnseignant(personnelId)`, déduit les paires `(classeId, matiereId)` distinctes réellement dans son EDT. Filtrage matière live au changement de classe.
- `mode='validation'` + ENSEIGNANT → `loadProfPrincipalClasses()` : filtre `ClasseResponse[]` sur `professeurPrincipalId === personnelId`. Si vide → `showEmptyProfPrincipal = true`.
- SUPER_ADMIN / SECRETARIAT : charge toutes les classes ET toutes les matières (choix libre).

### Grille notes — R13 (note VALIDEE immuable)

`SaisieNotes` n'envoie au POST `/lot` que les lignes dont `statut !== 'VALIDEE'`. Les lignes VALIDEE sont affichées valeur + badge, sans `p-inputnumber` (pas dans le DOM, pas juste `disabled`).

### Validation — R21 (fail-closed)

`ValidationNotes` intercepte tout 409/4xx sur `PUT /valider` et affiche le message backend réel dans un bloc stylisé orange (`.vn-r21`). Le sélecteur ne propose qu'une classe à la fois, donc le cas R21 multi-classe est théoriquement impossible depuis cet UI — géré quand même.

### Bulletin PDF — pattern blob

```typescript
getBulletinPdf(eleveId, sequenceId): Observable<Blob> {
    return this.http.get(`/api/resultats/bulletins/${eleveId}/sequence/${sequenceId}/pdf`,
        { responseType: 'blob' });
}
// Dans Bulletins.downloadPdf():
const url = URL.createObjectURL(blob);
const a   = document.createElement('a');
a.href    = url; a.download = `bulletin_${matricule}_${seqId}.pdf`; a.click();
URL.revokeObjectURL(url);
```

Token jamais dans l'URL — il passe dans `Authorization` via l'intercepteur.

### Recherche élève (Bulletins) — debounce 350ms

`setTimeout` de 350ms sur `ngModelChange` pour éviter un appel par frappe. Réutilise `EleveService.rechercher()` existant.

---

## 3. Interfaces clés

```typescript
// resultats.service.ts
export type StatutNote = 'BROUILLON' | 'VALIDEE';
export interface NoteResponse {
    id: string; eleveId: string; eleveNom: string; elevePrenom: string;
    eleveMatricule: string; matiereId: string; matiereLibelle: string;
    sequenceId: string; sequenceLibelle: string; valeur: number;
    statut: StatutNote; saisieParId: string | null;
    dateCreation: string; dateModification: string | null;
}
export interface NoteLotRequest {
    matiereId: string; sequenceId: string;
    notes: { eleveId: string; valeur: number }[];
}
export interface ValiderNotesRequest { noteIds: string[]; }
export interface MoyennesResponse {
    eleveId: string; sequenceId: string;
    details: { matiereId: string; matiereLibelle: string; note: number|null; coefficient: number }[];
    moyenneGenerale: number | null;
}

// note-selecteur.ts
export interface SelecteurResult {
    classeId: string; classeLibelle: string;
    matiereId: string; matiereLibelle: string;
    sequenceId: string; sequenceLibelle: string;
}
```

---

## 4. Routes câblées

```
/app/resultats/saisie     → SaisieNotes
/app/resultats/validation → ValidationNotes
/app/resultats/bulletins  → Bulletins
```

---

## 5. i18n

Clés ajoutées dans `src/assets/i18n/app/fr.json` et `en.json` :

- `resultats.selecteur.*` — labels des 3 dropdowns + état vide prof principal
- `resultats.saisie.*` — titre, colonnes, badge VALIDEE, bouton, états
- `resultats.validation.*` — titre, colonnes, compteur, bouton, états
- `resultats.bulletins.*` — titre, filtres, colonnes moyennes, bouton PDF, états

---

## 6. Fichiers modifiés / créés

```
src/app/core/services/resultats.service.ts              CREATED
src/app/pages/app/resultats/note-selecteur.ts           CREATED
src/app/pages/app/resultats/saisie-notes.ts             CREATED
src/app/pages/app/resultats/validation-notes.ts         CREATED
src/app/pages/app/resultats/bulletins.ts                CREATED
src/app.routes.ts                                        MODIFIED (3 routes placeholder → vrais composants)
src/assets/i18n/app/fr.json                             MODIFIED (+resultats.*)
src/assets/i18n/app/en.json                             MODIFIED (+resultats.*)
docs/ROADMAP.md                                          MODIFIED (F11 → ✅)
```

---

## 7. Prochains prompts

| Prompt | Dépend de |
|---|---|
| **F12** — Discipline (sanctions, bons de sortie R5/R15) | F08 |
| **F13** — Finances (versements, validation bancaire R18, moratoires) | F08 |
| **F14** — Paie (barèmes, bulletins R17/R19, ordres de virement) | F10 |
| **F15** — Cahier de texte (saisie + offline, R20, ID client ADR-010) | F10, F11 |
