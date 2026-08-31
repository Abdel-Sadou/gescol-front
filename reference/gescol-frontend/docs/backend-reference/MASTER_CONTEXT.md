# MASTER_CONTEXT — GESCOL (Logiciel de Gestion Scolaire)

Document de référence pour toutes les sessions Claude Code sur le backend.
À fournir en contexte au début de chaque prompt (reference-first).

Dérivé du Cahier des charges v.finale (COBIMAG), généralisé pour être
réutilisable par plusieurs établissements sans réécriture de code (cf. §4.11
et §11.6 du cahier des charges).

---

## 1. Stack technique

- **Backend** : Spring Boot 3.x, Java 21
- **Base de données** : PostgreSQL
- **Architecture** : monolithe modulaire (un module = un package racine, pas de microservices)
- **Sécurité** : Spring Security + JWT
- **Migrations** : Flyway
- **Build** : Gradle

## 2. Principe transversal : établissement scopé

Toute donnée propre à un établissement hérite de `EtablissementScopedEntity`
(voir §4). Aucune valeur d'identité (nom, logo, couleurs) ni règle métier
(discipline, paie) n'est codée en dur — tout passe par la table `etablissement`
et ses tables de configuration associées.

Hiérarchie réelle (établie en PROMPT_01) :

```java
@MappedSuperclass
public abstract class BaseEntity {
    @Id @GeneratedValue
    private UUID id;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;

    @PrePersist void prePersist() { dateCreation = LocalDateTime.now(); }
    @PreUpdate  void preUpdate()  { dateModification = LocalDateTime.now(); }
}

@MappedSuperclass
public abstract class EtablissementScopedEntity extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "etablissement_id", nullable = false)
    private Etablissement etablissement;
}
```

Toute entité étend l'une des deux — jamais les deux directement, jamais aucune
des deux. `Etablissement` elle-même étend `BaseEntity` (pas scopée, c'est la
racine du scoping).

**Résolution de l'établissement courant** (services métier) : jamais de
requête `findFirstByActifTrue()` dans un service métier — toujours via
`CurrentEtablissementProvider.getEtablissementIdCourant()` (voir ADR-006).

**Endpoints publics (sans JWT)** : résolution via
`EtablissementResolver.getEtablissementCourantPublic()` (établi PROMPT_16,
factorise `findFirstByActifTrue()`) — à utiliser pour tout nouvel endpoint
public. Note de cohérence mineure : `InscriptionService` (PROMPT_08bis,
premier cas de ce genre) appelle encore directement
`findFirstByActifTrue()` plutôt que ce nouvel utilitaire — fonctionnellement
identique, à unifier un jour sans urgence.

## 3. Modules et packages

```
com.gescol
 ├── etablissement      (config, branding)
 ├── auth                (utilisateurs, rôles, permissions, JWT)
 ├── parametrage         (classes, trimestres, taux, quotas, matières, coefficients, niveaux)
 ├── eleve               (élèves, recherche, suppression conditionnée)
 ├── personnel           (enseignants, non-enseignants, matricules PE/SP/VA)
 ├── emploidutemps        (créneaux, contrôle de non-chevauchement)
 ├── resultats           (notes, coefficients, bulletins)
 ├── discipline          (sanctions, moteur d'escalade, bons de sortie/entrée)
 ├── finances            (scolarité, quittances, moratoires, alertes)
 ├── paie                (barèmes, bulletins de paie)
 ├── parent              (comptes parents, inscription en ligne)
 ├── cahierdetexte       (progression pédagogique, sync offline — module isolé, phase finale)
 └── vitrine             (actualités, calendrier — content management simple)
```

## 4. Entités principales et scoping établissement

| Entité | Package | `etablissement_id` | Nature |
|---|---|---|---|
| `Etablissement` | etablissement | — (racine) | Config/branding |
| `Utilisateur` | auth | ✅ | Donnée scopée |
| `Role`, `Permission` | auth | ❌ (référentiel global) | Global |
| `Classe` | parametrage | ✅ | Donnée scopée |
| `Trimestre`, `Sequence` | parametrage | ✅ | Donnée scopée |
| `TauxScolarite` | parametrage | ✅ | Donnée scopée |
| `QuotaHoraire` | parametrage | ✅ | Donnée scopée |
| `ModeleLettreEngagement` | parametrage | ✅ | Config (texte + variables) |
| `Matiere`, `Coefficient`, `Niveau` | parametrage | ✅ | Donnée scopée |
| `Eleve` | eleve | ✅ | Donnée scopée — matricule unique **par établissement** |
| `Personnel` | personnel | ✅ | Donnée scopée — matricule unique **par établissement** |
| `EmploiDuTemps` | emploidutemps | — (via Classe/Personnel) | Rattachée |
| `RegleDiscipline` | discipline | ✅ | **Config** (seuils d'escalade) |
| `TypeSanction` | discipline | ❌ (enum global) | Global |
| `Sanction`, `BonSortie` | discipline | ✅ | Donnée scopée |
| `Versement`, `Quittance` | finances | ✅ | Donnée scopée |
| `Moratoire` | finances | ✅ | Donnée scopée |
| `SeuilAlerteRetard` | finances | ✅ | Config |
| `BaremePaie` | paie | ✅ | **Config** |
| `BulletinPaie` | paie | ✅ | Donnée scopée |
| `ParentEleve` | parent | ✅ | Donnée scopée — lie `Utilisateur` (rôle PARENT) à `Eleve`, pas de `CompteParent` séparé (ADR implicite PROMPT_08) |
| `Inscription` | parent | ✅ | Donnée scopée — workflow d'inscription (R7) |
| `Actualite`, `EvenementCalendrier` | vitrine | ✅ | Donnée scopée, lecture PUBLIQUE (sans JWT) |
| `ContenuVitrine` | vitrine | ✅ | Config générique clé/valeur, lecture PUBLIQUE |
| `MembreEquipePedagogique` | vitrine | ✅ | Donnée scopée, lecture PUBLIQUE |
| `ListeScolaireClasse` | vitrine | ✅ | Donnée scopée, lecture PUBLIQUE |

## 5. Enums globaux (jamais scopés établissement)

```java
enum Sexe { M, F }
enum SousSysteme { FRANCOPHONE, ANGLOPHONE }
enum GroupeSanguin { A_POS, A_NEG, B_POS, B_NEG, AB_POS, AB_NEG, O_POS, O_NEG, INCONNU }
enum TypeSanction { BLAME, ABSENCE_JUSTIFIEE, ABSENCE_NON_JUSTIFIEE, RETARD, RETENUE, AVERTISSEMENT, EXCLUSION_3J, EXCLUSION_8J, INTERPELLATION }
enum TypePersonnel { ENSEIGNANT, NON_ENSEIGNANT }
enum TypeContratPaie { VACATAIRE, SEMI_PERMANENT, PERMANENT }
enum RoleUtilisateur { SUPER_ADMIN, SECRETARIAT, ECONOMAT, ENSEIGNANT, PARENT, COMMUNICATION }
enum StatutInscription { RESERVEE, CONFIRMEE, ANNULEE }
```

## 6. Règles métier codifiées (référence R1-R9)

| Réf | Règle |
|---|---|
| **R1** | Matricule élève = `AAAA` + Sexe(G/F) + Numéro d'ordre, unique par établissement, jamais régénéré |
| **R2** | Suppression élève bloquée si scolarité déjà payée OU notes existantes ; nécessite permission `ELEVE_SUPPRIMER` |
| **R3** | Versement scolarité = opération atomique ; décrément immédiat et irréversible du solde ; quittance numérotée séquentiellement, non modifiable |
| **R4** | Un enseignant ne peut être positionné sur deux classes à la même plage horaire (contrôle à la création/modification d'emploi du temps) |
| **R5** | Escalade disciplinaire selon `RegleDiscipline` paramétrée par établissement (ex. 3 blâmes → exclusion 3j) — jamais codée en dur |
| **R6** | Paie vacataire = heures effectuées × taux horaire ; IRPP = brut × `BaremePaie.tauxIRPP` (configurable par établissement, pas une constante — 11% est la valeur de seed par défaut, pas une règle figée) ; net = brut − IRPP |
| **R7** | Une seule inscription active par élève et par année scolaire |
| **R8** | Matricule personnel = `AAAA` + type (PE/SP/VA) + numéro, unique par établissement |
| **R9** | Moratoire validé retire l'élève de la liste des retards ; priorité de traitement aux redoublants |
| **R10** | Suppression `Personnel` autorisée seulement si aucun `EmploiDuTemps` ni `BulletinPaie` n'y fait référence ; sinon 409 invitant à utiliser `PUT /api/personnel/{id}/desactiver` (préserve l'historique, ne bloque pas juste sans solution) |
| **R11** | Année scolaire courante = bascule au 1er septembre (`AnneeScolaireUtils.courante()`, `com.gescol.common.util`, établi en PROMPT_05) — tout module ayant besoin de "l'année scolaire en cours" réutilise cette méthode, ne réimplémente jamais cette logique localement |
| **R12** | Un `ENSEIGNANT` ne peut saisir/modifier une note que s'il existe un `EmploiDuTemps` le liant à la classe et la matière concernées (`NoteService.verifierCreneau()`) ; `SUPER_ADMIN` contourne cette vérification |
| **R13** | Une note au statut `VALIDEE` est immuable via l'endpoint de saisie standard (409) ; seule la permission `NOTES_VALIDER` via l'endpoint dédié peut la faire évoluer |
| **R14** | Le calcul de moyenne générale ignore les matières sans note saisie (ne compte jamais une absence de note comme zéro) ; retourne `null` si aucune note n'existe encore pour la séquence |
| **R15** | Escalade disciplinaire (R5) déclenchée par égalité stricte (`count == seuil`, pas `>=`) pour éviter un re-déclenchement à chaque sanction suivante ; sanction générée automatiquement marquée `genereParEscalade=true`, `enregistrePar=null` |
| **R16** | Un `PARENT` ne peut consulter ou agir que sur les élèves/inscriptions liés via `ParentEleve` dans l'établissement courant ; violation → `AccessForbiddenException` (403), distinct de `BusinessRuleViolationException` (409) — cf. CONVENTIONS pour la distinction 403/409. Note : réimplémenté indépendamment dans `ValidationBancaireService` (module finances, PROMPT_11) plutôt que de réutiliser `ParentAccessGuard` (module parent), pour éviter une dépendance croisée — duplication mineure connue, à unifier si `ParentAccessGuard` évolue |
| **R17** | Paie `PERMANENT`/`SEMI_PERMANENT` : seules les retenues salariales (IRPP, centimes additionnels, taxe communale, Crédit Foncier salarial, redevance audiovisuelle, pension vieillesse salariale) réduisent le net ; les charges patronales (Crédit Foncier patronal, FNE, pension vieillesse patronale, allocations familiales, accident de travail) figurent sur le bulletin sans être déduites du net |
| **R18** | Un `Versement` en `VALIDATION_BANCAIRE` démarre au statut `EN_ATTENTE_VALIDATION` (déclarable par `PARENT` sur ses propres enfants, R16, ou par le personnel administratif) et ne compte JAMAIS dans le solde (`SoldeService`, ADR-007) ni ne génère de numéro de quittance tant qu'un `ECONOMAT`/`SUPER_ADMIN` ne l'a pas validé manuellement après vérification sur le relevé bancaire réel — aucune vérification automatique n'est possible sans intégration bancaire, le contrôle humain est une nécessité, pas un choix de simplicité. `CAISSE` reste validé immédiatement (le contrôle a déjà eu lieu physiquement) |
| **R19** | Génération d'un `BulletinPaie` en `VIREMENT_BANCAIRE` exige `Personnel.numeroCompteBancaire` ET `nomBanque` renseignés, vérifié AVANT toute persistance ; l'ordre de virement exige aussi les coordonnées bancaires de l'établissement |
| **R20** | Symétrique à R12 côté cahier de texte : un `ENSEIGNANT` ne peut synchroniser une entrée que s'il existe un `EmploiDuTemps` le liant à la classe et la matière concernées (réutilise la même requête que R12, pas de duplication) ; `SUPER_ADMIN` contourne la vérification |
| **R21** | Le professeur principal d'une classe (`Classe.professeurPrincipal`) peut valider les notes et consulter/générer les bulletins de tous les élèves de sa classe, indépendamment de R12 — vérifié via `ProfesseurPrincipalGuard`, centralisé, réutilisé entre `NoteService` et `BulletinService`. Sur la validation en lot, chaque classe distincte représentée dans le lot est vérifiée séparément (fail-closed : un seul échec rejette la totalité du lot, aucune validation partielle) |

### 6.1 Points de vigilance transactionnels

- **`EleveService.creer()` n'est pas transactionnel au niveau service** — le
  retry sur collision de matricule (§0 PROMPT_03) utilise `REQUIRES_NEW` par
  tentative, donc chaque création d'élève commit indépendamment dès son
  succès. Conséquence pour le futur module Espace Parent (workflow
  d'inscription) : on ne peut **pas** englober "créer l'élève + réserver
  l'inscription" dans une seule transaction englobante rollback-able en
  appelant simplement `EleveService.creer()` — il faudra soit une méthode
  dédiée sans le pattern retry, soit accepter une réconciliation a posteriori
  en cas d'échec de l'étape suivante. À trancher explicitement lors du prompt
  Espace Parent, pas à découvrir en cours de route.

## 7. Matrice des permissions (référence P1-P6, par rôle)

| Rôle | Périmètre |
|---|---|
| **P1** `SUPER_ADMIN` | Tous droits, y compris paramétrage sensible (taux, quotas, suppression élève, ouverture d'année) |
| **P2** `SECRETARIAT` | Élèves, inscriptions, consultation — pas de droits sensibles |
| **P3** `ECONOMAT` | Finances (scolarité + paie), états financiers |
| **P4** `ENSEIGNANT` | Emploi du temps, notes de ses classes uniquement |
| **P5** `PARENT` | Espace parent uniquement, ses enfants |
| **P6** `COMMUNICATION` | Actualités et contenus vitrine |

Actions soumises à autorisation explicite (permission dédiée, pas juste le rôle) :
suppression élève, modification taux de scolarité, modification quotas horaires,
validation des notes, validation des quotas horaires (incidence financière).

## 8. Carte API (base, par module)

```
/api/etablissement/courant          GET, PUT (branding, config)
/api/auth/login                     POST
/api/auth/refresh                   POST
/api/eleves                         GET (recherche), POST, GET /{id}, PUT /{id}, DELETE /{id}
/api/eleves/{id}/matricule          GET
/api/classes, /api/trimestres, /api/taux-scolarite, /api/quotas-horaires   CRUD standard
/api/personnel                      CRUD + génération matricule
/api/emplois-du-temps                GET, POST (avec validation R4), PUT
/api/resultats/notes                POST (saisie), GET /bulletin/{eleveId}
/api/discipline/sanctions           POST, GET /eleve/{id}
/api/discipline/regles              CRUD (config établissement)
/api/finances/versements            POST, GET /eleve/{id}
/api/finances/quittances/{id}/pdf   GET
/api/finances/moratoires            POST, PUT /valider
/api/paie/baremes                   CRUD (config établissement)
/api/paie/bulletins                 POST (génération), GET /{id}/pdf
/api/parent/comptes                 POST (création), GET /moi
/api/parent/inscriptions            POST (workflow 5 étapes)
```

## 9. Contraintes de non-régression pour Claude Code

- Toujours créer les migrations Flyway correspondantes (jamais de `ddl-auto: update` en pratique de dev sérieuse)
- Toute nouvelle entité scopée établissement hérite de `EtablissementScopedEntity`
- Toute contrainte d'unicité "métier" (matricule élève, matricule personnel) est **composite avec `etablissement_id`**, jamais globale seule
- Pas de valeur d'identité visuelle ou de règle métier codée en dur dans le code Java — tout passe par les tables de config
