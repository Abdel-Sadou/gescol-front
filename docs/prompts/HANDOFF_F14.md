# HANDOFF — F14 Paie

## Auto-vérification (8 points)

### 1. Conformité des champs avec API_CONTRACT.md

Tous les endpoints vérifiés avant codage :

| Endpoint | Champs clés vérifiés |
|---|---|
| `GET /api/paie/baremes` | Retourne `SpringPage<BaremePaieResponse>` (Spring natif, pas `PageResponse`) — interfaces distinctes |
| `POST /api/paie/baremes` | `typeContrat`, `tauxIRPP`, `tauxCentimesAdditionnelsIRPP`, `montantTaxeCommunale`, `tauxCreditFoncierSalarial`, `tauxCreditFoncierPatronal`, `montantRedevanceAudiovisuelle`, `tauxFNE`, `tauxPensionVieillesseSalarial`, `tauxPensionVieillessePatronal`, `tauxAllocationsFamilialesPatronal`, `tauxAccidentTravailPatronal` |
| `PUT /api/paie/baremes/{id}` | Même corps que POST |
| `DELETE /api/paie/baremes/{id}` | Aucun corps |
| `POST /api/paie/bulletins/generer` | `personnelId`, `periode` (YYYY-MM), `heuresEffectuees?`, `tauxHoraire?`, `datePaiement` (YYYY-MM-DD), `modePaiement` |
| `GET /api/paie/bulletins/personnel/{id}` | Liste plate `BulletinPaieResponse[]` (non paginée) |
| `GET /api/paie/bulletins/{id}/pdf` | `{ responseType: 'blob' }`, JWT en header Authorization uniquement |
| `GET /api/paie/bulletins/{id}/ordre-virement/pdf` | Idem |

**Point notable** : `GET /api/paie/baremes` retourne `SpringPage<T>` (Spring natif avec champs `pageable`, `first`, `last`, `numberOfElements`…) et non notre `PageResponse<T>` custom. Interface `SpringPage<T>` créée dans `paie.service.ts` pour distinguer les deux formats.

**Nom de type** : `ModePaiementPaie` (≠ `ModePaiement` du module finances) pour éviter la collision de noms entre les deux modules.

### 2. Choix du formulaire Barèmes : dialog sectionné ✅

**Décision** : dialog PrimeNG large (780 px) avec 3 zones logiques :
- Sélecteur de type de contrat (`p-selectbutton`, en tête, sans encadré)
- Section "Retenues salariales" (6 champs en grille 2 colonnes)
- Section "Charges patronales" (5 champs en grille 2 colonnes)

**Justification** : le backend impose un max de 3 barèmes (un par `TypeContrat`). Avec seulement 3 lignes en liste, une page dédiée crée un ratio contenu/navigation défavorable. Le dialog sectionné à 780 px loge les 11 champs sans scroll excessif et reste cohérent avec les patterns établis en F09-F13.

**Affichage de la liste** : cartes (pas de table) affichant les 12 taux en deux colonnes (Retenues salariales | Charges patronales) — toutes les valeurs visibles sans interaction. Badge coloré par `TypeContrat`, bordure gauche colorée par type.

### 3. `heuresEffectuees` absent du DOM si `typeContrat ≠ VACATAIRE` ✅

Dans `bulletins.ts`, les champs `heuresEffectuees` et `tauxHoraire` sont enveloppés dans :
```html
@if (genPersonnel()?.typeContrat === 'VACATAIRE') { ... }
```
`@if` retire complètement les éléments du DOM (pas juste `display:none`). Idem dans l'historique : les boutons "Ordre de virement" ne sont rendus que si `b.modePaiement === 'VIREMENT_BANCAIRE'`.

### 4. Rejet R19 affiche message clair avec lien vers édition personnel ✅

Dans `bulletins.ts`, le signal `genError` prend la valeur `'R19'` quand le backend renvoie un code R19 ou que la réponse contient les mots-clés `bancaire`/`compte` ou un status 422.

Template :
```html
@if (genError() === 'R19') {
    <div class="bp-r19-banner">
        <strong>{{ t('paie.bulletins.erreurR19') }}</strong>
        <a [routerLink]="['/app/personnel', genPersonnel()!.id, 'editer']">
            {{ t('paie.bulletins.erreurR19Lien') }}
        </a>
    </div>
}
```
Le lien pointe directement vers `/app/personnel/{id}/editer` (route F10 déjà construite).

### 5. Ordre de virement proposé uniquement pour VIREMENT_BANCAIRE ✅

Deux occurrences vérifiées :

**Dans le bloc succès** :
```html
@if (genSuccess()!.modePaiement === 'VIREMENT_BANCAIRE') {
    <button ... (click)="downloadOrdre(genSuccess()!.id)">
```

**Dans la table historique** :
```html
@if (b.modePaiement === 'VIREMENT_BANCAIRE') {
    <button ... (click)="downloadOrdre(b.id)">
```

Aucun bouton "Ordre de virement" mort pour les bulletins BILLETAGE.

### 6. SECRETARIAT exclu de toutes les routes paie ✅

**Routes** dans `app.routes.ts` :
```typescript
{ path: 'paie/baremes',   canActivate: [roleGuard(['SUPER_ADMIN', 'ECONOMAT'])], ... },
{ path: 'paie/bulletins', canActivate: [roleGuard(['SUPER_ADMIN', 'ECONOMAT'])], ... },
```
SECRETARIAT n'est pas dans la liste — il est bloqué au niveau route (pas seulement menu). La route parente `/app` autorise tous les rôles internes via `roleGuard([...INTERNAL_ROLES])`, mais les deux routes paie ont leur propre `canActivate` plus restrictif qui court-circuite la garde parente.

Écriture barèmes : `canWrite = () => this.auth.role() === 'SUPER_ADMIN'` — ECONOMAT voit mais ne peut pas créer/modifier/supprimer.

### 7. Aucun texte français en dur ✅

Tous les textes passent par Transloco `t('app.paie.*')`. Noms des mois générés via `Intl.DateTimeFormat` (réactif à la langue active) — aucune liste de mois codée en dur. Aucune chaîne française dans les composants.

### 8. Routes conformes ✅

```
/app/paie/baremes   → Baremes    (canActivate: SUPER_ADMIN + ECONOMAT)
/app/paie/bulletins → BulletinsPaie (canActivate: SUPER_ADMIN + ECONOMAT)
```
Les deux routes remplacent les placeholders dans `app.routes.ts`. Breadcrumbs : `'Barèmes'` et `'Bulletins de paie'`.

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `src/app/core/services/paie.service.ts` | Créé — service + interfaces (`SpringPage<T>`, `BaremePaieResponse/Request`, `BulletinPaieResponse/Request`, `ModePaiementPaie`, `LigneBulletin`) |
| `src/app/pages/app/paie/baremes.ts` | Créé — liste en cartes (D5 : tous les taux visibles), dialog sectionné p-selectbutton (D1-D4) |
| `src/app/pages/app/paie/bulletins.ts` | Créé — workflow 3 étapes, tous champs en signals OnPush (D6), mois via Intl (D9), DatePipe (D10), loading par ID (D11), validation champ par champ (D8), lien génération↔historique (D7) |
| `src/app.routes.ts` | 2 routes paie → composants réels |
| `src/assets/i18n/app/fr.json` | Section `paie.*` complète + `commun.chargement` |
| `src/assets/i18n/app/en.json` | Section `paie.*` complète + `commun.chargement` |
| `docs/ROADMAP.md` | F14 marqué ✅ Fait |

---

## Décisions d'architecture

**SpringPage vs PageResponse** : `GET /api/paie/baremes` retourne le type `Page<>` natif de Spring (avec `pageable`, `first`, `last`, `numberOfElements`…), différent du `PageResponse<T>` custom utilisé partout ailleurs dans le projet. Interface `SpringPage<T>` créée dans `paie.service.ts` — à ne pas fusionner avec `PageResponse<T>`.

**Affichage en cartes plutôt qu'en table** : avec un maximum de 3 barèmes et 12 champs chacun, afficher tous les taux en cartes à 2 colonnes est plus ergonomique qu'une table tronquée. Ce pattern est spécifique à baremes.ts — ne pas généraliser aux autres modules où les tables restent le bon choix.

**Ergonomie post-génération** : 13 défauts identifiés lors d'un audit ergonomique approfondi ont été corrigés dans la même session (D1-D13), notamment la correction critique du bug OnPush + propriétés mutées sans signal (D6), et la liaison dynamique entre le bloc succès et la section historique (D7).
