# PROMPT_F06 — Handoff : Données réelles Espace Parent

## Objectif accompli

Remplacement de toutes les données statiques factices de l'Espace Parent et de la fiche élève (App interne) par de vrais appels API.

---

## Parties complétées

### PARTIE 1 — ParentDashboardService (`src/app/core/services/parent-dashboard.service.ts`)

Service créé avec toutes les interfaces et méthodes :

| Méthode | Endpoint | Retour |
|---|---|---|
| `getMesEnfants()` | `GET /api/parent/mes-enfants` | `Observable<EnfantResponse[]>` |
| `getSuivi(eleveId)` | `GET /api/parent/eleves/{id}/suivi` | `Observable<SuiviEleveResponse>` |
| `getHistoriqueVersements(eleveId)` | `GET /api/finances/versements/eleve/{id}` | `Observable<PageResponse<VersementResponse>>` |
| `downloadQuittancePdf(versementId)` | `GET /api/finances/quittances/{id}/pdf` | `Observable<Blob>` |

Interfaces exportées : `EnfantResponse`, `SuiviEleveResponse`, `MoyenneResponse`, `SanctionResponse`, `VersementResponse`, `SoldeResponse`.

---

### PARTIE 2 — parent-dashboard.ts (`src/app/pages/parent/dashboard/parent-dashboard.ts`)

Réécriture complète. Patterns clés :

**Machine d'état enfants (chargement unique) :**
```typescript
private childrenState = toSignal(
    this.parentService.getMesEnfants().pipe(
        catchError(() => of('error' as const))
    )
    // undefined=loading | 'error'=réseau | EnfantResponse[]=données
);
```

**Sélection auto du 1er enfant via `effect()` :**
```typescript
effect(() => {
    const cs = this.childrenState();
    if (Array.isArray(cs) && cs.length > 0 && !this.selectedEleveId()) {
        this.selectedEleveId.set(cs[0].eleveId);
    }
});
```

**Suivi/historique réactifs sur changement d'enfant :**
```typescript
private suiviState = toSignal<SuiviEleveResponse | 'error'>(
    toObservable(this.selectedEleveId).pipe(
        filter(id => !!id),
        switchMap(id => this.parentService.getSuivi(id).pipe(
            catchError(() => of('error' as const))
        ))
    )
);
```

**Heuristique filière (sousSysteme absent dans EnfantResponse) :**
```typescript
private inferTrack(classeLibelle: string): 'fr' | 'en' {
    const l = classeLibelle.toLowerCase();
    return l.startsWith('form') || l.includes('sixth') || l.includes('upper') || l.includes('lower')
        ? 'en' : 'fr';
}
```
UX uniquement — pas une règle métier. Le vrai sous-système vient de `SuiviEleveResponse` si disponible.

**4 états extérieurs dans le template :**
- `childrenLoading()` → spinner
- `childrenError()` → bloc erreur + bouton recharger
- `enfants().length === 0` → état vide + CTA inscription
- sinon → tableau de bord normal

---

### PARTIE 3 — Téléchargement PDF quittance

**Dans dashboard :** bouton par ligne d'historique, `pdfLoading = signal<string | null>(null)` pour tracker l'id en cours.

**Dans quittance.ts** (`src/app/pages/parent/quittance/quittance.ts`) : lecture du paramètre de route `versementId`, même pattern blob.

**Pattern blob sécurisé (ne jamais mettre le JWT en URL) :**
```typescript
downloadPdf(versementId: string): void {
    this.parentService.downloadQuittancePdf(versementId).pipe(
        take(1), catchError(() => of(null))
    ).subscribe(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quittance-${versementId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}
```

**Route ajoutée dans `src/app.routes.ts` :**
```typescript
{ path: 'quittance/:versementId', loadComponent: () => import('@/app/pages/parent/quittance/quittance').then(c => c.Quittance) }
```

---

### PARTIE 4 — fiche-eleve.ts (`src/app/pages/app/fiche-eleve/fiche-eleve.ts`)

Réécriture complète. STUDENTS statiques supprimés (déjà retirés de `parent.data.ts`).

**Recherche asynchrone avec debounce :**
- `toObservable(query)` → `debounceTime(300)` → `distinctUntilChanged`
- Pour `q.length >= 2` : deux requêtes parallèles `forkJoin([GET /api/eleves?nom=q, GET /api/eleves?matricule=q])`
- Merge côté client + déduplication par `id` → 5 résultats max
- `startWith({ kind: 'searching' })` pour état intermédiaire

**Machine d'état détail (sans `initialValue`) :**
```typescript
private readonly detailRaw = toSignal<DetailState>(
    toObservable(this.selectedId).pipe(
        switchMap(id => {
            if (!id) return of({ kind: 'none' as const });
            return forkJoin([
                this.http.get<EleveResponse>(`/api/eleves/${id}`),
                this.http.get<SoldeResponse>(`/api/finances/eleves/${id}/solde`).pipe(
                    catchError(() => of(null))
                )
            ]).pipe(
                map(([eleve, solde]) => ({ kind: 'found' as const, eleve, solde })),
                catchError(() => of({ kind: 'error' as const })),
                startWith({ kind: 'loading' as const })
            );
        })
    )
    // Pas d'initialValue → Signal<DetailState | undefined>
);

// Computed public pour le template
readonly detail = computed<DetailState>(() => this.detailRaw() ?? { kind: 'none' as const });
```

**Règle : pas d'`initialValue` non-`undefined`/`null` avec `toSignal` sans `requireSync: true`.**
Utiliser un `computed` intermédiaire pour fournir la valeur par défaut.

**Formatage des champs API :**
- `sexe`: `'M'` → `'Masculin'`, `'F'` → `'Féminin'`
- `groupeSanguin`: `'O_POS'` → `'O+'`, `'A_NEG'` → `'A-'`, `'INCONNU'` → `'—'`
- `naissance`: `new Date(date + 'T00:00:00').toLocaleDateString('fr-FR')` + lieu si présent
- `sousSysteme`: `!== 'ANGLOPHONE'` → francophone

**Solde**: `GET /api/finances/eleves/{id}/solde` en `catchError(() => of(null))` — si l'utilisateur n'a pas accès (403) ou si pas de taux configuré, le bloc solde est masqué.

---

## Données statiques retirées

| Fichier | Supprimé |
|---|---|
| `src/app/data/parent.data.ts` | `KIDS`, `STUDENTS`, interfaces `KidInfo`, `StudentInfo` |
| Gardé dans `parent.data.ts` | `formatXAF()`, `buildQrCells()` |

---

## Clés i18n ajoutées

### `src/assets/i18n/parent/fr.json` et `en.json`
- `dashboard.chargement`, `dashboard.erreur.*`, `dashboard.aucunEnfant.*`
- `dashboard.suivi.chargement`, `dashboard.suivi.erreur`
- `dashboard.historique.quittance/telecharger/enCours/aucun/statutValide/statutAttente/statutRejete`
- `quittance.bouton.enCours`

### `src/assets/i18n/app/fr.json` et `en.json`
- `fiche.recherche.chargement`, `fiche.recherche.erreur`
- `fiche.chargement`, `fiche.erreur`

---

## Décisions techniques

**STUDENTS était dans `parent.data.ts`** alors qu'il concerne l'App interne. Retiré sans déplacer — le composant `fiche-eleve` utilise maintenant l'API directement sans passer par un fichier de données statiques. Signalé comme anomalie de classification : les données élèves (App interne) ne devraient pas résider dans un fichier nommé `parent.data.ts`.

**Pas de `EleveService` créé** — le prompt ne l'exigeait pas et le composant est self-contained. Si d'autres composants appellent `/api/eleves`, créer un `EleveService` partagé à ce moment-là.

---

## Vérification

```bash
# Build sans erreur TS
ng build

# Navigation à tester
/app/fiche-eleve
  → taper 2+ caractères → suggestions apparaissent (ou spinner)
  → cliquer suggestion → fiche s'affiche
  → bloc solde visible si API finances répond, masqué sinon

/parent
  → si PARENT connecté : liste enfants, suivi, historique, bouton PDF
  → PDF téléchargé sans JWT dans l'URL
```
