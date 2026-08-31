# PROMPT_F07_CORRECTIFS — Correction des bugs de l'audit F07

**À utiliser avec** : FRONTEND_CONTEXT.md, docs/backend-reference/API_CONTRACT.md,
docs/AUDIT_F07_VITRINE_PARENT.md fournis en contexte.

---

## Prompt

```
Contexte : correctifs suite à l'audit F07. Traite chaque point dans
l'ordre — certains nécessitent une vérification API avant de coder, ne
saute pas cette étape.

## Correctif 1 — Historique versements : erreur réseau vs vide (bug #1)

parent-dashboard.ts:162 doit distinguer explicitement "aucun versement"
(liste vide, réponse 200 réelle) de "erreur réseau" (échec de l'appel) —
même pattern found/error déjà établi ailleurs dans ce fichier pour les
autres sources de données. Actuellement les deux cas affichent "Aucun
versement", ce qui cache une vraie panne.

## Correctif 2 — Bouton Télécharger mal câblé (bug #2)

parent-dashboard.ts:188 : le bouton "Télécharger" doit appeler
downloadPdf(versementId), pas goQuittanceDetail. Vérifie s'il doit AUSSI
garder un accès à goQuittanceDetail ailleurs (ex. un bouton "Voir le
détail" séparé) — ne supprime pas cette fonction si elle a un usage
légitime par ailleurs, corrige juste le mauvais câblage.

## Correctif 3 — Boutons d'inscription non fonctionnels (bug #3)

"+ Nouvelle inscription" et "Inscrire mon enfant" pointent vers noop() car
le workflow d'inscription en 5 étapes n'existe pas encore (prompt séparé
F07bis, à venir). Décision : désactive-les visuellement (attribut disabled
ou classe visuelle grisée, cohérent avec le pattern déjà utilisé ailleurs
dans le projet pour un lien inactif) avec une info-bulle ou un texte
"Bientôt disponible" — ne les laisse pas cliquables sans effet.

## Correctif 4 — Mot de passe oublié (bug #4)

Aucune fonctionnalité de réinitialisation de mot de passe n'existe côté
backend (vérifié : absente d'API_CONTRACT.md). Même traitement que le
correctif 3 : désactive visuellement le lien "Mot de passe oublié" avec
indication "Bientôt disponible", plutôt que de corriger seulement le
rechargement de page pour un lien qui ne mène nulle part. Signale ce
manque dans le résumé de fin — ce sera un vrai prompt à part si le besoin
se confirme.

## Correctif 5 — Aperçu quittance statique (bug #5)

1. Vérifie d'abord dans API_CONTRACT.md si un endpoint GET pour un
   versement individuel existe (GET /api/finances/versements/{id}).
2. S'il existe : utilise-le directement pour peupler l'aperçu avec les
   vraies données (montant, date, solde après versement, numéro de
   quittance, infos élève/classe).
3. S'il n'existe PAS : utilise l'endpoint de listing déjà disponible
   (GET /api/finances/versements/eleve/{eleveId}) et filtre côté client
   pour trouver le versement demandé — commente clairement
   // TODO(API): remplacer par un GET dédié si cette liste devient grande,
   cohérent avec la façon dont le cas similaire (article) a été traité.
   Le volume de versements par élève reste faible (quelques dizaines par
   an maximum), donc ce contournement est raisonnable ici, contrairement
   au cas des 100 actualités.
4. Applique le même pattern d'état (found/loading/error/notFound) que
   article.ts.

## Correctif 6 — Accessibilité boutons mot de passe (bug #6)

Ajoute un aria-label explicite ("Afficher le mot de passe" /
"Masquer le mot de passe", traduit via Transloco) sur les boutons toggle
de connexion.ts:83 et :146.

## Correctif 7 — Internationalisation des textes restants (bug #7, #8 partiel)

Le nom de l'établissement ("Marie Gisèle Bilingual College") reste codé en
dur pour l'instant — DÉCISION ASSUMÉE, pas un oubli : le branding
dynamique sera activé plus tard si besoin (cf. EtablissementService.nom,
déjà disponible mais volontairement pas utilisé ici pour l'instant). Ne
touche PAS à ces occurrences.

En revanche, passe par une clé Transloco classique dans le scope concerné
pour le reste des mentions listées : modes de paiement, Francophone/
Anglophone, "Espace Parent", badge 'Actualité'.

## Correctifs mineurs (🟡, à inclure si le temps le permet dans ce même
prompt)

- `goHistoriqueQuittance` : renomme ou reroute pour que le libellé "Voir
  les quittances" corresponde à un vrai accès à la liste, pas seulement au
  premier versement
- Ajoute `overflow-x: clip` sur le wrapper du dashboard parent (cf.
  convention déjà établie, FRONTEND_CONTEXT §4)
- Associe chaque `<input>` de connexion.ts à un `<label>` (via `for`/`id`)
- Gère l'échec de téléchargement PDF avec un message d'erreur visible
  (toast ou inline), pas un échec silencieux
- Ajoute un lien vers `#admissions` dans la nav vitrine si absent

## VÉRIFICATION

- Rejoue les 8 scénarios de bugs de docs/AUDIT_F07_VITRINE_PARENT.md,
  confirme chacun résolu (sauf le nom d'établissement, cf. correctif 7,
  laissé statique volontairement)

À la fin, résumé de handoff complet, en particulier la décision prise pour
le correctif 5 (endpoint dédié trouvé ou contournement).
```
