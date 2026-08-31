# API_CONTRACT — GESCOL Backend

**Version générée depuis le code source** | Référence complémentaire : `docs/adr/MASTER_CONTEXT.md`

Ce document est la source de vérité pour le frontend. Chaque champ est
documenté tel qu'il apparaît dans le JSON (nom Java = nom JSON pour les
records ; les classes POJO utilisent les noms de champs Java directs, sans
`@JsonProperty`). Il n'y a pas de renommage via `@JsonProperty` dans ce projet.

---

## Conventions transversales

### Authentification
Tous les endpoints nécessitant une authentification attendent un header :
```
Authorization: Bearer <accessToken>
```

### Codes d'erreur communs
| Code | Signification |
|------|---------------|
| 400  | Validation Bean Validation échouée (champ manquant ou invalide) |
| 401  | Token absent, expiré ou invalide |
| 403  | Authentifié mais rôle insuffisant |
| 404  | Entité introuvable |
| 409  | Violation de règle métier (BusinessRuleViolationException) |
| 500  | Erreur interne |

Corps d'erreur (`ErrorResponse`) :
```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "status": 409,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "...",
  "path": "/api/..."
}
```

### Pagination (endpoints utilisant `PageResponse<T>`)
Paramètres de requête : `page` (défaut 0), `size` (défaut selon endpoint), `sort` (ex: `nom,asc`).

Corps de réponse :
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3
}
```
> **Note** : `GET /api/paie/baremes` retourne le type Spring `Page<>` natif qui
> contient des champs supplémentaires (`pageable`, `last`, `first`, `sort`, etc.).

### Types
| Type Java | Format JSON |
|-----------|-------------|
| `UUID`    | string (ex: `"a1b2c3d4-..."`) |
| `LocalDate` | string ISO-8601 `"2026-01-15"` |
| `LocalDateTime` | string ISO-8601 `"2026-01-15T10:30:00"` |
| `LocalTime` | string `"HH:mm:ss"` ex: `"08:00:00"` |
| `DayOfWeek` | string `"MONDAY"`, `"TUESDAY"`, …, `"SUNDAY"` |
| `BigDecimal` | number JSON (ex: `14.50`) |
| `boolean` | `true` / `false` |

---

## Module 0 — Authentification (`/api/auth`)

### ⚠️ Point critique identifié
Le champ identifiant dans `LoginRequest` est **`email`** (pas `username`).
Le mot de passe est **`motDePasse`** (pas `password`).

---

### `POST /api/auth/login`
**Accès** : Public

**Corps de requête** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `email` | string | Obligatoire, format email valide |
| `motDePasse` | string | Obligatoire, non vide |

**Réponse 200** :
| Champ | Type | Description |
|-------|------|-------------|
| `accessToken` | string | JWT d'accès (durée configurable) |
| `refreshToken` | string | JWT de rafraîchissement |
| `tokenType` | string | Toujours `"Bearer"` |
| `expiresIn` | number | Durée de validité de l'accessToken en secondes |

**Erreurs** : 401 (credentials invalides)

---

### `POST /api/auth/refresh`
**Accès** : Public

**Corps de requête** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `refreshToken` | string | Obligatoire, non vide |

**Réponse 200** : identique à `/login`

**Erreurs** : 401 (token expiré ou invalide)

---

## Module 1 — Établissement (`/api/etablissement`)

### `GET /api/etablissement/courant`
**Accès** : Tout rôle authentifié

**Réponse 200** :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `nom` | string |
| `nomCourt` | string \| null |
| `devise` | string \| null |
| `logoUrl` | string \| null |
| `couleurPrimaire` | string \| null (ex: `"#0055A4"`) |
| `couleurSecondaire` | string \| null |
| `couleurAccent` | string \| null |
| `adresse` | string \| null |
| `telephone` | string \| null |
| `email` | string \| null |
| `actif` | boolean |
| `dateCreation` | LocalDateTime |
| `texteCriteresInscription` | string \| null |
| `numeroCompteBancaire` | string \| null |
| `nomBanque` | string \| null |

---

### `PUT /api/etablissement/courant`
**Accès** : `SUPER_ADMIN`

**Corps de requête** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `nom` | string | Obligatoire, non vide |
| `nomCourt` | string | Optionnel |
| `devise` | string | Optionnel |
| `logoUrl` | string | Optionnel |
| `couleurPrimaire` | string | Optionnel, format `#RRGGBB` |
| `couleurSecondaire` | string | Optionnel, format `#RRGGBB` |
| `couleurAccent` | string | Optionnel, format `#RRGGBB` |
| `adresse` | string | Optionnel |
| `telephone` | string | Optionnel |
| `email` | string | Optionnel, format email |
| `texteCriteresInscription` | string | Optionnel |
| `numeroCompteBancaire` | string | Optionnel |
| `nomBanque` | string | Optionnel |

**Réponse 200** : `EtablissementResponse` (voir ci-dessus)

---

## Module 2 — Paramétrage

### Niveaux (`/api/niveaux`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`, `ENSEIGNANT`, `COMMUNICATION`
**Accès écriture** : `SUPER_ADMIN`

#### `GET /api/niveaux` — Liste paginée
Tri par défaut : `ordre`. Champs de tri autorisés : `libelle`, `ordre`.

**Réponse 200** : `PageResponse<NiveauResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `libelle` | string |
| `sousSysteme` | `FRANCOPHONE` \| `ANGLOPHONE` |
| `ordre` | number (entier ≥ 1) |
| `etablissementId` | UUID |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

#### `GET /api/niveaux/{id}` — Détail
**Réponse 200** : `NiveauResponse`  
**Erreurs** : 404

#### `POST /api/niveaux` — Créer
**Corps de requête** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `libelle` | string | Obligatoire, non vide |
| `sousSysteme` | enum | Obligatoire : `FRANCOPHONE` \| `ANGLOPHONE` |
| `ordre` | number | Entier ≥ 1 |

**Réponse 201** : `NiveauResponse`  
**Erreurs** : 400, 409 (libelle+sousSysteme déjà existant)

#### `PUT /api/niveaux/{id}` — Modifier
**Corps** : identique au POST  
**Réponse 200** : `NiveauResponse` | **Erreurs** : 404, 409

#### `DELETE /api/niveaux/{id}` — Supprimer
**Réponse 204** | **Erreurs** : 404

---

### Classes (`/api/classes`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`, `ENSEIGNANT`, `COMMUNICATION`
**Accès écriture** : `SUPER_ADMIN`, `SECRETARIAT`

#### `GET /api/classes` — Liste paginée
Tri par défaut : `libelle`. Champs autorisés : `libelle`, `anneeScolaire`.

**Réponse 200** : `PageResponse<ClasseResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `libelle` | string |
| `sousSysteme` | `FRANCOPHONE` \| `ANGLOPHONE` |
| `niveauId` | UUID \| null |
| `niveauLibelle` | string \| null |
| `anneeScolaire` | string (ex: `"2025-2026"`) |
| `etablissementId` | UUID |
| `professeurPrincipalId` | UUID \| null |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

#### `GET /api/classes/{id}` — Détail
**Réponse 200** : `ClasseResponse` | **Erreurs** : 404

#### `POST /api/classes` — Créer
| Champ | Type | Contraintes |
|-------|------|-------------|
| `libelle` | string | Obligatoire, non vide |
| `sousSysteme` | enum | Obligatoire |
| `niveauId` | UUID | Optionnel |
| `anneeScolaire` | string | Obligatoire, non vide |

**Réponse 201** : `ClasseResponse` | **Erreurs** : 400, 409 (libelle+anneeScolaire déjà existant pour cet établissement)

#### `PUT /api/classes/{id}` — Modifier
**Corps** : identique au POST | **Réponse 200** | **Erreurs** : 404, 409

#### `DELETE /api/classes/{id}` — Supprimer
**Réponse 204** | **Erreurs** : 404

#### `PUT /api/classes/{id}/professeur-principal`
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `personnelId` | UUID | Obligatoire |

**Réponse 200** : `ClasseResponse`  
**Erreurs** : 404 (classe ou personnel introuvable), 409 (personnel n'est pas de type ENSEIGNANT — cf. MASTER_CONTEXT.md R21)

---

### Trimestres (`/api/trimestres`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`, `ENSEIGNANT`, `COMMUNICATION`
**Accès écriture** : `SUPER_ADMIN`

#### `GET /api/trimestres` — Liste paginée
Tri par défaut : `dateDebut`. Champs autorisés : `libelle`, `anneeScolaire`, `dateDebut`.

**Réponse 200** : `PageResponse<TrimestreResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `libelle` | string |
| `anneeScolaire` | string |
| `dateDebut` | LocalDate |
| `dateFin` | LocalDate |
| `etablissementId` | UUID |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

#### `GET /api/trimestres/{id}` | `POST` | `PUT /{id}` | `DELETE /{id}` — CRUD standard
**Corps POST/PUT** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `libelle` | string | Obligatoire |
| `anneeScolaire` | string | Obligatoire |
| `dateDebut` | LocalDate | Obligatoire |
| `dateFin` | LocalDate | Obligatoire |

---

### Séquences (`/api/sequences`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`, `ENSEIGNANT`, `COMMUNICATION`
**Accès écriture** : `SUPER_ADMIN`

#### `GET /api/sequences` — Liste paginée
Tri par défaut : `dateDebut`. Champs autorisés : `libelle`, `dateDebut`.

**Réponse 200** : `PageResponse<SequenceResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `libelle` | string |
| `trimestreId` | UUID |
| `trimestreLibelle` | string |
| `dateDebut` | LocalDate |
| `dateFin` | LocalDate |
| `etablissementId` | UUID |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

#### `GET /api/sequences/{id}` | `POST` | `PUT /{id}` | `DELETE /{id}` — CRUD standard
**Corps POST/PUT** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `libelle` | string | Obligatoire |
| `trimestreId` | UUID | Obligatoire |
| `dateDebut` | LocalDate | Obligatoire |
| `dateFin` | LocalDate | Obligatoire |

---

### Matières (`/api/matieres`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`, `ENSEIGNANT`, `COMMUNICATION`
**Accès écriture** : `SUPER_ADMIN`

#### `GET /api/matieres` — Liste paginée
Tri par défaut : `libelle`. Champs autorisés : `libelle`.

**Réponse 200** : `PageResponse<MatiereResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `libelle` | string |
| `sousSysteme` | `FRANCOPHONE` \| `ANGLOPHONE` |
| `etablissementId` | UUID |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

#### `GET /api/matieres/{id}` | `POST` | `PUT /{id}` | `DELETE /{id}` — CRUD standard
**Corps POST/PUT** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `libelle` | string | Obligatoire, non vide |
| `sousSysteme` | enum | Obligatoire |

---

### Coefficients (`/api/coefficients`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`, `ENSEIGNANT`, `COMMUNICATION`
**Accès écriture** : `SUPER_ADMIN`

#### `GET /api/coefficients` — Liste paginée
Tri autorisé : `valeur`.

**Réponse 200** : `PageResponse<CoefficientResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `matiereId` | UUID |
| `matiereLibelle` | string |
| `classeId` | UUID |
| `classeLibelle` | string |
| `valeur` | number (BigDecimal) |
| `etablissementId` | UUID |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

#### `GET /api/coefficients/{id}` | `POST` | `PUT /{id}` | `DELETE /{id}` — CRUD standard
**Corps POST/PUT** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `matiereId` | UUID | Obligatoire |
| `classeId` | UUID | Obligatoire |
| `valeur` | number | Obligatoire, > 0.00 |

---

### Quotas horaires (`/api/quotas-horaires`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`, `ENSEIGNANT`, `COMMUNICATION`
**Accès écriture** : permission `QUOTAS_MODIFIER`

#### `GET /api/quotas-horaires` — Liste paginée
Tri autorisé : `heuresParSemaine`.

**Réponse 200** : `PageResponse<QuotaHoraireResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `matiereId` | UUID |
| `matiereLibelle` | string |
| `classeId` | UUID |
| `classeLibelle` | string |
| `heuresParSemaine` | number (entier ≥ 1) |
| `etablissementId` | UUID |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

**Corps POST/PUT** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `matiereId` | UUID | Obligatoire |
| `classeId` | UUID | Obligatoire |
| `heuresParSemaine` | number | Entier ≥ 1 |

---

### Taux de scolarité (`/api/taux-scolarite`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`, `ENSEIGNANT`, `COMMUNICATION`
**Accès écriture** : permission `SCOLARITE_TAUX_MODIFIER`

#### `GET /api/taux-scolarite` — Liste paginée
Tri par défaut : `anneeScolaire`. Champs autorisés : `anneeScolaire`, `montant`.

**Réponse 200** : `PageResponse<TauxScolariteResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `classeId` | UUID |
| `classeLibelle` | string |
| `montant` | number |
| `anneeScolaire` | string |
| `etablissementId` | UUID |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

**Corps POST/PUT** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `classeId` | UUID | Obligatoire |
| `montant` | number | Obligatoire, ≥ 0 |
| `anneeScolaire` | string | Obligatoire |

---

### Modèles de lettre d'engagement (`/api/modeles-engagement`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`, `ENSEIGNANT`, `COMMUNICATION`
**Accès écriture** : `SUPER_ADMIN`

#### `GET /api/modeles-engagement` — Liste paginée
**Réponse 200** : `PageResponse<ModeleLettreEngagementResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `libelle` | string |
| `contenu` | string (texte du modèle, avec variables de substitution) |
| `etablissementId` | UUID |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

**Corps POST/PUT** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `libelle` | string | Obligatoire, non vide |
| `contenu` | string | Obligatoire, non vide |

---

## Module 3 — Élèves (`/api/eleves`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`, `ENSEIGNANT`
**Accès écriture** : `SUPER_ADMIN`, `SECRETARIAT`
**Suppression** : permission `ELEVE_SUPPRIMER`

### `GET /api/eleves` — Recherche paginée
**Paramètres de requête** (tous optionnels) :
| Paramètre | Type | Description |
|-----------|------|-------------|
| `nom` | string | Filtre partiel sur le nom |
| `prenom` | string | Filtre partiel sur le prénom |
| `matricule` | string | Filtre partiel sur le matricule |
| `classeLibelle` | string | Filtre partiel sur le libellé de classe |

Tri par défaut : `nom`. Champs autorisés : `nom`, `matricule`.

**Réponse 200** : `PageResponse<EleveResponse>` (voir champs ci-dessous)

### `GET /api/eleves/{id}` — Détail
**Réponse 200** :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `matricule` | string (généré, format `{année}XXXXXXX`) |
| `nom` | string |
| `prenom` | string |
| `sexe` | `M` \| `F` |
| `dateNaissance` | LocalDate |
| `lieuNaissance` | string \| null |
| `classeId` | UUID |
| `classeLibelle` | string |
| `redoublant` | boolean |
| `sousSysteme` | `FRANCOPHONE` \| `ANGLOPHONE` \| null |
| `apteSport` | boolean |
| `groupeSanguin` | `A_POS` \| `A_NEG` \| `B_POS` \| `B_NEG` \| `AB_POS` \| `AB_NEG` \| `O_POS` \| `O_NEG` \| `INCONNU` \| null |
| `nomPere` | string \| null |
| `nomMere` | string \| null |
| `quartier` | string \| null |
| `personneContact` | string \| null |
| `telephoneContact` | string \| null |
| `etablissementId` | UUID |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

**Erreurs** : 404

### `POST /api/eleves` — Créer
**Réponse 201** : `EleveResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `nom` | string | Obligatoire, non vide |
| `prenom` | string | Obligatoire, non vide |
| `sexe` | enum | Obligatoire : `M` \| `F` |
| `dateNaissance` | LocalDate | Obligatoire, dans le passé |
| `lieuNaissance` | string | Optionnel |
| `classeId` | UUID | Obligatoire |
| `redoublant` | boolean | Optionnel (défaut `false`) |
| `sousSysteme` | enum | Optionnel |
| `apteSport` | boolean | Optionnel (défaut `true`) |
| `groupeSanguin` | enum | Optionnel |
| `nomPere` | string | Optionnel |
| `nomMere` | string | Optionnel |
| `quartier` | string | Optionnel |
| `personneContact` | string | Optionnel |
| `telephoneContact` | string | Optionnel |

**Erreurs** : 400, 404 (classeId introuvable)

### `PUT /api/eleves/{id}` — Modifier
**Corps** : identique POST | **Réponse 200** | **Erreurs** : 404

### `DELETE /api/eleves/{id}` — Supprimer
**Réponse 204** | **Erreurs** : 404, 409 (élève a des notes ou des versements — cf. MASTER_CONTEXT.md R7)

---

## Module 4 — Personnel (`/api/personnel`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`
**Accès écriture** : `SUPER_ADMIN`, `SECRETARIAT`

### `GET /api/personnel` — Liste paginée
Tri par défaut : `nom`. Champs autorisés : `nom`, `matricule`.

**Réponse 200** : `PageResponse<PersonnelResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `matricule` | string (généré) |
| `nom` | string |
| `prenom` | string |
| `typePersonnel` | `ENSEIGNANT` \| `NON_ENSEIGNANT` |
| `typeContrat` | `VACATAIRE` \| `SEMI_PERMANENT` \| `PERMANENT` |
| `fonction` | string \| null |
| `telephone` | string \| null |
| `email` | string \| null |
| `dateEmbauche` | LocalDate \| null |
| `actif` | boolean |
| `salaireBase` | number \| null |
| `indemniteTransport` | number \| null |
| `numeroCompteBancaire` | string \| null |
| `nomBanque` | string \| null |
| `matiereIds` | array UUID |
| `etablissementId` | UUID |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

### `GET /api/personnel/{id}` — Détail
**Réponse 200** : `PersonnelResponse` | **Erreurs** : 404

### `POST /api/personnel` — Créer
**Réponse 201** : `PersonnelResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `nom` | string | Obligatoire |
| `prenom` | string | Obligatoire |
| `typePersonnel` | enum | Obligatoire |
| `typeContrat` | enum | Obligatoire |
| `fonction` | string | Optionnel |
| `telephone` | string | Optionnel |
| `email` | string | Optionnel |
| `dateEmbauche` | LocalDate | Optionnel |
| `salaireBase` | number | Optionnel |
| `indemniteTransport` | number | Optionnel |
| `numeroCompteBancaire` | string | Optionnel |
| `nomBanque` | string | Optionnel |
| `actif` | boolean | Optionnel (défaut `true`) |
| `matiereIds` | array UUID | Optionnel |

### `PUT /api/personnel/{id}` — Modifier
**Corps** : identique POST | **Réponse 200** | **Erreurs** : 404

### `DELETE /api/personnel/{id}` — Supprimer
**Réponse 204**  
**Erreurs** : 404, 409 (personnel a un historique emploi du temps ou bulletins de paie — cf. MASTER_CONTEXT.md R10. Utiliser `/desactiver` à la place.)

### `PUT /api/personnel/{id}/desactiver`
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`  
**Réponse 200** : `PersonnelResponse` (champ `actif` devient `false`) | **Erreurs** : 404

### `PUT /api/personnel/{id}/reactiver`
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`  
**Réponse 200** : `PersonnelResponse` (champ `actif` devient `true`) | **Erreurs** : 404

---

## Module 5 — Emploi du temps (`/api/emplois-du-temps`)

**Accès lecture** : `SUPER_ADMIN`, `SECRETARIAT`, `ENSEIGNANT`
**Accès écriture** : `SUPER_ADMIN`, `SECRETARIAT`

### `GET /api/emplois-du-temps` — Liste paginée
Tri par défaut : `jourSemaine`. Champs autorisés : `jourSemaine`, `heureDebut`, `anneeScolaire`.

**Réponse 200** : `PageResponse<EmploiDuTempsResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `etablissementId` | UUID |
| `classeId` | UUID |
| `classeLibelle` | string |
| `matiereId` | UUID |
| `matiereLibelle` | string |
| `enseignantId` | UUID |
| `enseignantNom` | string |
| `enseignantPrenom` | string |
| `jourSemaine` | `MONDAY` \| … \| `SUNDAY` |
| `heureDebut` | LocalTime (`"08:00:00"`) |
| `heureFin` | LocalTime |
| `anneeScolaire` | string |

### `GET /api/emplois-du-temps/{id}` — Détail
**Réponse 200** : `EmploiDuTempsResponse` | **Erreurs** : 404

### `GET /api/emplois-du-temps/classe/{classeId}` — Par classe
**Réponse 200** : `List<EmploiDuTempsResponse>`

### `GET /api/emplois-du-temps/enseignant/{enseignantId}` — Par enseignant
**Réponse 200** : `List<EmploiDuTempsResponse>`

### `POST /api/emplois-du-temps` — Créer
**Réponse 201** : `EmploiDuTempsResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `classeId` | UUID | Obligatoire |
| `matiereId` | UUID | Obligatoire |
| `enseignantId` | UUID | Obligatoire |
| `jourSemaine` | enum DayOfWeek | Obligatoire |
| `heureDebut` | LocalTime | Obligatoire |
| `heureFin` | LocalTime | Obligatoire |
| `anneeScolaire` | string | Obligatoire |

**Erreurs** : 400, 409 (chevauchement horaire — cf. MASTER_CONTEXT.md R12)

### `PUT /api/emplois-du-temps/{id}` — Modifier
**Corps** : identique POST | **Réponse 200** | **Erreurs** : 404, 409

### `DELETE /api/emplois-du-temps/{id}` — Supprimer
**Réponse 204** | **Erreurs** : 404

---

## Module 6 — Résultats (`/api/resultats`)

### Notes

#### `POST /api/resultats/notes` — Saisir une note
**Accès** : `SUPER_ADMIN`, `ENSEIGNANT` (cf. MASTER_CONTEXT.md R12)  
**Réponse 201** : `NoteResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `eleveId` | UUID | Obligatoire |
| `matiereId` | UUID | Obligatoire |
| `sequenceId` | UUID | Obligatoire |
| `valeur` | number | Obligatoire, 0 ≤ valeur ≤ 20 |

**Erreurs** : 400, 404, 409 (note déjà validée, ou R12 : pas d'emploi du temps autorisant cet enseignant)

**Réponse** :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `etablissementId` | UUID |
| `eleveId` | UUID |
| `eleveNom` | string |
| `elevePrenom` | string |
| `eleveMatricule` | string |
| `matiereId` | UUID |
| `matiereLibelle` | string |
| `sequenceId` | UUID |
| `sequenceLibelle` | string |
| `valeur` | number |
| `statut` | `BROUILLON` \| `VALIDEE` |
| `saisieParId` | UUID \| null |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

#### `POST /api/resultats/notes/lot` — Saisie en lot (même matière, même séquence)
**Accès** : `SUPER_ADMIN`, `ENSEIGNANT`  
**Réponse 201** : `List<NoteResponse>`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `matiereId` | UUID | Obligatoire |
| `sequenceId` | UUID | Obligatoire |
| `notes` | array | Obligatoire, non vide |
| `notes[].eleveId` | UUID | Obligatoire |
| `notes[].valeur` | number | Obligatoire, 0–20 |

**Erreurs** : 400, 409 (R12)

#### `PUT /api/resultats/notes/{id}` — Modifier une note
**Accès** : `SUPER_ADMIN`, `ENSEIGNANT`  
**Corps** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `eleveId` | UUID | Obligatoire |
| `matiereId` | UUID | Obligatoire |
| `sequenceId` | UUID | Obligatoire |
| `valeur` | number | Obligatoire, 0–20 |

**Réponse 200** : `NoteResponse` | **Erreurs** : 404, 409 (note validée — immuable)

#### `PUT /api/resultats/notes/valider` — Valider un lot de notes
**Accès** : permission `NOTES_VALIDER` **ou** rôle `ENSEIGNANT` (cf. R21)

| Champ | Type | Contraintes |
|-------|------|-------------|
| `noteIds` | array UUID | Obligatoire, non vide |

**Réponse 204**  
**Erreurs** : 409 (R21 : l'enseignant n'est pas professeur principal de toutes les classes du lot — aucune note validée en cas d'échec partiel)

#### `GET /api/resultats/notes/eleve/{eleveId}` — Notes d'un élève
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`, `ENSEIGNANT`  
**Réponse 200** : `List<NoteResponse>`

#### `GET /api/resultats/notes/classe/{classeId}/matiere/{matiereId}/sequence/{sequenceId}`
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`, `ENSEIGNANT` (cf. R12 pour ENSEIGNANT)  
**Réponse 200** : `List<NoteResponse>` (triés par nom, prénom élève)

---

### Moyennes

#### `GET /api/resultats/moyennes/eleve/{eleveId}/sequence/{sequenceId}`
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`, `ENSEIGNANT`

**Réponse 200** :
| Champ | Type |
|-------|------|
| `eleveId` | UUID |
| `sequenceId` | UUID |
| `details` | array |
| `details[].matiereId` | UUID |
| `details[].matiereLibelle` | string |
| `details[].note` | number \| null (null = non saisie) |
| `details[].coefficient` | number |
| `moyenneGenerale` | number \| null (null = aucune note saisie) |

---

### Bulletins

#### `GET /api/resultats/bulletins/{eleveId}/sequence/{sequenceId}/pdf`
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`, `ENSEIGNANT` (cf. R21 pour ENSEIGNANT)

**Réponse 200** : `application/pdf` (binaire)  
Header : `Content-Disposition: inline; filename="bulletin-{eleveId}-{sequenceId}.pdf"`  
**Erreurs** : 404, 409 (R21), 500 (génération PDF)

---

## Module 7 — Discipline (`/api/discipline`)

### Règles de discipline (`/api/discipline/regles`)
**Accès** : `SUPER_ADMIN` (toutes opérations)

#### `GET /api/discipline/regles` — Liste
**Réponse 200** : `List<RegleDisciplineResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `etablissementId` | UUID |
| `typeSanctionDeclencheur` | TypeSanction (voir enum) |
| `seuilDeclenchement` | number (entier ≥ 1) |
| `sanctionResultante` | TypeSanction |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

Valeurs de `TypeSanction` : `BLAME`, `ABSENCE_JUSTIFIEE`, `ABSENCE_NON_JUSTIFIEE`, `RETARD`, `RETENUE`, `AVERTISSEMENT`, `EXCLUSION_3J`, `EXCLUSION_8J`, `INTERPELLATION`

#### `GET /api/discipline/regles/{id}` | `POST` | `PUT /{id}` | `DELETE /{id}`
**Corps POST/PUT** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `typeSanctionDeclencheur` | enum TypeSanction | Obligatoire |
| `seuilDeclenchement` | number | Entier ≥ 1 |
| `sanctionResultante` | enum TypeSanction | Obligatoire |

---

### Sanctions (`/api/discipline/sanctions`)
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`, `ENSEIGNANT`

#### `POST /api/discipline/sanctions` — Créer une sanction
**Réponse 201** : `SanctionResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `eleveId` | UUID | Obligatoire |
| `typeSanction` | enum TypeSanction | Obligatoire |
| `dateSanction` | LocalDateTime | Obligatoire |
| `motif` | string | Obligatoire, non vide |
| `enregistreParId` | UUID | Optionnel |

**Réponse** :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `etablissementId` | UUID |
| `eleveId` | UUID |
| `eleveNom` | string |
| `elevePrenom` | string |
| `eleveMatricule` | string |
| `typeSanction` | TypeSanction |
| `dateSanction` | LocalDateTime |
| `motif` | string |
| `enregistreParId` | UUID \| null |
| `genereParEscalade` | boolean |
| `anneeScolaire` | string |
| `dateCreation` | LocalDateTime |

#### `GET /api/discipline/sanctions/eleve/{eleveId}` — Sanctions d'un élève
**Réponse 200** : `List<SanctionResponse>`

#### `GET /api/discipline/sanctions/classe/{classeId}` — Sanctions d'une classe
**Réponse 200** : `List<SanctionResponse>`

---

### Bons de sortie (`/api/discipline/bons-sortie`)
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`

#### `POST /api/discipline/bons-sortie` — Créer
**Réponse 201** : `BonSortieResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `eleveId` | UUID | Obligatoire |
| `dateSortie` | LocalDateTime | Obligatoire |
| `motif` | string | Obligatoire, non vide |
| `autoriseParId` | UUID | Obligatoire |

**Réponse** :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `etablissementId` | UUID |
| `eleveId` | UUID |
| `eleveNom` | string |
| `elevePrenom` | string |
| `eleveMatricule` | string |
| `dateSortie` | LocalDateTime |
| `motif` | string |
| `autoriseParId` | UUID |
| `statut` | `SORTI` \| `RENTRE` |
| `dateEntree` | LocalDateTime \| null |
| `dateCreation` | LocalDateTime |

#### `PUT /api/discipline/bons-sortie/{id}/entree` — Enregistrer le retour
**Réponse 200** : `BonSortieResponse` (statut passe à `RENTRE`) | **Erreurs** : 404

#### `GET /api/discipline/bons-sortie/eleve/{eleveId}` — Bons d'un élève
**Réponse 200** : `List<BonSortieResponse>`

---

## Module 8 — Finances (`/api/finances`)

### Versements

#### `POST /api/finances/versements` — Créer un versement (caisse)
**Accès** : `SUPER_ADMIN`, `ECONOMAT`  
**Réponse 201** : `VersementResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `eleveId` | UUID | Obligatoire |
| `montant` | number | Obligatoire, > 0.00 |
| `modePaiement` | enum | Optionnel, défaut `CAISSE`. Valeurs : `CAISSE` \| `VALIDATION_BANCAIRE` |
| `numeroRecuBancaire` | string | Obligatoire si `VALIDATION_BANCAIRE` |
| `nomSignataireBancaire` | string | Obligatoire si `VALIDATION_BANCAIRE` |

**Réponse** :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `etablissementId` | UUID |
| `eleveId` | UUID |
| `eleveNom` | string |
| `elevePrenom` | string |
| `eleveMatricule` | string |
| `montant` | number |
| `dateVersement` | LocalDateTime |
| `numeroQuittance` | string |
| `anneeScolaire` | string |
| `soldeApresVersement` | number |
| `modePaiement` | `CAISSE` \| `VALIDATION_BANCAIRE` |
| `numeroRecuBancaire` | string \| null |
| `nomSignataireBancaire` | string \| null |
| `creeParId` | UUID \| null |
| `dateCreation` | LocalDateTime |
| `statutValidation` | `VALIDE` \| `EN_ATTENTE_VALIDATION` \| `REJETE` |
| `declareParId` | UUID \| null |
| `valideParId` | UUID \| null |
| `dateValidation` | LocalDateTime \| null |
| `motifRejet` | string \| null |

**Erreurs** : 404, 409 (cf. R18)

#### `POST /api/finances/versements/declarer-bancaire` — Déclarer un virement (côté parent/enseignant)
**Accès** : `SUPER_ADMIN`, `ECONOMAT`, `SECRETARIAT`, `PARENT`  
**Réponse 201** : `VersementResponse` (statut = `EN_ATTENTE_VALIDATION`)

| Champ | Type | Contraintes |
|-------|------|-------------|
| `eleveId` | UUID | Obligatoire |
| `montant` | number | Obligatoire, > 0.00 |
| `numeroRecuBancaire` | string | Obligatoire, non vide |
| `nomSignataireBancaire` | string | Obligatoire, non vide |

#### `GET /api/finances/versements/en-attente-validation`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`, `SECRETARIAT`  
**Réponse 200** : `List<VersementResponse>` (uniquement statut `EN_ATTENTE_VALIDATION`)

#### `PUT /api/finances/versements/{id}/valider`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`  
**Réponse 200** : `VersementResponse` (statut passe à `VALIDE`) | **Erreurs** : 404, 409

#### `PUT /api/finances/versements/{id}/rejeter`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `motifRejet` | string | Obligatoire, non vide |

**Réponse 200** : `VersementResponse` (statut = `REJETE`) | **Erreurs** : 404

#### `GET /api/finances/eleves/{eleveId}/solde`
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`

**Réponse 200** :
| Champ | Type |
|-------|------|
| `eleveId` | UUID |
| `anneeScolaire` | string |
| `tauxScolarite` | number |
| `totalVerse` | number |
| `soldeRestant` | number |

#### `GET /api/finances/versements/eleve/{eleveId}` — Historique versements élève
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`  
Tri par défaut : `dateVersement`. Champs autorisés : `dateVersement`.  
**Réponse 200** : `PageResponse<VersementResponse>`

---

### Quittances

#### `GET /api/finances/quittances/{versementId}/pdf`
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`, `ECONOMAT`  
**Réponse 200** : `application/pdf` | **Erreurs** : 404

---

### Moratoires

#### `POST /api/finances/moratoires` — Créer une demande de moratoire
**Accès** : `SUPER_ADMIN`, `ECONOMAT`, `SECRETARIAT`  
**Réponse 201** : `MoratoireResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `eleveId` | UUID | Obligatoire |
| `dateProposee` | LocalDate | Obligatoire, dans le futur |
| `motif` | string | Optionnel |

**Réponse** :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `eleveId` | UUID |
| `eleveNom` | string |
| `elevePrenom` | string |
| `eleveMatricule` | string |
| `eleveRedoublant` | boolean |
| `dateDemande` | LocalDateTime |
| `dateProposee` | LocalDate |
| `motif` | string \| null |
| `statut` | `EN_ATTENTE` \| `VALIDE` \| `REFUSE` |
| `demandeParId` | UUID \| null |
| `valideParId` | UUID \| null |
| `dateDecision` | LocalDateTime \| null |

#### `GET /api/finances/moratoires/en-attente`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`, `SECRETARIAT`  
**Réponse 200** : `List<MoratoireResponse>` (statut = `EN_ATTENTE`)

#### `PATCH /api/finances/moratoires/{id}/valider`
**Accès** : `SUPER_ADMIN`, `ECONOMAT` — pas de corps  
**Réponse 200** : `MoratoireResponse` (statut = `VALIDE`) | **Erreurs** : 404

#### `PATCH /api/finances/moratoires/{id}/refuser`
**Accès** : `SUPER_ADMIN`, `ECONOMAT` — pas de corps  
**Réponse 200** : `MoratoireResponse` (statut = `REFUSE`) | **Erreurs** : 404

#### `GET /api/finances/moratoires/historique`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`, `SECRETARIAT`  
**Paramètre** : `statut` (optionnel) : `EN_ATTENTE` \| `VALIDE` \| `REFUSE`  
**Réponse 200** : `List<MoratoireResponse>`

---

### Alertes retard

#### `POST /api/finances/alertes/declencher`
**Accès** : `SUPER_ADMIN`, `ECONOMAT` — pas de corps  
**Réponse 200** :
```json
{ "notificationsEnvoyees": 5 }
```

#### `GET /api/finances/alertes/retards`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`, `SECRETARIAT`  
**Réponse 200** : `List<EleveEnRetardResponse>`
| Champ | Type |
|-------|------|
| `eleveId` | UUID |
| `nom` | string |
| `prenom` | string |
| `matricule` | string |
| `classeLibelle` | string |
| `soldeRestant` | number |

#### `GET /api/finances/alertes/seuil`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`  
**Réponse 200** : `{ "nombreJoursAvantAlerte": 30 }`

#### `PUT /api/finances/alertes/seuil`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `nombreJoursAvantAlerte` | number | Obligatoire, entier ≥ 1 |

**Réponse 200** : `{ "nombreJoursAvantAlerte": 30 }`

---

### États financiers

#### `GET /api/finances/etats/classe/{classeId}/versements`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`, `SECRETARIAT`  
**Paramètre** : `anneeScolaire` (string, optionnel — défaut : année courante)

**Réponse 200** : `List<VersementsClasseResponse>`
| Champ | Type |
|-------|------|
| `eleveId` | UUID |
| `nom` | string |
| `prenom` | string |
| `matricule` | string |
| `montantScolarite` | number |
| `totalVerse` | number |
| `soldeRestant` | number |

#### `GET /api/finances/etats/totaux`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`  
**Paramètres** : `dateDebut` (LocalDate, obligatoire), `dateFin` (LocalDate, obligatoire) — format ISO `YYYY-MM-DD`

**Réponse 200** :
| Champ | Type |
|-------|------|
| `dateDebut` | LocalDate |
| `dateFin` | LocalDate |
| `totalVerse` | number |
| `nombreVersements` | number (long) |

---

## Module 9 — Paie (`/api/paie`)

### Barèmes de paie (`/api/paie/baremes`)

#### `GET /api/paie/baremes` — Liste paginée
**Accès** : `SUPER_ADMIN`, `ECONOMAT`

> **Note** : retourne le type Spring `Page<BaremePaieResponse>` (structure plus
> riche que `PageResponse`) avec les champs habituels Spring (`pageable`, `first`,
> `last`, `numberOfElements`, etc.)

**Réponse** item :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `etablissementId` | UUID |
| `typeContrat` | `VACATAIRE` \| `SEMI_PERMANENT` \| `PERMANENT` |
| `tauxIRPP` | number |
| `tauxCentimesAdditionnelsIRPP` | number |
| `montantTaxeCommunale` | number |
| `tauxCreditFoncierSalarial` | number |
| `tauxCreditFoncierPatronal` | number |
| `montantRedevanceAudiovisuelle` | number |
| `tauxFNE` | number |
| `tauxPensionVieillesseSalarial` | number |
| `tauxPensionVieillessePatronal` | number |
| `tauxAllocationsFamilialesPatronal` | number |
| `tauxAccidentTravailPatronal` | number |

#### `POST /api/paie/baremes` — Créer
**Accès** : `SUPER_ADMIN`  
**Réponse 201** : `BaremePaieResponse`

Corps : tous les champs de la réponse sauf `id` et `etablissementId`, tous Obligatoires et ≥ 0.

#### `PUT /api/paie/baremes/{id}` — Modifier
**Accès** : `SUPER_ADMIN` | **Corps** : idem POST | **Réponse 200** | **Erreurs** : 404

#### `DELETE /api/paie/baremes/{id}` — Supprimer
**Accès** : `SUPER_ADMIN` | **Réponse 204** | **Erreurs** : 404

---

### Bulletins de paie (`/api/paie/bulletins`)

#### `POST /api/paie/bulletins/generer`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`  
**Réponse 201** : `BulletinPaieResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `personnelId` | UUID | Obligatoire |
| `periode` | string | Obligatoire, format `"YYYY-MM"` (ex: `"2026-09"`) |
| `heuresEffectuees` | number | Optionnel, requis si VACATAIRE |
| `tauxHoraire` | number | Optionnel, requis si VACATAIRE |
| `datePaiement` | LocalDate | Obligatoire |
| `modePaiement` | enum | Obligatoire : `BILLETAGE` \| `VIREMENT_BANCAIRE` |

**Réponse** :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `personnelId` | UUID |
| `personnelNom` | string |
| `personnelPrenom` | string |
| `personnelMatricule` | string |
| `periode` | string |
| `montantBrut` | number |
| `montantNet` | number |
| `datePaiement` | LocalDate |
| `modePaiement` | `BILLETAGE` \| `VIREMENT_BANCAIRE` |
| `lignes` | array |
| `lignes[].id` | UUID |
| `lignes[].designation` | string |
| `lignes[].base` | number |
| `lignes[].taux` | number |
| `lignes[].montant` | number |
| `lignes[].estPatronal` | boolean |
| `dateCreation` | LocalDateTime |

**Erreurs** : 404, 409 (barème manquant pour ce type de contrat)

#### `GET /api/paie/bulletins/personnel/{personnelId}`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`  
**Réponse 200** : `List<BulletinPaieResponse>`

#### `GET /api/paie/bulletins/{id}/pdf`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`  
**Réponse 200** : `application/pdf` | **Erreurs** : 404

#### `GET /api/paie/bulletins/{id}/ordre-virement/pdf`
**Accès** : `SUPER_ADMIN`, `ECONOMAT`  
**Réponse 200** : `application/pdf` | **Erreurs** : 404

---

## Module 10 — Parent (`/api/parent`)

### ⚠️ Point critique identifié
`POST /api/parent/comptes` est **public** (pas de JWT requis).
Les champs de `InscriptionParentRequest` sont : **`email`**, **`motDePasse`**, **`nom`**, **`prenom`**, **`telephone`** (optionnel).

---

### `POST /api/parent/comptes` — Inscription publique
**Accès** : Public

| Champ | Type | Contraintes |
|-------|------|-------------|
| `email` | string | Obligatoire, format email |
| `motDePasse` | string | Obligatoire, ≥ 8 caractères, au moins 1 majuscule, au moins 1 chiffre |
| `nom` | string | Obligatoire, non vide |
| `prenom` | string | Obligatoire, non vide |
| `telephone` | string | Optionnel |

**Réponse 201** : `LoginResponse` (le compte est créé et un token est retourné directement)

**Erreurs** : 400 (validation), 409 (email déjà utilisé)

---

### `GET /api/parent/mes-enfants`
**Accès** : `PARENT`

**Réponse 200** : `List<EnfantResponse>`
| Champ | Type |
|-------|------|
| `eleveId` | UUID |
| `nom` | string |
| `prenom` | string |
| `matricule` | string |
| `classeLibelle` | string |

---

### `GET /api/parent/eleves/{eleveId}/suivi`
**Accès** : `PARENT`

**Réponse 200** : `SuiviEleveResponse`
| Champ | Type |
|-------|------|
| `eleveId` | UUID |
| `eleveNom` | string |
| `elevePrenom` | string |
| `solde` | objet `SoldeResponse` (voir module Finances) |
| `sequenceId` | UUID |
| `sequenceLibelle` | string |
| `sequenceCourante` | boolean |
| `moyennes` | objet `MoyenneResponse` (voir module Résultats) |
| `sanctions` | `List<SanctionResponse>` (voir module Discipline) |

**Erreurs** : 403 (élève n'appartient pas à ce parent), 404

---

### Workflow d'inscription

#### `GET /api/parent/inscriptions/criteres`
**Accès** : `PARENT`  
**Réponse 200** : `{ "texteCriteres": "..." }`

#### `GET /api/parent/inscriptions/modalites-paiement/{classeId}`
**Accès** : `PARENT`  
**Réponse 200** :
| Champ | Type |
|-------|------|
| `tauxId` | UUID |
| `classeLibelle` | string |
| `montant` | number |
| `anneeScolaire` | string |

**Erreurs** : 404 (classe ou taux introuvable)

#### `POST /api/parent/inscriptions/reserver` — Réserver une place
**Accès** : `PARENT`  
**Réponse 201** : `InscriptionResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `matricule` | string | Obligatoire, matricule de l'élève existant |
| `classeId` | UUID | Obligatoire |

**Erreurs** : 400, 404 (matricule ou classe inconnus), 409 (élève déjà inscrit)

**Réponse** :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `eleveId` | UUID |
| `eleveNom` | string |
| `elevePrenom` | string |
| `classeId` | UUID |
| `classeLibelle` | string |
| `anneeScolaire` | string |
| `statut` | `RESERVEE` \| `CONFIRMEE` \| `ANNULEE` |
| `dateReservation` | LocalDateTime |
| `dateConfirmation` | LocalDateTime \| null |

#### `PUT /api/parent/inscriptions/{id}/informations-parent`
**Accès** : `PARENT`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `telephone` | string | Optionnel |
| `localisation` | string | Optionnel |
| `fonction` | string | Optionnel |
| `email` | string | Optionnel, format email |

**Réponse 200** : `InscriptionResponse` | **Erreurs** : 404

#### `POST /api/parent/inscriptions/{id}/confirmer` — Confirmer l'inscription
**Accès** : `PARENT` — pas de corps  
**Réponse 200** : `InscriptionResponse` (statut = `CONFIRMEE`) | **Erreurs** : 404, 409

#### `GET /api/parent/mes-inscriptions`
**Accès** : `PARENT`  
**Réponse 200** : `List<InscriptionResponse>`

#### `GET /api/parent/inscriptions/{id}/lettre-engagement/pdf`
**Accès** : `PARENT`  
**Réponse 200** : `application/pdf` | **Erreurs** : 404, 409 (inscription non confirmée)

---

## Module 11 — Cahier de texte (`/api/cahier-texte`)

### `POST /api/cahier-texte/synchroniser`
**Accès** : `SUPER_ADMIN`, `ENSEIGNANT`

Corps :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `entrees` | array | Obligatoire, non vide |
| `entrees[].id` | UUID | Obligatoire — **client-supplied UUID** (idempotence) |
| `entrees[].enseignantId` | UUID | Obligatoire |
| `entrees[].classeId` | UUID | Obligatoire |
| `entrees[].matiereId` | UUID | Obligatoire |
| `entrees[].dateCours` | LocalDate | Obligatoire |
| `entrees[].heureDebut` | LocalTime | Obligatoire |
| `entrees[].heureFin` | LocalTime | Obligatoire |
| `entrees[].chapitre` | string | Obligatoire, non vide |
| `entrees[].contenu` | string | Obligatoire, non vide |
| `entrees[].dateCreationClient` | LocalDateTime | Obligatoire |

**Réponse 200** (tolérant aux erreurs par entrée) :
| Champ | Type |
|-------|------|
| `nombreCreees` | number |
| `nombreIgnorees` | number (déjà existantes — idempotence) |
| `erreurs` | array |
| `erreurs[].id` | UUID |
| `erreurs[].raison` | string |

**Comportement** : chaque entrée est traitée dans une transaction isolée. Une entrée invalide (R20 : pas d'emploi du temps correspondant) ne bloque pas les autres — cf. MASTER_CONTEXT.md R20.

---

### `GET /api/cahier-texte/enseignant/{personnelId}`
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`, `ENSEIGNANT`  
Tri par défaut : `dateCours DESC`.  
**Réponse 200** : `PageResponse<CahierTexteResponse>`

| Champ | Type |
|-------|------|
| `id` | UUID |
| `etablissementId` | UUID |
| `enseignantId` | UUID |
| `classeId` | UUID |
| `matiereId` | UUID |
| `dateCours` | LocalDate |
| `heureDebut` | LocalTime |
| `heureFin` | LocalTime |
| `chapitre` | string |
| `contenu` | string |
| `dateCreationClient` | LocalDateTime |
| `dateSynchronisation` | LocalDateTime |
| `statutValidation` | `NON_VALIDE` \| `VALIDE` |
| `observationsResponsable` | string \| null |
| `valideParId` | UUID \| null |
| `dateValidationObservation` | LocalDateTime \| null |

---

### `GET /api/cahier-texte/classe/{classeId}`
**Accès** : `SUPER_ADMIN`, `SECRETARIAT`, `ENSEIGNANT`

**Paramètres de requête** (tous optionnels) :
| Paramètre | Type | Description |
|-----------|------|-------------|
| `matiereId` | UUID | Filtre par matière |
| `dateDebut` | LocalDate | Filtre à partir de cette date (ISO `YYYY-MM-DD`) |
| `dateFin` | LocalDate | Filtre jusqu'à cette date |

Tri par défaut : `dateCours DESC`.  
**Réponse 200** : `PageResponse<CahierTexteResponse>`

---

### `PUT /api/cahier-texte/{id}/valider`
**Accès** : `SUPER_ADMIN`

Corps (optionnel — peut être omis ou `null`) :
| Champ | Type |
|-------|------|
| `observationsResponsable` | string \| null |

**Réponse 200** : `CahierTexteResponse` (statut = `VALIDE`) | **Erreurs** : 404

---

## Module 12 — Vitrine (`/api/vitrine`)

> Tous les endpoints GET de ce module sont **publics** (aucun JWT requis).
> Les endpoints d'écriture (POST, PUT, DELETE) nécessitent `SUPER_ADMIN` ou `COMMUNICATION`.

---

### Contenu paramétrable (`/api/vitrine/contenu`)

#### `GET /api/vitrine/contenu/{cle}` — Public
**Paramètre chemin** : `cle` — identifiant du bloc (ex: `MOT_FONDATEUR`, `REGLEMENT_INTERIEUR`)

**Réponse 200** :
| Champ | Type |
|-------|------|
| `id` | UUID |
| `cle` | string |
| `contenu` | string \| null |
| `fichierUrl` | string \| null |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

**Erreurs** : 404

#### `PUT /api/vitrine/contenu/{cle}` — Upsert (créer ou mettre à jour)
**Accès** : `SUPER_ADMIN`, `COMMUNICATION`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `contenu` | string | Optionnel |
| `fichierUrl` | string | Optionnel |

**Réponse 200** : objet ci-dessus. Idempotent — si la clé existe déjà, la met à jour ; sinon la crée.

---

### Équipe pédagogique (`/api/vitrine/equipe-pedagogique`)

#### `GET /api/vitrine/equipe-pedagogique` — Public
**Réponse 200** : `List<MembreEquipePedagogiqueResponse>` (triée par `ordre ASC`)
| Champ | Type |
|-------|------|
| `id` | UUID |
| `nom` | string |
| `fonction` | string |
| `photoUrl` | string \| null |
| `ordre` | number (entier) |

#### `POST /api/vitrine/equipe-pedagogique` — Créer
**Réponse 201** : `MembreEquipePedagogiqueResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `nom` | string | Obligatoire, non vide |
| `fonction` | string | Obligatoire, non vide |
| `photoUrl` | string | Optionnel |
| `ordre` | number | Obligatoire |

#### `PUT /api/vitrine/equipe-pedagogique/{id}` — Modifier
**Corps** : idem POST | **Réponse 200** | **Erreurs** : 404

#### `DELETE /api/vitrine/equipe-pedagogique/{id}` — Supprimer
**Réponse 204** | **Erreurs** : 404

---

### Listes scolaires (`/api/vitrine/listes-scolaires`)

#### `GET /api/vitrine/listes-scolaires/{classeId}` — Public
**Réponse 200** : `List<ListeScolaireResponse>` (0, 1 ou 2 éléments selon ce qui existe)
| Champ | Type |
|-------|------|
| `id` | UUID |
| `classeId` | UUID |
| `classeLibelle` | string |
| `typeListe` | `MANUELS` \| `FOURNITURES` |
| `contenu` | string |

#### `PUT /api/vitrine/listes-scolaires` — Upsert
**Accès** : `SUPER_ADMIN`, `COMMUNICATION`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `classeId` | UUID | Obligatoire |
| `typeListe` | enum | Obligatoire : `MANUELS` \| `FOURNITURES` |
| `contenu` | string | Obligatoire, non vide |

**Réponse 200** : `ListeScolaireResponse`. Idempotent par (classeId, typeListe).  
**Erreurs** : 404 (classeId inconnu)

---

### Actualités (`/api/vitrine/actualites`)

#### `GET /api/vitrine/actualites` — Public, paginé
Filtre automatique : seules les actualités avec `publie = true` sont retournées.  
Tri par défaut : `datePublication DESC`.

**Réponse 200** : `PageResponse<ActualiteResponse>`
| Champ | Type |
|-------|------|
| `id` | UUID |
| `titre` | string |
| `contenu` | string |
| `datePublication` | LocalDate |
| `imageUrl` | string \| null |
| `publie` | boolean |
| `dateCreation` | LocalDateTime |
| `dateModification` | LocalDateTime \| null |

#### `POST /api/vitrine/actualites` — Créer
**Réponse 201** : `ActualiteResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `titre` | string | Obligatoire, non vide |
| `contenu` | string | Obligatoire, non vide |
| `datePublication` | LocalDate | Obligatoire |
| `imageUrl` | string | Optionnel |
| `publie` | boolean | Optionnel (défaut `true`) |

#### `PUT /api/vitrine/actualites/{id}` — Modifier (dont dépublication)
**Corps** : idem POST | **Réponse 200** | **Erreurs** : 404

#### `DELETE /api/vitrine/actualites/{id}` — Supprimer
**Réponse 204** | **Erreurs** : 404

---

### Calendrier (`/api/vitrine/calendrier`)

#### `GET /api/vitrine/calendrier` — Public
**Réponse 200** : `List<EvenementCalendrierResponse>` (triée par `dateDebut ASC`)
| Champ | Type |
|-------|------|
| `id` | UUID |
| `libelle` | string |
| `description` | string \| null |
| `dateDebut` | LocalDate |
| `dateFin` | LocalDate \| null (null = événement d'un seul jour) |

#### `POST /api/vitrine/calendrier` — Créer
**Réponse 201** : `EvenementCalendrierResponse`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `libelle` | string | Obligatoire, non vide |
| `description` | string | Optionnel |
| `dateDebut` | LocalDate | Obligatoire |
| `dateFin` | LocalDate | Optionnel (absent = jour unique) |

#### `PUT /api/vitrine/calendrier/{id}` — Modifier
**Corps** : idem POST | **Réponse 200** | **Erreurs** : 404

#### `DELETE /api/vitrine/calendrier/{id}` — Supprimer
**Réponse 204** | **Erreurs** : 404

---

## Récapitulatif des rôles

| Rôle | Périmètre |
|------|-----------|
| `SUPER_ADMIN` | Accès complet à tous les modules |
| `SECRETARIAT` | Élèves, classes, personnel, emplois du temps, discipline, finances (lecture/saisie) |
| `ECONOMAT` | Finances (versements, quittances, moratoires, alertes), paie (bulletins), état financiers |
| `ENSEIGNANT` | Emplois du temps (lecture), notes (saisie de ses classes via R12), cahier de texte, validation notes (R21) |
| `PARENT` | Espace parent (mes-enfants, suivi, workflow inscription) |
| `COMMUNICATION` | Vitrine (écriture), lecture des ressources de paramétrage |

## Permissions explicites (au-delà des rôles)

| Permission | Accordée à | Endpoint concerné |
|-----------|-----------|-------------------|
| `ELEVE_SUPPRIMER` | Configuré manuellement | `DELETE /api/eleves/{id}` |
| `SCOLARITE_TAUX_MODIFIER` | Configuré manuellement | POST/PUT/DELETE `/api/taux-scolarite` |
| `QUOTAS_MODIFIER` | Configuré manuellement | POST/PUT/DELETE `/api/quotas-horaires` |
| `NOTES_VALIDER` | Configuré manuellement | `PUT /api/resultats/notes/valider` |
| `QUOTAS_VALIDER` | Configuré manuellement | (cf. MASTER_CONTEXT.md) |
