# HANDOFF F08 — App interne : menu complet, composants réutilisables, module Élèves

## État à la fin de ce prompt

PROMPT_F08 **terminé** : menu complet reconstruit, 2 composants partagés créés, module Élèves
(liste + CRUD) fonctionnel. Build propre, aucune erreur TypeScript/Angular.

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `src/app/core/services/eleve.service.ts` | Créé — EleveService + interfaces |
| `src/app/shared/components/gescol-table.component.ts` | Créé — table générique |
| `src/app/shared/components/delete-confirm-dialog.component.ts` | Créé — dialog suppression |
| `src/app/pages/app/eleves/eleve-liste.ts` | Créé — liste + recherche + actions |
| `src/app/pages/app/eleves/eleve-form.ts` | Créé — formulaire création/édition |
| `src/app/layout/components/app.menu.ts` | Réécrit — menu complet par rôle |
| `src/app.routes.ts` | Étendu — routes élèves + tous les placeholders |
| `src/assets/i18n/app/fr.json` | Réécrit — menu + table + eleves + eleveForm |
| `src/assets/i18n/app/en.json` | Réécrit — idem en anglais |

---

## PARTIE 1 — Menu complet

`app.menu.ts` reconstruit de zéro. Structure per-rôle via méthodes privées `sectionEleves(role)`,
`sectionParametrage()`, etc. — chaque méthode filtre ses items selon le rôle, puis `buildMenu()`
les assemble avec des séparateurs.

**Retraits explicites** (entrées incorrectes supprimées) :
- `inscriptions` comme sous-item des Élèves
- `scolarite` + `quittances` comme sous-items de Finances
- `vitrine` comme sous-item de Communication
- `emploisDuTemps` comme sous-item de Paramétrage

**Nouvelles sections avec sous-menus complets** :
- **Paramétrage** (8 items) : Classes, Trimestres & séquences, Taux, Quotas, Matières, Coefficients, Niveaux, Modèles lettre
- **Personnel** : Liste + Nouveau (filtré SUPER_ADMIN/SECRETARIAT)
- **Emploi du temps** : Par classe, Par enseignant, Nouveau créneau (filtré)
- **Résultats** : Saisie (ENSEIGNANT/SUPER_ADMIN), Validation (SUPER_ADMIN), Bulletins
- **Discipline** : Sanctions, Bons de sortie (SECRETARIAT/SUPER_ADMIN), Règles (SUPER_ADMIN)
- **Finances** : Versements, Validations bancaires, Moratoires, Alertes, États
- **Paie** : Barèmes (SUPER_ADMIN), Bulletins de paie
- **Cahier de texte** : Ma progression, Consultation, Validation (SUPER_ADMIN)
- **Communication** : Actualités, Calendrier, Contenu, Équipe pédagogique

Toutes les routes de ces sections pointent vers `Placeholder` — seules les routes Élèves ont du
vrai contenu dans ce prompt.

---

## PARTIE 2 — Composants réutilisables

### 2.1 `GescolTableComponent` — `src/app/shared/components/gescol-table.component.ts`

**Usage :**
```typescript
// Dans le composant parent :
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';

columns: ColDef[] = [
    { field: 'nom',       header: t('eleves.colonnes.nom'), sortable: true },
    { field: 'matricule', header: t('eleves.colonnes.matricule'), width: '130px' },
    { field: 'dateNaissance', header: t('...'), date: true, sortable: false }
];
data = signal<PageResponse<EleveResponse> | 'error' | undefined>(undefined);
```

```html
<gescol-table
    #tableRef
    [columns]="columns"
    [data]="data()"
    [pageSize]="20"
    [showView]="true"
    [showEdit]="canEdit"
    [showDelete]="canDelete"
    (load)="onLoad($event)"
    (view)="onView($event)"
    (edit)="onEdit($event)"
    (delete)="onDelete($event)"
></gescol-table>
```

**API :**
| Input | Type | Défaut | Rôle |
|---|---|---|---|
| `columns` | `ColDef[]` | `[]` | Définition des colonnes (voir interface) |
| `data` | `PageResponse<any> \| 'error' \| undefined` | `undefined` | `undefined` = chargement, `'error'` = erreur, sinon affiché |
| `pageSize` | `number` | `20` | Taille de page |
| `showView` | `boolean` | `false` | Afficher le bouton "Voir" |
| `showEdit` | `boolean` | `true` | Afficher "Modifier" |
| `showDelete` | `boolean` | `true` | Afficher "Supprimer" |

**Interface `ColDef` :**
```typescript
interface ColDef {
    field: string;      // nom de la propriété dans l'objet ligne
    header: string;     // libellé déjà traduit par le parent
    sortable?: boolean; // true = pSortableColumn actif (whitelist tri backend)
    width?: string;     // ex. '130px'
    date?: boolean;     // affiche via date pipe 'dd/MM/yyyy'
}
```

**Interface `GescolLoadEvent` :**
```typescript
interface GescolLoadEvent { page: number; size: number; sort: string; /* 'nom,asc' */ }
```

**Pagination reset :** appeler `this.tableRef.resetPage()` depuis le parent après changement de
filtres — la méthode appelle `dt.reset()` (PrimeNG Table reset) qui repasse en page 1 et réémet
l'événement `(load)`.

**Clés i18n requises (scope `app`) :**
```
app.table.actions, app.table.voir, app.table.modifier, app.table.supprimer,
app.table.aucun, app.table.erreur, app.table.pageReport
```

---

### 2.2 `DeleteConfirmDialogComponent` — `src/app/shared/components/delete-confirm-dialog.component.ts`

**Usage :**
```typescript
// Dans le parent :
deleteVisible = false;
deleteLabel = '';
deleteFn: () => Observable<void> = () => NEVER;

onDeleteRequest(row: EleveResponse): void {
    this.deleteLabel = `${row.prenom} ${row.nom}`;
    this.deleteFn = () => this.eleveService.supprimer(row.id);
    this.deleteVisible = true;
}
onDeleted(): void {
    this.deleteVisible = false;
    this.tableRef.resetPage(); // rafraîchir la liste
}
```

```html
<gescol-delete-confirm-dialog
    [(visible)]="deleteVisible"
    [itemLabel]="deleteLabel"
    [deleteFn]="deleteFn"
    (deleted)="onDeleted()"
></gescol-delete-confirm-dialog>
```

**Comportement 409 :** si le backend renvoie HTTP 409, le message `err.error.message` (format
CONVENTIONS.md) est affiché **tel quel** dans le dialog — ex. *"Impossible de supprimer : des
versements existent pour cet élève"*. L'utilisateur comprend sans message générique.

**Clés i18n requises :**
```
app.deleteDialog.titre, app.deleteDialog.message (param: label),
app.deleteDialog.annuler, app.deleteDialog.confirmer, app.deleteDialog.erreurGenerale
```

---

### 2.3 Convention de formulaire (pas un composant — à suivre pour F09+)

Formulaires de création/édition dans l'app interne :

**Structure :**
```html
<div class="card">
    <!-- En-tête avec bouton retour + titre -->
    <div class="flex items-center gap-3 mb-5">
        <button pButton icon="pi pi-arrow-left" class="p-button-text p-button-secondary" ...>
        <h2 class="text-xl font-semibold m-0">{{ t('...titreCreation/Edition') }}</h2>
    </div>

    <p-fluid>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Champ obligatoire : -->
            <div class="flex flex-col gap-1">
                <label class="font-semibold text-sm">{{ t('...champ') }} <span class="text-red-500">*</span></label>
                <input pInputText formControlName="..." />
                @if (f['champ'].invalid && f['champ'].touched) {
                    <small class="text-red-500">{{ t('...validation.requis') }}</small>
                }
            </div>
        </div>
    </p-fluid>

    <!-- Erreur API après soumission -->
    @if (saveError()) {
        <div class="mt-4">
            <p-message severity="error" [text]="saveError()!"></p-message>
        </div>
    }

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6">
        <button pButton type="button" class="p-button-text p-button-secondary" [disabled]="saving()" ...>Annuler</button>
        <button pButton type="submit" [loading]="saving()" ...>Enregistrer</button>
    </div>
</div>
```

**Règles :**
- 2 colonnes sur desktop (`grid-cols-2`), 1 colonne sur mobile (`grid-cols-1`)
- Champs obligatoires : `*` rouge en label + message de validation si `touched && invalid`
- Erreur API : `p-message severity="error"` avec le message réel backend (ou i18n fallback)
- Entités simples (Paramétrage F09) → **dialog** (pas page dédiée)
- Entités complexes (Élève, Personnel) → **page dédiée** (formulaire complet)

---

## PARTIE 3 — EleveService

`src/app/core/services/eleve.service.ts` — 5 méthodes :
```typescript
rechercher(params, page, size, sort): Observable<PageResponse<EleveResponse>>  // GET /api/eleves
getById(id): Observable<EleveResponse>                                          // GET /api/eleves/{id}
creer(data): Observable<EleveResponse>                                          // POST /api/eleves
modifier(id, data): Observable<EleveResponse>                                   // PUT /api/eleves/{id}
supprimer(id): Observable<void>                                                 // DELETE /api/eleves/{id}
```

`PageResponse<T>` et toutes les interfaces (`EleveResponse`, `EleveRequest`, `EleveSearchParams`)
sont exportées depuis ce service.

**Migration de fiche-eleve.ts :** reportée. `fiche-eleve.ts` utilise encore HttpClient directement.
La migration sera faite en F09 ou en passant ultérieurement. Non bloquant.

---

## PARTIE 4 — Liste des élèves

Route : `/app/eleves` → `EleveListe`

- Filtres : nom, prénom, matricule, classe (form `FormsModule` simple — pas reactive)
- Bouton "Nouvel élève" visible uniquement pour SUPER_ADMIN et SECRETARIAT
- Tableau via `GescolTableComponent` avec 6 colonnes (matricule, nom, prénom, classe, sexe, dateNaissance)
- Colonnes triables : `nom` uniquement (sort whitelist backend : `nom`, `matricule`)
- Actions par ligne : Voir (→ `/app/fiche-eleve`), Modifier (→ `/app/eleves/:id/editer`), Supprimer
- Suppression via `DeleteConfirmDialogComponent` avec message 409 réel

---

## PARTIE 5 — Formulaire élève

Route `/app/eleves/nouveau` et `/app/eleves/:id/editer` → `EleveForm` (même composant, mode détecté via route param)

**15 champs :**
| Champ | Type | Obligatoire | Composant PrimeNG |
|---|---|---|---|
| nom | text | Oui | `pInputText` |
| prenom | text | Oui | `pInputText` |
| sexe | enum M/F | Oui | `p-select` |
| dateNaissance | date passée | Oui | `p-datepicker` |
| lieuNaissance | text | Non | `pInputText` |
| classeId | select API | Oui | `p-select` (filtre) |
| redoublant | bool | Non (def. false) | `p-checkbox` |
| sousSysteme | enum | Non | `p-select` |
| apteSport | bool | Non (def. true) | `p-checkbox` |
| groupeSanguin | enum | Non | `p-select` |
| nomPere | text | Non | `pInputText` |
| nomMere | text | Non | `pInputText` |
| quartier | text | Non | `pInputText` |
| personneContact | text | Non | `pInputText` |
| telephoneContact | text | Non | `pInputText` |

**Matricule** : affiché en lecture seule en mode édition (généré par le backend R1, jamais dans le formulaire).

**Classes** : chargées via `GET /api/classes?page=0&size=200&sort=libelle,asc` au `ngOnInit()`.

**Format dateNaissance** : `Date` → `YYYY-MM-DD` (ISO-8601) via `toLocaleDateString` inversé —
voir méthode `formatDate()` dans le composant.

---

## PARTIE 6 — i18n

Nouvelles clés ajoutées dans `src/assets/i18n/app/{fr,en}.json` :
- `app.menu.*` — menu complet (toutes sections)
- `app.table.*` — composant table générique
- `app.deleteDialog.*` — dialog de suppression
- `app.eleves.*` — liste (titre, filtres, colonnes)
- `app.eleveForm.*` — formulaire (labels, validation, erreurs)
- `app.fiche.*` — conservé tel quel (fiche-eleve.ts inchangé)

---

## Tests manuels recommandés

- **SUPER_ADMIN** : menu complet (11 sections visibles avec sous-menus)
- **SECRETARIAT** : menu réduit (Élèves + Personnel + EDT + Résultats + Discipline + Finances + Cahier)
- **ECONOMAT** : Élèves (liste) + Personnel + Finances + Paie
- **ENSEIGNANT** : Élèves (liste) + EDT + Résultats + Discipline + Cahier
- **COMMUNICATION** : Dashboard + Communication uniquement
- Liste élèves : recherche par nom → pagination correcte → tri colonne "Nom"
- Création élève → matricule visible dans la fiche après
- Suppression d'un élève avec versements → dialog affiche le vrai message backend 409
- Bascule FR↔EN sur liste et formulaire

---

## Convention établie (à suivre pour F09+)

> **Formulaires simples (entités Paramétrage)** → dialog PrimeNG compact  
> **Formulaires complexes (Élève, Personnel)** → page dédiée avec route propre

---

## Notes et points de vigilance

- `GescolTableComponent.resetPage()` appelle `dt.reset()` (PrimeNG Table) qui efface aussi le tri —
  comportement attendu sur un reset après filtre. Si F09 a besoin de préserver le tri, il faudra
  affiner (conserver `currentSort` manuellement côté parent).
- Le "Voir" depuis la liste navigue vers `/app/fiche-eleve` sans pré-sélectionner l'élève — la
  fiche-eleve a sa propre recherche. Un deep-link (query param `?id=`) est envisageable en F09
  si jugé utile.
- `fiche-eleve.ts` n'est pas migré sur EleveService — reporté, non bloquant.
