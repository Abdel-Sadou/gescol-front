# HANDOFF — PROMPT_F07bis : Workflow d'inscription Espace Parent

**Date :** 2026-09-01  
**Prompt :** `docs/prompts/PROMPT_F07bis_Inscription.md`  
**Statut :** Livré complet — bloqueur backend résolu, toutes les étapes implémentées

---

## Résultat de la vérification Partie 0

### Endpoint découvert dans `API_CONTRACT.md`

`GET /api/parent/inscriptions/classes-disponibles` — **PARENT** ✅

**Réponse** : `List<ClasseDisponibleResponse>` avec `classeId`, `classeLibelle`, `sousSysteme` (`FRANCOPHONE|ANGLOPHONE`), `montant`, `anneeScolaire`.

Le bloqueur signalé dans la session précédente (F07bis v1) est levé : le backend a ajouté cet endpoint. Le frontend peut maintenant remplir l'étape 2 sans contournement.

---

## Ce qui a été livré

### 1. `InscriptionService` — `src/app/core/services/inscription.service.ts`

Ajout de `ClasseDisponibleResponse` et `getClassesDisponibles()` :

| Méthode | Endpoint |
|---|---|
| `getCriteres()` | `GET /api/parent/inscriptions/criteres` |
| `getClassesDisponibles()` | `GET /api/parent/inscriptions/classes-disponibles` |
| `getModalitesPaiement(classeId)` | `GET /api/parent/inscriptions/modalites-paiement/{classeId}` |
| `reserver(matricule, classeId)` | `POST /api/parent/inscriptions/reserver` |
| `majInformationsParent(id, data)` | `PUT /api/parent/inscriptions/{id}/informations-parent` |
| `confirmer(id)` | `POST /api/parent/inscriptions/{id}/confirmer` |
| `getMesInscriptions()` | `GET /api/parent/mes-inscriptions` |
| `getLettreEngagementPdf(id)` | `GET /api/parent/inscriptions/{id}/lettre-engagement/pdf` — `responseType:'blob'` |

### 2. `NouvelleInscription` — `src/app/pages/parent/inscription/nouvelle-inscription.ts`

Stepper 5 étapes, toutes fonctionnelles. ADR-011 (zéro PrimeNG), ADR-012 (Transloco `scope:'parent'`).

| Étape | Comportement |
|---|---|
| **1 — Critères** | Affiche `texteCriteres`, checkbox d'acceptation, "Suivant" bloqué jusqu'à l'acceptation |
| **2 — Modalités** | Chargement lazy de `getClassesDisponibles()`, liste groupée Francophone/Anglophone, carte sélectionnable avec highlight vert, résumé sous la liste, "Suivant" bloqué sans sélection |
| **3 — Réservation** | Champ matricule, appel `reserver()` au clic, gestion 404 (matricule inconnu) + 409 (déjà inscrit R7), carte de succès avec nom élève une fois réservé |
| **4 — Informations parent** | 4 champs optionnels (téléphone, email, fonction, localisation), bouton "Passer" + bouton "Enregistrer et continuer", appel `majInformationsParent()` |
| **5 — Confirmation** | Récapitulatif (élève, classe, montant, année), bouton `confirmer()`, état de succès avec téléchargement lettre d'engagement (blob pattern) + lien vers "Mes inscriptions" |

**Persistance inter-étapes** : l'état est conservé dans des `signal`s du composant. Navigation "Précédent" sans perte de données. Chargement des classes lazy (une seule requête même si l'utilisateur va-et-vient entre étapes 1 et 2).

### 3. `MesInscriptions` — `src/app/pages/parent/inscription/mes-inscriptions.ts`

Inchangé par rapport à la session précédente — déjà complet.

### 4. Routes — `src/app.routes.ts`

```
/parent/inscription/nouvelle          → NouvelleInscription (lazy)
/parent/inscription/mes-inscriptions  → MesInscriptions (lazy)
```

### 5. Navigation — `src/app/shared/cobimag-base.ts`

```typescript
goNouvelleInscription = this.nav('/parent/inscription/nouvelle');
goMesInscriptions     = this.nav('/parent/inscription/mes-inscriptions');
```

### 6. Dashboard — `src/app/pages/parent/dashboard/parent-dashboard.ts`

- Bouton "+ Nouvelle inscription" (en-tête) : actif, appelle `goNouvelleInscription($event)`
- Lien "Mes inscriptions" (en-tête) : actif, appelle `goMesInscriptions($event)`
- CTA "Inscrire mon enfant" (état aucun enfant) : actif

### 7. i18n

Toutes les clés sont présentes dans `fr.json` et `en.json` :

| Préfixe | Clés |
|---|---|
| `inscription.criteres.*` | titre, description, chargement, erreur, accepter |
| `inscription.classes.*` | titre, description, chargement, erreur, francophone, anglophone, selectionne |
| `inscription.reservation.*` | titre, description, matriculeLabel, matriculePlaceholder, reserver, succes, erreur404, erreur409, erreur500 |
| `inscription.informations.*` | titre, description, telephoneLabel, emailLabel, fonctionLabel, localisationLabel, valider, passer, erreur |
| `inscription.confirmation.*` | titre, description, recapitulatif, eleve, classe, montant, annee, bouton, erreur, succes.titre/description/voirInscriptions |
| `mesInscriptions.*` | titre, erreur, aucune, commencer, reserveeLe, confirmeeLe, telechargerLettre, lettreEnCours, lettreErreur, statut.* |
| `dashboard.*` | mesInscriptions, nouvelleInscription |

---

## Tests manuels documentés

| Scénario | Comportement attendu |
|---|---|
| Parcours complet | Critères → Modalités → Réservation → Informations → Confirmation → téléchargement lettre |
| Réservation matricule inconnu | Message `inscription.reservation.erreur404` (non générique) |
| Réservation élève déjà inscrit | Message `inscription.reservation.erreur409` (R7 explicite) |
| Navigation Précédent depuis étape 3 | Retour étape 2 avec classe encore sélectionnée |
| Navigation Précédent depuis étape 4 | Retour étape 3 avec nom élève affiché |
| Étape 4 — bouton Passer | Avance à étape 5 sans appel réseau |
| Mes inscriptions — CONFIRMEE | Bouton téléchargement lettre visible |
| Mes inscriptions — RESERVEE | Pas de bouton téléchargement |

---

## Décisions à documenter

Aucune nouvelle décision d'architecture. Le bloqueur précédent est levé par le correctif backend `GET /api/parent/inscriptions/classes-disponibles`.
