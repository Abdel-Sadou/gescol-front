# PROMPT_F13 — Finances (versements, validation bancaire, moratoires, alertes, états)

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md,
docs/backend-reference/API_CONTRACT.md, docs/backend-reference/MASTER_CONTEXT.md
(règles R9, R18), DESIGN_SYSTEM.md fournis en contexte.

**Module sensible** : R18 (validation bancaire) est le mécanisme anti-fraude
central du projet — un versement déclaré ne compte JAMAIS avant validation
humaine explicite (cf. MASTER_CONTEXT R18, incident de conception déjà
corrigé une fois côté backend). Ce prompt doit refléter cette gravité dans
l'interface, pas juste brancher les endpoints.

---

## Prompt

```
Contexte : F08-F12 ont posé tous les patterns nécessaires. Vérifie les
champs exacts dans API_CONTRACT.md pour CHAQUE endpoint avant de coder —
ce module a le plus grand nombre d'endpoints de tous ceux construits
jusqu'ici, ne suppose rien.

## PARTIE 1 — Versements (caisse)

1. Recherche élève (réutilise le service existant depuis F08), saisie
   d'un versement caisse : montant, référence (recherche l'exact nom de
   champ dans API_CONTRACT.md). Génère la quittance immédiatement (mode
   CAISSE, validé instantanément côté backend).
2. Historique des versements d'un élève, avec statut visible (VALIDE/
   EN_ATTENTE_VALIDATION/REJETE — badges de couleur distincts).
3. Téléchargement quittance PDF (pattern blob déjà établi).

## PARTIE 2 — Validations bancaires en attente (R18 — LE PLUS SENSIBLE)

1. Liste des déclarations EN_ATTENTE_VALIDATION (GET .../en-attente-validation) :
   affiche bien en évidence le numéro de reçu bancaire ET le nom du
   signataire déclarés — c'est précisément ce que le comptable doit
   pouvoir comparer avec le relevé bancaire réel avant de décider. Ne
   résume pas ces informations, elles sont le cœur du contrôle.
2. Action "Valider" : confirmation explicite (pas un simple clic sans
   friction — DESIGN_SYSTEM ne préconise pas de sur-confirmer partout,
   mais ici c'est justifié : cette action affecte réellement le solde
   d'un élève et génère un numéro de quittance définitif). Le texte de
   confirmation doit rappeler que cette action suppose que le comptable a
   déjà vérifié le relevé bancaire réel — ne laisse pas croire que
   l'application vérifie quoi que ce soit automatiquement.
3. Action "Rejeter" : champ motifRejet obligatoire (pas de rejet sans
   justification écrite, cohérent avec ce que le backend exige).

## PARTIE 3 — Moratoires (R9)

1. Formulaire de demande (SECRETARIAT/ECONOMAT/SUPER_ADMIN) : élève, date
   proposée, motif.
2. Liste "en attente" : le backend trie déjà les redoublants en premier
   (R9) — respecte cet ordre de réponse, ne retrie pas côté client.
   Affiche un badge "Redoublant" visible sur les lignes concernées pour
   que la priorité soit lisible d'un coup d'œil, pas juste déductible de
   l'ordre.
3. Actions Valider/Refuser (ECONOMAT/SUPER_ADMIN).
4. Historique filtrable par statut.

## PARTIE 4 — Alertes de retard

1. Liste des élèves en retard (lecture, GET .../alertes/retards).
2. Bouton "Déclencher les alertes" (POST .../declencher) avec
   confirmation — précise dans le texte de confirmation que ceci
   déclenche l'envoi réel des notifications configurées (actuellement un
   simple log côté backend, cf. MASTER_CONTEXT — ne décris pas l'action
   comme un envoi de SMS réel si ce n'est pas encore le cas, reste fidèle
   à l'état réel du backend).
3. Configuration du seuil (GET/PUT .../alertes/seuil) : formulaire simple,
   SUPER_ADMIN/ECONOMAT.

## PARTIE 5 — États & rapports

1. Versements par classe : sélection d'une classe, tableau élèves avec
   total versé et reste à payer (GET .../etats/classe/{id}/versements).
2. Totaux par période : sélection de deux dates, affiche le total
   (GET .../etats/totaux).

## SÉCURITÉ UI

Cohérent avec PAGES_ET_NAVIGATION.md §1. Rappel renforcé pour ce module :
aucun contrôle frontend ne remplace la vérification backend — c'est
particulièrement vrai ici (R18), ne construis jamais de logique qui
donnerait l'impression que l'application valide quoi que ce soit
automatiquement.

## i18n

Scope 'app', FR + EN, ADR-012.

## AUTO-VÉRIFICATION (documente le résultat en tête du handoff)

1. Champs conformes à API_CONTRACT.md pour tous les endpoints (liste-les,
   ce module en a beaucoup, une erreur est plus probable qu'ailleurs)
2. Numéro de reçu bancaire ET signataire clairement visibles sur l'écran
   de validation — pas résumés ou tronqués
3. Confirmation de validation R18 mentionne explicitement la vérification
   humaine préalable, ne suggère aucune vérification automatique
4. Rejet impossible sans motif renseigné
5. Tri redoublants-en-premier des moratoires respecté tel que renvoyé par
   le backend (pas retrié côté client)
6. Le texte du bouton "Déclencher les alertes" reste fidèle à l'état réel
   (log, pas un vrai envoi SMS/email)
7. Aucun texte français en dur
8. Routes conformes à PAGES_ET_NAVIGATION.md §2

À la fin, un seul résumé de handoff avec le résultat de
l'auto-vérification en premier — pour ce module, signale explicitement
tout endpoint dont le format de réponse t'a semblé ambigu ou sous-
documenté dans API_CONTRACT.md, plutôt que de deviner silencieusement.
```
