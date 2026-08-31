# Audit — PAGES_ET_NAVIGATION vs état réel du code

**Périmètre comparé** : `docs/PAGES_ET_NAVIGATION.md`, `src/app.routes.ts`,
`src/app/layout/components/app.menu.ts`, `docs/backend-reference/API_CONTRACT.md`

**Date** : 2026-08-31

---

## 🔴 Incohérences API (endpoints incorrects dans PAGES_ET_NAVIGATION §2)

### 1. Moratoires — méthode HTTP incorrecte

PAGES_ET_NAVIGATION ligne 109 écrit `POST/PUT /api/finances/moratoires`, laissant
croire qu'il existe un `PUT` pour valider ou refuser. L'API_CONTRACT n'a pas de `PUT`
sur ce chemin. Les actions de transition d'état sont :

```
PATCH /api/finances/moratoires/{id}/valider
PATCH /api/finances/moratoires/{id}/refuser
```

Écrire `PUT` pour ces deux endpoints provoquera un **405 Method Not Allowed**.

**Correction** : remplacer `POST/PUT /api/finances/moratoires` par
`POST /api/finances/moratoires`, `PATCH .../valider`, `PATCH .../refuser`,
`GET /en-attente`, `GET /historique`.

---

### 2. Fiche élève — numéro de règle erroné

PAGES_ET_NAVIGATION §2 colonne Endpoints : `DELETE (R2)` pour la fiche élève.

L'API_CONTRACT Module 3 dit explicitement `409 (R7)` pour la suppression d'un élève
ayant des notes ou des versements. R2 n'est pas la bonne règle — cela peut induire en
erreur le libellé du message d'erreur UX à écrire pour F08.

**Correction** : remplacer `DELETE (R2)` par `DELETE (R7)`.

---

### 3. Validation des notes — R13 fantôme

PAGES_ET_NAVIGATION §2 : `PUT /api/resultats/notes/valider (R13/R21)`.

L'API_CONTRACT ne mentionne que R21 (professeur principal) pour cet endpoint. R13
n'y apparaît pas. Sans lire MASTER_CONTEXT, impossible de confirmer si R13 est un
doublon ou une référence obsolète.

**Action** : vérifier R13 dans `docs/backend-reference/MASTER_CONTEXT.md` avant
d'écrire le libellé d'erreur F11. Retirer R13 de PAGES_ET_NAVIGATION s'il ne
s'applique pas.

---

## 🔴 Incohérence de nommage de route (bloquant pour F15)

### 4. `cahier-de-texte` vs `cahier-texte`

| Fichier | Valeur |
|---|---|
| `app.routes.ts` ligne 86 | `path: 'cahier-de-texte'` |
| `app.menu.ts` ligne 114 | `routerLink: ['/app/cahier-de-texte']` |
| PAGES_ET_NAVIGATION §2 lignes 114–116 | `/app/cahier-texte/saisie`, `/app/cahier-texte/classe/:id`, `/app/cahier-texte/validation` |

L'implémentation existante (`cahier-de-texte`) fait référence. PAGES_ET_NAVIGATION a
une faute de frappe. Quand F15 créera les sous-routes, il faut écrire :

```
cahier-de-texte/saisie
cahier-de-texte/classe/:id
cahier-de-texte/validation
```

**Correction** : mettre à jour PAGES_ET_NAVIGATION §2 pour utiliser `cahier-de-texte`
partout (avec le "de").

---

## 🟡 Menu `app.menu.ts` incomplet (à corriger en F08)

PAGES_ET_NAVIGATION §3 dit explicitement que F08 doit construire **le menu complet
immédiatement**. L'état actuel est loin du compte.

---

### 5. Doublon emploi du temps pour SUPER_ADMIN

`emploisDuTemps` apparaît dans `parametrage.items` (→ `/app/parametrage`) **et**
comme entrée top-level `emploiDuTemps` (→ `/app/emploi-du-temps`). Pour SUPER_ADMIN,
les deux s'affichent simultanément dans la sidebar.

---

### 6. Paramétrage — sous-menus fortement incomplets

Menu actuel (4 items) vs PAGES_ET_NAVIGATION §1 (8 items) :

| Item | Menu actuel | PAGES_ET_NAVIGATION |
|---|---|---|
| Classes | ✅ | ✅ |
| Trimestres & séquences | ❌ absent | ✅ |
| Taux de scolarité | ✅ | ✅ |
| Quotas horaires | ❌ absent | ✅ |
| Matières | ✅ | ✅ |
| Coefficients | ❌ absent | ✅ |
| Niveaux | ❌ absent | ✅ |
| Modèles de lettre d'engagement | ❌ absent | ✅ |
| Emplois du temps | ❌ mal placé ici | Doit être une section top-level distincte |

---

### 7. Finances — items non conformes

| Item | Menu actuel | PAGES_ET_NAVIGATION §1 |
|---|---|---|
| Scolarité | ✅ présent | ❌ non prévu |
| Quittances | ✅ présent | ❌ non prévu |
| Versements | ❌ absent | ✅ |
| Validations bancaires en attente | ❌ absent | ✅ |
| Moratoires | ✅ | ✅ |
| Alertes de retard | ❌ absent | ✅ |
| États & rapports | ❌ absent | ✅ |

`Scolarité` et `Quittances` ne correspondent à aucun sous-menu prévu dans
PAGES_ET_NAVIGATION.

---

### 8. Résultats — Validation des notes manquante

| Item | Menu actuel | PAGES_ET_NAVIGATION §1 |
|---|---|---|
| Saisie des notes | ✅ | ✅ |
| Validation des notes | ❌ absent | ✅ (perm. NOTES_VALIDER ou R21) |
| Bulletins | ✅ | ✅ |

---

### 9. Sections plates au lieu de sous-menus

Ces sections sont actuellement un seul `routerLink` direct dans le menu, alors que
PAGES_ET_NAVIGATION §1 attend des sous-menus :

| Section | Sous-menus attendus (PAGES_ET_NAVIGATION §1) |
|---|---|
| Emploi du temps | Par classe / Par enseignant / Nouveau créneau |
| Personnel | Liste du personnel / Nouveau personnel |
| Discipline | Sanctions / Bons de sortie / Règles d'escalade |
| Cahier de texte | Ma progression / Consultation par classe / Validation & observations |

---

### 10. Communication — item `vitrine` non conforme

| Item | Menu actuel | PAGES_ET_NAVIGATION §1 |
|---|---|---|
| Actualités | ✅ | ✅ |
| Vitrine | ✅ présent | ❌ non prévu |
| Calendrier scolaire | ❌ absent | ✅ |
| Contenu du site | ❌ absent | ✅ |
| Équipe pédagogique | ❌ absent | ✅ |

---

### 11. Élèves — `Inscriptions` vs `Nouvel élève`

| Item | Menu actuel | PAGES_ET_NAVIGATION §1 |
|---|---|---|
| Liste des élèves | ✅ | ✅ |
| Fiche élève | ✅ présent dans menu | ❌ hors arborescence (accès direct) |
| Inscriptions | ✅ présent | ❌ non prévu comme sous-menu |
| Nouvel élève | ❌ absent | ✅ [SUPER_ADMIN, SECRETARIAT] |

---

### 12. Rôles — vues trop réduites

| Rôle | Menu actuel | PAGES_ET_NAVIGATION §1 attend en plus |
|---|---|---|
| `SECRETARIAT` | Élèves seuls | Personnel, Emploi du temps (lecture), Finances (lecture), Discipline |
| `ECONOMAT` | Finances + Paie | Élèves (lecture) |
| `ENSEIGNANT` | EDT + Résultats + Discipline + Cahier | Élèves (lecture) |

---

## 🔵 Bug pré-existant hors scope PAGES_ET_NAVIGATION — à vérifier

### 13. `auth.service.ts` — deux désalignements avec le JWT réel (✅ corrigés)

Deux écarts découverts en testant avec le backend réel :

**a) Champ `token` → `accessToken`** (corrigé dans `AuthResponse`)
Le backend renvoie `accessToken`, le code lisait `res.token` → JWT jamais stocké.

**b) Champ `role: Role` → `roles: Role[]`** (corrigé dans `JwtPayload`)
Le backend encode `"roles": ["PARENT"]` (tableau), `JwtPayload` déclarait `role: Role`
(string singulier). `authService.role()` retournait `null` → `roleGuard` rejetait
chaque navigation → parent bloqué en boucle sur `/connexion`.

Fix appliqué :
```typescript
// JwtPayload
roles: Role[];           // était: role: Role
permissions: string[];
utilisateurId: string;
etablissementId: string;

// computed role()
computed(() => this.currentUser()?.roles?.[0] ?? null)
```

---

## Synthèse priorisée

| # | Sévérité | Bloque quoi | Action |
|---|---|---|---|
| 4 | 🔴 Bloquant | F15 (cahier de texte) | Corriger `cahier-texte` → `cahier-de-texte` dans PAGES_ET_NAVIGATION §2 |
| 1 | 🔴 Bloquant | F13 (moratoires) | Corriger `PUT` → `PATCH` dans PAGES_ET_NAVIGATION §2 |
| 2 | 🟡 Important | F08 UX message erreur | Corriger `R2` → `R7` dans PAGES_ET_NAVIGATION §2 |
| 3 | 🟡 Important | F11 UX message erreur | Vérifier R13 dans MASTER_CONTEXT, retirer si erroné |
| 5 | 🟡 Important | F08 menu | Supprimer `emploisDuTemps` de `parametrage.items` |
| 6–11 | 🟡 Important | F08 menu | Compléter `app.menu.ts` (objectif principal de F08 selon §3) |
| 12 | 🟡 Important | F08 menu | Corriger les vues par rôle dans `buildMenu()` |
| 13 | 🔴 Bloquant | Login actuel | Tester avec le backend réel, aligner `token` vs `accessToken` |
