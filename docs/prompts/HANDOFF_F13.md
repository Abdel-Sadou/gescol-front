# HANDOFF — F13 Finances

## Auto-vérification (8 points)

### 1. Conformité des champs avec API_CONTRACT.md

Tous les endpoints vérifiés avant codage :

| Endpoint | Champs clés vérifiés |
|---|---|
| `POST /api/finances/versements` | `eleveId`, `montant`, `modePaiement`, `numeroRecuBancaire`, `nomSignataireBancaire` |
| `GET /api/finances/versements/eleve/{id}` | PageResponse, `statutValidation`, `numeroQuittance`, `motifRejet` |
| `GET /api/finances/eleves/{id}/solde` | `tauxScolarite`, `totalVerse`, `soldeRestant` |
| `GET /api/finances/versements/en-attente-validation` | Liste plate (non paginée), `numeroRecuBancaire`, `nomSignataireBancaire`, `declareParId` |
| `PUT /api/finances/versements/{id}/valider` | Corps `{}` |
| `PUT /api/finances/versements/{id}/rejeter` | Corps `{ motifRejet: string }` — **obligatoire** |
| `GET /api/finances/quittances/{id}/pdf` | `{ responseType: 'blob' }`, pas de paramètre dans l'URL |
| `POST /api/finances/moratoires` | `eleveId`, `dateProposee` (ISO YYYY-MM-DD), `motif?` |
| `GET /api/finances/moratoires/en-attente` | Liste plate, `eleveRedoublant` boolean |
| `PATCH /api/finances/moratoires/{id}/valider` | Corps `null` (pas de `@RequestBody`) |
| `PATCH /api/finances/moratoires/{id}/refuser` | Corps `null` — pas de motif requis (≠ rejet versement) |
| `GET /api/finances/moratoires/historique` | Param optionnel `?statut=` |
| `GET /api/finances/alertes/retards` | `eleveId`, `nom`, `prenom`, `matricule`, `classeLibelle`, `soldeRestant` |
| `POST /api/finances/alertes/declencher` | Retourne `{ notificationsEnvoyees: number }` |
| `GET/PUT /api/finances/alertes/seuil` | `{ nombreJoursAvantAlerte: number }` |
| `GET /api/finances/etats/classe/{id}/versements` | `montantScolarite`, `totalVerse`, `soldeRestant` (pas de pagination) |
| `GET /api/finances/etats/totaux` | `?dateDebut=&dateFin=`, retourne `totalVerse` + `nombreVersements` |

**Point ambigu détecté** : `GET /api/finances/versements/en-attente-validation` — non documenté comme paginé ou non-paginé dans API_CONTRACT.md. Choix fait : liste plate `VersementResponse[]` (cohérent avec le pattern des autres listes "en attente" du module). Si paginé côté backend, à corriger en `PageResponse<VersementResponse>`.

### 2. Numéro de reçu bancaire ET signataire clairement visibles ✅

Dans `validations-bancaires.ts` : le bas de chaque carte affiche en fond jaune `#fffbeb` deux cellules distinctes avec labels orange "À COMPARER AVEC LE RELEVÉ BANCAIRE RÉEL" — non tronquées, `word-break: break-all`. Ces deux valeurs sont aussi rappelées intégralement dans le dialog de confirmation.

### 3. Confirmation R18 mentionne explicitement la vérification humaine ✅

Texte exact du dialog (clé `r18Avertissement`) :
> "En cliquant sur Confirmer, vous attestez avoir vérifié ces informations sur le relevé bancaire réel de l'établissement. Cette action est irréversible et crédite immédiatement le solde de l'élève."

Aucune phrase ne suggère une vérification automatique.

### 4. Rejet impossible sans motif ✅

Dans `validations-bancaires.ts`, `confirmerRejet()` : `showMotifError.set(true)` en premier, retour immédiat si `!motifRejet.trim()`. Champ marqué `p-invalid`, message d'erreur affiché sous le textarea.

### 5. Tri redoublants-en-premier des moratoires respecté ✅

Dans `moratoires.ts`, `enAttente()` est affiché tel quel depuis le backend (`this.enAttente.set(list)`) — aucun `sort()` ou `orderBy` côté client. Badge "Redoublant" affiché sur chaque ligne `eleveRedoublant === true` pour rendre la priorité visible (pas juste implicite dans l'ordre).

### 6. Texte "Déclencher alertes" fidèle à l'état réel ✅

Clé `dialogNote` :
> "Note : actuellement, cette action génère une entrée dans le journal du serveur. L'envoi réel de notifications (e-mail, SMS) sera activé dans une version ultérieure."

Aucune mention de "SMS" ou "e-mail" dans le bouton déclencheur.

### 7. Aucun texte français en dur ✅

Tous les textes passent par Transloco `t('app.finances.*')`. Vérification : aucune chaîne française codée en dur dans les 5 composants.

### 8. Routes conformes ✅

```
/app/finances/versements   → Versements
/app/finances/validations  → ValidationsBancaires
/app/finances/moratoires   → Moratoires
/app/finances/alertes      → Alertes
/app/finances/etats        → Etats
```
Toutes les 5 routes remplacent les placeholders dans `app.routes.ts`.

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `src/app/core/services/finances.service.ts` | Créé — service + interfaces complètes |
| `src/app/pages/app/finances/versements.ts` | Créé |
| `src/app/pages/app/finances/validations-bancaires.ts` | Créé |
| `src/app/pages/app/finances/moratoires.ts` | Créé |
| `src/app/pages/app/finances/alertes.ts` | Créé |
| `src/app/pages/app/finances/etats.ts` | Créé |
| `src/app.routes.ts` | 5 routes finances → composants réels |
| `src/assets/i18n/app/fr.json` | Section `finances.*` + `commun.annuler` ajoutées |
| `src/assets/i18n/app/en.json` | Section `finances.*` + `commun.annuler` ajoutées |
| `docs/ROADMAP.md` | F13 marqué ✅ Fait |

---

## Décisions à documenter

Aucune nouvelle décision d'architecture structurante n'a émergé pour ce module — les patterns existants (OnPush, signals, Transloco scope `app`, PrimeNG, blob PDF) ont tous été réutilisés.
