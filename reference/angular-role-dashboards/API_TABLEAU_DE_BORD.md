# API — Tableau de bord

Cinq endpoints de **lecture agrégée**, un par rôle, plus les endpoints
**existants** appelés par les boutons de la file « À traiter ».

Principe : le tableau de bord ne crée aucune règle métier. Chaque endpoint
agrège des données que les modules F08-F16 exposent déjà, en une seule
requête, pour que l'écran s'ouvre en un aller-retour.

---

## 1. Endpoints

| Méthode | Route | Rôles autorisés | Composant |
|---|---|---|---|
| GET | `/api/tableau-de-bord/direction` | SUPER_ADMIN | `DirectionDashboardComponent` |
| GET | `/api/tableau-de-bord/secretariat` | SECRETARIAT, SUPER_ADMIN | `SecretariatDashboardComponent` |
| GET | `/api/tableau-de-bord/economat` | ECONOMAT, SUPER_ADMIN | `EconomatDashboardComponent` |
| GET | `/api/tableau-de-bord/enseignant` | ENSEIGNANT | `EnseignantDashboardComponent` |
| GET | `/api/tableau-de-bord/communication` | COMMUNICATION, SUPER_ADMIN | `CommunicationDashboardComponent` |

Règles communes :

- Authentification JWT. **403** si le rôle n'est pas autorisé — ne jamais
  renvoyer un tableau de bord vide à la place.
- `/enseignant` est **toujours calculé pour l'utilisateur connecté** (via son
  Personnel lié). Aucun paramètre `enseignantId` : impossible de consulter le
  tableau de bord d'un collègue.
- Année scolaire et trimestre **courants** déduits côté serveur.
- Montants en **FCFA entiers**, dates en **ISO 8601**, heures en `"HH:mm"`.
- Temps de réponse visé < 300 ms. Mise en cache serveur conseillée 60 s par
  rôle (par utilisateur pour `/enseignant`), invalidée par les commandes
  listées en §3.

---

## 2. Formes de réponse

Les types exacts sont dans `models/dashboard.models.ts`. Résumé et source des
données :

### Objet commun `Tache` (file « À traiter »)

```json
{
  "id": "e1",
  "module": "Validation bancaire",
  "titre": "Kevin Nkoa, 5ème A — 150 000 FCFA",
  "detail": "Afriland First Bank · bordereau n° 44 812",
  "priorite": "HAUTE",
  "echeance": null,
  "echeanceLibelle": "Depuis 2 j",
  "action": {
    "libelle": "Valider",
    "type": "COMMANDE",
    "methode": "PUT",
    "endpoint": "/api/finances/versements/V-88121/valider",
    "confirmation": "Valider ce versement de 150 000 FCFA ?"
  }
}
```

- `priorite` : `HAUTE` (à faire aujourd'hui, en retard, bloquant) · `MOYENNE`
  (sous 3 jours) · `BASSE` (à planifier).
- Tri **serveur** : priorité, puis échéance croissante. **8 tâches maximum.**
- `action.type = "NAVIGUER"` → `route` front (`/app/...`) ;
  `"COMMANDE"` → `methode` + `endpoint` d'un endpoint existant (§3).
- Une tâche disparaît dès que sa condition n'est plus vraie : pas de statut
  « traitée » à gérer côté tableau de bord.

### `GET /direction`

```json
{
  "effectifs": { "total": 1384, "capacite": 1450, "francophones": 872, "anglophones": 512, "variation7j": 38 },
  "recouvrement": { "taux": 68, "encaisse": 421380000, "attendu": 619675000, "reste": 198295000, "variationAnneePrecedente": -4 },
  "notesValidation": {
    "sequence": "Séquence 1", "tauxGlobal": 61, "echeance": "2026-09-30",
    "niveauxAJour": 9, "niveauxTotal": 14,
    "niveaux": [ { "sousSysteme": "FR", "niveau": "6ème", "taux": 92 } ]
  },
  "discipline": { "incidents7j": 12, "escalades": 2, "retardsRepetes": 7 },
  "taches": [ ]
}
```

| Champ | Source |
|---|---|
| `effectifs` | `eleves` (année courante) + somme des capacités de `classes` |
| `recouvrement` | `versements` **validés** vs `taux-scolarite` × effectifs |
| `notesValidation.niveaux` | notes de la séquence courante validées / attendues, par niveau (R13) — ordonné par sous-système puis niveau |
| `discipline` | `sanctions` des 7 derniers jours ; `escalades` = règles déclenchées (F12) |
| `taches` | escalades déclenchées, moratoires au-delà du seuil, demandes d'accès, barème non publié |

### `GET /secretariat`

```json
{
  "inscriptions": { "septJours": 38, "semainePrecedente": 27, "francophones": 24, "anglophones": 14 },
  "dossiersIncomplets": { "nombre": 12, "echeance": "2026-10-02", "pieceLaPlusManquante": "Acte de naissance" },
  "bonsSortieJour": [
    { "id": "b2", "heureSortie": "10:15", "eleve": "Aïcha Fomba", "classe": "Lower Sixth",
      "motif": "Rendez-vous administratif", "retourPrevu": "11:30", "heureRetour": null, "statut": "EN_RETARD" }
  ],
  "moratoires": { "demandes": 5, "enAttenteEconomat": 2 },
  "taches": [ ]
}
```

| Champ | Source |
|---|---|
| `inscriptions` | `eleves` créés sur 7 j glissants vs les 7 j précédents |
| `dossiersIncomplets` | élèves de l'année dont une pièce obligatoire manque |
| `bonsSortieJour` | `bons-sortie` du jour, triés par `heureSortie`. `statut` calculé : `RENTRE` si entrée enregistrée, `EN_RETARD` si `retourPrevu` dépassé sans entrée, `SORTI` si sorti, `PREVU` sinon |
| `moratoires` | demandes de l'année ; `enAttenteEconomat` = non validées (R9) |
| `taches` | bons en retard, dossiers incomplets proches de l'échéance, moratoires à transmettre, créneaux EDT sans enseignant |

⚠️ Aucune donnée d'écriture Finances : le secrétariat n'a que la lecture des versements.

### `GET /economat`

```json
{
  "recouvrement": { "taux": 68, "encaisse": 421380000, "attendu": 619675000, "reste": 198295000, "variationAnneePrecedente": -4 },
  "encaissements7j": [ { "date": "2026-09-17", "montant": 2100000, "nombre": 24 } ],
  "variationSemaine": 12,
  "partMobileMoney": 61,
  "retards": { "familles": 34, "montant": 8900000, "relanceDeclenchee": false },
  "validationsBancaires": { "nombre": 12, "montant": 3400000 },
  "paie": { "mois": "Septembre", "statut": "A_GENERER", "echeance": "2026-09-25", "agents": 64, "baremePublie": false },
  "prochaineEcheance": { "libelle": "Échéance du 1er versement", "date": "2026-09-30" },
  "taches": [ ]
}
```

| Champ | Source |
|---|---|
| `encaissements7j` | `versements` validés, groupés par jour — **toujours 7 entrées**, jours sans versement à 0 |
| `retards` | `GET /api/finances/alertes/retards` (agrégé) |
| `validationsBancaires` | `GET /api/finances/versements/en-attente-validation` (compte + somme, R18) |
| `paie` | bulletins du mois courant (F14) ; `baremePublie` = barème de l'année actif |
| `taches` | une tâche **par** déclaration bancaire en attente (les plus anciennes d'abord), moratoires à valider, relance non déclenchée |

### `GET /enseignant`

```json
{
  "creneauxJour": [
    { "id": "c2", "debut": "10:30", "fin": "12:30", "classe": "Form 3B", "sousSysteme": "EN",
      "matiere": "Mathematics", "salle": "Room 4", "cahierRenseigne": false }
  ],
  "heuresSemaine": { "effectuees": 14, "quota": 18 },
  "notes": { "sequence": "Séquence 1", "classesSaisies": 3, "classesTotal": 5, "echeance": "2026-09-28",
             "notesRestantes": 46, "classesRestantes": ["5ème A", "4ème B"] },
  "cahierTexte": { "tauxAJour": 92, "seancesNonRenseignees": 2 },
  "sanctions30j": 2,
  "synchronisation": { "etat": "SYNCHRONISE", "derniere": "2026-09-23T09:42:00" },
  "taches": [ ]
}
```

| Champ | Source |
|---|---|
| `creneauxJour` | `emplois-du-temps/enseignant/:id` filtré sur le jour — **uniquement ses créneaux réels** (R12) |
| `heuresSemaine` | créneaux de la semaine vs `quotas-horaires` |
| `notes` | couples classe × matière de ses créneaux, séquence courante (R12) |
| `cahierTexte` | entrées R20 vs séances passées de ses créneaux |
| `sanctions30j` | sanctions **saisies par lui**, toutes classes (pas de restriction R12) |
| `synchronisation` | dernier `POST /api/cahier-texte/synchroniser` reçu de ce compte |
| `taches` | notes à saisir, séances non renseignées, bulletins disponibles ; + validation des notes s'il est professeur principal (R21) |

Le statut « prochain / en cours / terminé » des créneaux est calculé **côté
front** à partir de l'heure locale : le serveur ne renvoie que l'emploi du temps.

### `GET /communication`

```json
{
  "actualites": { "publiees": 18, "ceMois": 3, "brouillonsPrets": 2, "dernierePublication": "2026-09-20" },
  "evenements": { "aVenir": 4, "mois": "septembre", "prochain": { "titre": "Réunion des parents", "date": "2026-10-05" } },
  "contenus": [ { "cle": "REGLEMENT", "libelle": "Règlement intérieur", "modifieLe": "2025-09-01", "aRevoir": true, "motif": "version 2025-2026" } ],
  "aLaUne": { "titre": "Excellents résultats…", "publieLe": "2026-06-12", "lectures": 1240, "imageUrl": null, "url": "/actualites/a1" },
  "equipeSansPhoto": 3,
  "taches": [ ]
}
```

| Champ | Source |
|---|---|
| `actualites` | `/api/vitrine/actualites` (compte par statut) |
| `evenements` | `/api/vitrine/calendrier` — à venir sur le mois courant |
| `contenus` | `/api/vitrine/contenu` ; `aRevoir` = non modifié depuis le début de l'année scolaire |
| `aLaUne` | actualité épinglée, sinon la plus récente publiée. `lectures` : **nouveau compteur** (voir §4) |
| `equipeSansPhoto` | `/api/vitrine/equipe-pedagogique` sans photo |

---

## 3. Endpoints existants appelés par la file « À traiter »

Aucun nouvel endpoint d'écriture. Les boutons de type `COMMANDE` appellent :

| Bouton | Méthode + route | Rôle | Règle |
|---|---|---|---|
| Valider (déclaration bancaire) | `PUT /api/finances/versements/:id/valider` | ECONOMAT, SUPER_ADMIN | R18 |
| Rejeter (déclaration bancaire) | `PUT /api/finances/versements/:id/rejeter` | ECONOMAT, SUPER_ADMIN | R18 |
| Déclencher (relances) | `POST /api/finances/alertes/declencher` | ECONOMAT, SUPER_ADMIN | — |
| Enregistrer l'entrée (bon de sortie) | `PUT /api/discipline/bons-sortie/:id/entree` | SECRETARIAT, SUPER_ADMIN | — |
| Publier (actualité) | `PUT /api/vitrine/actualites/:id` avec `{ statut: "PUBLIEE" }`, ou `PUT …/:id/publier` si vous l'ajoutez | COMMUNICATION, SUPER_ADMIN | — |

Les autres boutons sont de type `NAVIGUER` et ouvrent un écran existant
(`/app/resultats/saisie`, `/app/finances/moratoires`, `/app/discipline/sanctions`…).

Après chaque commande réussie, le front **recharge** son tableau de bord :
invalider le cache serveur du rôle concerné sur ces écritures.

⚠️ Le backend reste l'autorité : le bouton affiché ne vaut jamais autorisation.
Chaque endpoint vérifie le rôle et les règles (R12, R18…) comme aujourd'hui.

---

## 4. Ajouts backend nécessaires

| Ajout | Pourquoi | Effort |
|---|---|---|
| 5 endpoints `GET /api/tableau-de-bord/*` | agrégation en une requête | Moyen — requêtes de comptage |
| Compteur `lectures` sur les actualités | carte « À la une » | Faible — incrément sur `GET /api/vitrine/actualites/:id` public |
| `capacite` sur `classes` (si absent) | taux d'occupation | Faible |
| Pièces obligatoires du dossier élève (si absent) | `dossiersIncomplets` | Faible à moyen |
| Seuil de moratoire nécessitant la Direction | tâche d'arbitrage SUPER_ADMIN | Faible — paramètre |
| Demandes d'accès (table `demande_acces`) | bouton « Demander l'accès » de la page 403 + tâche Direction | Moyen — optionnel |

Si un élément n'existe pas encore, renvoyer `0`, `[]` ou `null` : le front
gère ces cas (file vide, carte masquée), il ne casse pas.

---

## 5. Checklist de test (à ajouter à la vérification des rôles)

- [ ] Chaque rôle reçoit **403** sur les 4 autres endpoints (sauf SUPER_ADMIN,
      qui peut appeler direction, secretariat, economat, communication).
- [ ] ENSEIGNANT : `creneauxJour` et `notes` ne contiennent **que** ses classes (R12).
- [ ] ENSEIGNANT : `sanctions30j` compte aussi les classes qu'il n'enseigne pas.
- [ ] SECRETARIAT : aucune tâche de type `COMMANDE` vers `/api/finances/versements`.
- [ ] ECONOMAT : valider une déclaration depuis la file → la tâche disparaît
      au rechargement, `validationsBancaires.nombre` diminue de 1.
- [ ] COMMUNICATION : publier un brouillon depuis la file → visible sur la
      vitrine publique après rafraîchissement.
