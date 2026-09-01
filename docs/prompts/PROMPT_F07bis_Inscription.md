# PROMPT_F07bis — Espace Parent : workflow d'inscription en 5 étapes

**À utiliser avec** : FRONTEND_CONTEXT.md, docs/backend-reference/API_CONTRACT.md,
docs/backend-reference/MASTER_CONTEXT.md, PAGES_ET_NAVIGATION.md fournis en
contexte. **Aucune référence visuelle directe** (le code de démo ne
couvrait pas cet écran, contrairement au dashboard/quittance) — reprends
le style déjà établi (couleurs CSS, polices Lora/Work Sans, cartes) plutôt
que d'inventer un nouveau langage visuel.

---

## Prompt

```
Contexte : les boutons "+ Nouvelle inscription" et "Inscrire mon enfant"
sont désactivés depuis PROMPT_F07_CORRECTIFS, en attendant ce prompt qui
construit le vrai parcours d'inscription (cahier des charges §7.2, déjà
entièrement fonctionnel côté backend depuis PROMPT_08bis).

## PARTIE 0 — Vérification préalable OBLIGATOIRE avant tout code

L'étape 2 du parcours (modalités de paiement) nécessite normalement
d'afficher un tableau des frais par classe pour que le parent choisisse.
Mais l'endpoint de lecture des Classe/TauxScolarite (module Paramétrage,
PROMPT_03) est explicitement fermé au rôle PARENT côté backend
(MASTER_CONTEXT : "lecture pour tous les rôles authentifiés sauf PARENT").

AVANT d'écrire quoi que ce soit : vérifie dans API_CONTRACT.md si un
endpoint accessible à PARENT permet de lister les classes disponibles
avec leurs taux (peut-être un endpoint dédié déjà prévu que je n'ai pas
identifié, ou l'endpoint GET /api/parent/inscriptions/modalites-paiement/
{classeId} pourrait en réalité accepter un appel sans classeId pour lister
— vérifie sa signature exacte).

SI aucun moyen n'existe pour un PARENT de connaître la liste des classes
et leurs tarifs : ARRÊTE-TOI ICI, ne construis pas de contournement, et
rends un rapport clair de ce blocage précis dans le résumé de fin — je
préparerai un correctif backend séparé avant de continuer ce prompt.

## PARTIE 1 — InscriptionService (si Partie 0 confirme que c'est possible)

Service exposant les 6 opérations déjà fonctionnelles côté backend :
- getCriteres() → GET /api/parent/inscriptions/criteres
- getModalitesPaiement(classeId) → GET .../modalites-paiement/{classeId}
- reserver(matricule, classeId) → POST .../reserver
- majInformationsParent(inscriptionId, data) → PUT .../{id}/informations-parent
- confirmer(inscriptionId) → POST .../{id}/confirmer
- getMesInscriptions() → GET /api/parent/mes-inscriptions
- getLettreEngagementPdf(inscriptionId) → GET .../{id}/lettre-engagement/pdf
  (pattern blob, comme la quittance — jamais de token en URL)

Vérifie chaque forme de réponse exacte dans API_CONTRACT.md avant de coder
le mapping.

## PARTIE 2 — Parcours en 5 étapes (assistant multi-écrans)

Nouveau composant dans src/app/pages/parent/inscription/, sous
ParentLayout, route /parent/inscription/nouvelle. Style cohérent avec
l'existant (Espace Parent — CSS propre, ADR-011, zéro PrimeNG).

1. **Étape 1 — Critères** : affiche getCriteres(), boutons "J'accepte" +
   "Suivant" (pas de persistance à cette étape, juste navigation interne
   entre les 5 écrans du composant).
2. **Étape 2 — Modalités de paiement** : le parent choisit une classe
   (selon ce que la Partie 0 a permis de construire), affiche le tarif
   correspondant. "J'accepte" + "Suivant"/"Précédent".
3. **Étape 3 — Réservation** : formulaire matricule, appel reserver() au
   clic sur "J'accepte" (c'est ici que l'appel réseau réel a lieu, pas
   avant) — gère les erreurs R7 (déjà inscrit cette année) et 404
   (matricule inconnu) avec des messages clairs. "Suivant"/"Précédent".
4. **Étape 4 — Informations parent** : formulaire téléphone/localisation/
   fonction/email, appel majInformationsParent() sur "Validé". "Suivant"/
   "Précédent".
5. **Étape 5 — Confirmation** : bouton "Confirmer l'inscription" → appel
   confirmer(). Une fois confirmé, propose le téléchargement de la lettre
   d'engagement (getLettreEngagementPdf).

Progression visuelle claire entre les 5 étapes (indicateur d'étape, cf.
style déjà utilisé dans le projet si un pattern similaire existe déjà,
sinon un indicateur simple cohérent avec la charte).

## PARTIE 3 — Réactivation des points d'entrée

Réactive "+ Nouvelle inscription" et "Inscrire mon enfant"
(parent-dashboard.ts, désactivés en PROMPT_F07_CORRECTIFS) pour qu'ils
naviguent vers /parent/inscription/nouvelle au lieu du span désactivé.

## PARTIE 4 — Écran "Mes inscriptions"

Liste des inscriptions du parent (getMesInscriptions()) avec leur statut
(RESERVEE/CONFIRMEE), et accès au téléchargement de la lettre d'engagement
pour celles qui sont confirmées.

## TESTS MANUELS (documentés dans le résumé)

- Parcours complet bout en bout : critères → modalités → réservation →
  infos parent → confirmation → téléchargement lettre
- Réservation avec un matricule déjà inscrit cette année → message R7
  clair, pas une erreur générique
- Navigation "Précédent" fonctionne sans perdre les données déjà saisies
  aux étapes précédentes
- "Mes inscriptions" affiche bien les statuts corrects

NE PAS FAIRE à cette étape :
- Vérification "admis en classe supérieure" — toujours hors scope côté
  backend (cf. PROMPT_08bis original)
- Notification email/SMS de confirmation — hors scope

À la fin, génère le résumé de handoff complet — en particulier le
résultat de la vérification Partie 0, avant toute autre chose.
```
