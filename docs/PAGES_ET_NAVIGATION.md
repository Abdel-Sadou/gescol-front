# PAGES_ET_NAVIGATION — Application interne (App)

Carte complète et définitive des pages, du menu, et de leurs dépendances
API — établie avant F08+ pour éviter toute restructuration de menu en
cours de route. À fournir en contexte pour chaque prompt F08 à F16.

Ne couvre que la zone **Application interne** (Poseidon/PrimeNG). Vitrine
et Espace Parent ont leur propre structure, déjà posée (F04-F07).

---

## 1. Arborescence du menu (sidebar Poseidon)

```
Tableau de bord                                    [tous rôles]

Élèves                                              [SUPER_ADMIN, SECRETARIAT, ECONOMAT*, ENSEIGNANT*]
├── Liste des élèves                                [SUPER_ADMIN, SECRETARIAT, ECONOMAT, ENSEIGNANT]
└── Nouvel élève                                    [SUPER_ADMIN, SECRETARIAT]

Paramétrage                                         [SUPER_ADMIN principalement]
├── Classes                                         [lecture: tous sauf PARENT ; écriture: SUPER_ADMIN, SECRETARIAT]
├── Trimestres & séquences                          [lecture: idem ; écriture: SUPER_ADMIN]
├── Taux de scolarité                                [lecture: idem ; écriture: perm. SCOLARITE_TAUX_MODIFIER]
├── Quotas horaires                                  [lecture: idem ; écriture: perm. QUOTAS_MODIFIER]
├── Matières                                         [lecture: idem ; écriture: SUPER_ADMIN]
├── Coefficients                                     [lecture: idem ; écriture: SUPER_ADMIN]
├── Niveaux                                          [lecture: idem ; écriture: SUPER_ADMIN]
└── Modèles de lettre d'engagement                   [lecture: idem ; écriture: SUPER_ADMIN]

Personnel                                            [SUPER_ADMIN, SECRETARIAT, ECONOMAT lecture]
├── Liste du personnel
└── Nouveau personnel                                [SUPER_ADMIN, SECRETARIAT]

Emploi du temps                                      [SUPER_ADMIN, SECRETARIAT, ENSEIGNANT lecture propre]
├── Par classe
├── Par enseignant
└── Nouveau créneau                                  [SUPER_ADMIN, SECRETARIAT]

Résultats                                            [ENSEIGNANT, SUPER_ADMIN, SECRETARIAT lecture]
├── Saisie des notes                                 [ENSEIGNANT (R12), SUPER_ADMIN]
├── Validation des notes                             [perm. NOTES_VALIDER, ou professeur principal (R21)]
└── Bulletins

Discipline                                           [ENSEIGNANT, SECRETARIAT, SUPER_ADMIN]
├── Sanctions (saisie + historique)                  [ENSEIGNANT sans restriction R12, cf. PROMPT_07]
├── Bons de sortie / entrée                          [SECRETARIAT, SUPER_ADMIN]
└── Règles d'escalade                                [SUPER_ADMIN]

Finances                                             [ECONOMAT, SUPER_ADMIN, SECRETARIAT lecture]
├── Versements                                       [écriture: ECONOMAT, SUPER_ADMIN]
├── Validations bancaires en attente                 [ECONOMAT, SUPER_ADMIN — R18]
├── Moratoires                                       [demande: SECRETARIAT/ECONOMAT/SUPER_ADMIN ; validation: ECONOMAT/SUPER_ADMIN]
├── Alertes de retard                                [ECONOMAT, SUPER_ADMIN]
└── États & rapports                                 [lecture: SECRETARIAT, ECONOMAT, SUPER_ADMIN]

Paie                                                 [ECONOMAT, SUPER_ADMIN — jamais SECRETARIAT]
├── Barèmes                                          [SUPER_ADMIN uniquement]
└── Bulletins de paie                                [génération/consultation: ECONOMAT, SUPER_ADMIN]

Cahier de texte                                      [ENSEIGNANT, SUPER_ADMIN]
├── Ma progression                                   [ENSEIGNANT, écrit ses propres entrées R20]
├── Consultation par classe                          [SUPER_ADMIN, SECRETARIAT, ENSEIGNANT]
└── Validation & observations                        [SUPER_ADMIN — cf. rôle animateur pédagogique non créé]

Communication                                        [SUPER_ADMIN, COMMUNICATION]
├── Actualités
├── Calendrier scolaire
├── Contenu du site (mot du fondateur, règlement, etc.)
└── Équipe pédagogique

Fiche élève (accès direct, hors arborescence — déjà construit, style
custom exception ADR-011)                            [SUPER_ADMIN, SECRETARIAT, ECONOMAT, ENSEIGNANT]
```

`*` = accès en lecture uniquement, jamais en écriture.

---

## 2. Table des pages — dépendances API précises

| Page | Route proposée | Endpoint(s) principaux | Prompt cible |
|---|---|---|---|
| Tableau de bord | `/app` | Aucun au départ (statique ou petits compteurs simples) | F08 |
| Liste élèves | `/app/eleves` | `GET /api/eleves` | F08 |
| Nouvel/édition élève | `/app/eleves/nouveau`, `/app/eleves/:id/editer` | `POST` / `PUT /api/eleves/:id` | F08 |
| Fiche élève | `/app/fiche-eleve` | `GET /api/eleves/:id`, `DELETE` (R2) | Fait (F04) |
| Classes | `/app/parametrage/classes` | `GET/POST/PUT/DELETE /api/classes` + `PUT .../professeur-principal` | F09 |
| Trimestres & séquences | `/app/parametrage/trimestres` | `GET/POST/PUT/DELETE /api/trimestres`, `/api/sequences` | F09 |
| Taux de scolarité | `/app/parametrage/taux-scolarite` | `GET/POST/PUT/DELETE /api/taux-scolarite` | F09 |
| Quotas horaires | `/app/parametrage/quotas-horaires` | `GET/POST/PUT/DELETE /api/quotas-horaires` | F09 |
| Matières | `/app/parametrage/matieres` | `GET/POST/PUT/DELETE /api/matieres` | F09 |
| Coefficients | `/app/parametrage/coefficients` | `GET/POST/PUT/DELETE /api/coefficients` | F09 |
| Niveaux | `/app/parametrage/niveaux` | `GET/POST/PUT/DELETE /api/niveaux` | F09 |
| Modèles lettre engagement | `/app/parametrage/modeles-engagement` | `GET/POST/PUT/DELETE /api/modeles-engagement` | F09 |
| Liste personnel | `/app/personnel` | `GET /api/personnel` | F10 |
| Nouveau/édition personnel | `/app/personnel/nouveau`, `/:id/editer` | `POST/PUT/DELETE /api/personnel`, `/desactiver`, `/reactiver` | F10 |
| Emploi du temps par classe | `/app/emploi-du-temps/classe/:id` | `GET /api/emplois-du-temps/classe/:id` | F10 |
| Emploi du temps par enseignant | `/app/emploi-du-temps/enseignant/:id` | `GET /api/emplois-du-temps/enseignant/:id` | F10 |
| Nouveau créneau | `/app/emploi-du-temps/nouveau` | `POST /api/emplois-du-temps` (R4) | F10 |
| Saisie des notes | `/app/resultats/saisie` | `POST /api/resultats/notes`, `/lot`, `GET .../classe/.../matiere/.../sequence/...` | F11 |
| Validation des notes | `/app/resultats/validation` | `PUT /api/resultats/notes/valider` (R13/R21) | F11 |
| Bulletins | `/app/resultats/bulletins` | `GET /api/resultats/bulletins/:eleveId/sequence/:sequenceId/pdf` | F11 |
| Sanctions | `/app/discipline/sanctions` | `POST /api/discipline/sanctions`, `GET .../eleve/:id`, `/classe/:id` | F12 |
| Bons de sortie/entrée | `/app/discipline/bons-sortie` | `POST /api/discipline/bons-sortie`, `PUT .../entree` | F12 |
| Règles d'escalade | `/app/discipline/regles` | `GET/POST/PUT/DELETE /api/discipline/regles` | F12 |
| Versements | `/app/finances/versements` | `POST /api/finances/versements`, `GET .../eleve/:id` | F13 |
| Validations bancaires | `/app/finances/validations` | `GET .../en-attente-validation`, `PUT .../valider`, `/rejeter` (R18) | F13 |
| Moratoires | `/app/finances/moratoires` | `POST/PUT /api/finances/moratoires`, `/en-attente` (R9) | F13 |
| Alertes de retard | `/app/finances/alertes` | `POST /api/finances/alertes/declencher`, `GET .../retards` | F13 |
| États & rapports | `/app/finances/etats` | `GET /api/finances/etats/*` | F13 |
| Barèmes de paie | `/app/paie/baremes` | `GET/POST/PUT/DELETE /api/paie/baremes` | F14 |
| Bulletins de paie | `/app/paie/bulletins` | `POST /api/paie/bulletins/generer`, `GET .../pdf`, `/ordre-virement/pdf` (R17/R19) | F14 |
| Cahier de texte (saisie) | `/app/cahier-texte/saisie` | `POST /api/cahier-texte/synchroniser` (R20, logique offline) | F15 |
| Cahier de texte (consultation) | `/app/cahier-texte/classe/:id` | `GET /api/cahier-texte/classe/:id` | F15 |
| Validation cahier de texte | `/app/cahier-texte/validation` | `PUT /api/cahier-texte/:id/valider` | F15 |
| Actualités (admin) | `/app/communication/actualites` | `GET/POST/PUT/DELETE /api/vitrine/actualites` (+ `/:id`) | F16 |
| Calendrier (admin) | `/app/communication/calendrier` | `GET/POST/PUT/DELETE /api/vitrine/calendrier` | F16 |
| Contenu du site (admin) | `/app/communication/contenu` | `PUT /api/vitrine/contenu/:cle` | F16 |
| Équipe pédagogique (admin) | `/app/communication/equipe` | `GET/POST/PUT/DELETE /api/vitrine/equipe-pedagogique` | F16 |

---

## 3. Ce que ça change pour F08

F08 doit désormais construire **le menu complet immédiatement** (toutes les
sections et sous-sections listées en §1, avec les bonnes conditions de
rôle), même si la plupart des routes pointent encore vers un placeholder
au début — exactement comme F01 l'avait fait au niveau des sections
principales, mais avec le détail des sous-menus cette fois. Ça évite de
retoucher `app.menu.ts` à chaque nouveau prompt F09-F16 : seul le contenu
de la page change, plus la structure du menu.
