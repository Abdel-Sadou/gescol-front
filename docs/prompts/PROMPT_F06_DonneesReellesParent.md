# PROMPT_F06 — Données réelles : Espace Parent + Fiche élève (retrait des TODO)

**À utiliser avec** : FRONTEND_CONTEXT.md, docs/backend-reference/API_CONTRACT.md,
docs/backend-reference/MASTER_CONTEXT.md (règle R16) fournis en contexte.

---

## Prompt

```
Contexte : suite de PROMPT_F04/F05. Les écrans Espace Parent et Fiche élève
utilisent encore des données statiques (parent.data.ts : KIDS, STUDENTS).
Ce prompt les remplace par les vrais appels API, déjà tous fonctionnels
côté backend.

Avant de commencer, relis le template réel de parent-dashboard.ts (issu de
la démo Angular) pour identifier PRÉCISÉMENT quelles données sont
affichées (scolarité, discipline, résultats/moyennes le cas échéant,
historique) — ne suppose pas la liste depuis ce prompt, vérifie le vrai
template.

## PARTIE 1 — ParentDashboardService

Crée un service exposant :
- getMesEnfants() → GET /api/parent/mes-enfants (liste pour le sélecteur
  d'enfant)
- getSuivi(eleveId) → GET /api/parent/eleves/{eleveId}/suivi (agrège solde,
  moyennes, sanctions en un seul appel — R16 déjà appliqué côté backend,
  ne duplique aucune vérification côté frontend)
- getHistoriqueVersements(eleveId) → GET /api/finances/versements/eleve/{eleveId}

Vérifie le format exact de chaque réponse dans API_CONTRACT.md avant
d'écrire le mapping — ne suppose aucun nom de champ.

## PARTIE 2 — Wiring du tableau de bord parent

1. Au chargement : getMesEnfants() pour peupler le sélecteur. Sélectionne
   le premier enfant par défaut (cohérent avec le comportement actuel).
2. À la sélection d'un enfant (changement ou chargement initial) :
   getSuivi(eleveId) + getHistoriqueVersements(eleveId) pour peupler les
   cartes scolarité/discipline/résultats et l'historique.
3. Retire KIDS de parent.data.ts une fois le wiring confirmé fonctionnel.
4. États à gérer proprement (cohérent avec le pattern déjà établi en
   PROMPT_F05 pour l'article — found/loading/error, pas de contenu de
   substitution inventé) :
   - Chargement : indicateur de chargement, pas un flash de données vides
   - Aucun enfant lié au compte : message clair invitant à utiliser le
     workflow d'inscription (lien vers la réservation, cf. backend
     PROMPT_08bis)
   - Erreur réseau : message d'erreur générique, pas de données fictives

## PARTIE 3 — Quittance : téléchargement du PDF officiel

Remplace le TODO du bouton "Télécharger le PDF officiel" par un vrai appel
à GET /api/finances/quittances/{id}/pdf. Ce endpoint nécessite le JWT
(protégé, pas public) — utilise HttpClient avec responseType 'blob' (pas
window.open avec le token en paramètre d'URL, ça l'exposerait) : récupère
le blob, crée une URL objet temporaire, déclenche le téléchargement via un
élément <a> temporaire, libère l'URL objet ensuite.

## PARTIE 4 — Fiche élève (App interne) : recherche réelle

1. Remplace STUDENTS par un appel réel à GET /api/eleves (recherche
   multicritère déjà existante depuis PROMPT_02 — nom, prenom, matricule,
   classe, avec whitelist de tri).
2. Le composant de recherche existant (suggestions, filtrage) doit
   continuer à fonctionner à l'identique niveau UX — seule la source de
   données change (accepte que la recherche soit maintenant asynchrone,
   avec un léger debounce sur la saisie plutôt qu'un filtrage instantané
   sur un tableau local).
3. Retire STUDENTS de parent.data.ts (ou déplace-le si tu identifies qu'il
   ne devrait pas être dans ce fichier vu qu'il concerne l'app interne, pas
   l'espace parent — signale ton choix).

## TESTS MANUELS (documentés dans le résumé)

- Connexion PARENT de test avec au moins un enfant lié → dashboard peuplé
  de vraies données
- Compte PARENT sans enfant lié → message clair, pas de crash
- Téléchargement de quittance : vrai fichier PDF téléchargé (pas un blob
  vide ni une erreur silencieuse)
- Recherche fiche élève : requête réseau visible dans l'onglet Network,
  résultats réels affichés
- Aucune référence à KIDS ni STUDENTS ne subsiste dans le code final

NE PAS FAIRE à cette étape :
- Écran de gestion des moratoires côté parent — pas construit côté backend
  pour un accès parent direct (cf. PROMPT_10, décision actée)
- Cache local des données parent au-delà de la session — pas demandé

À la fin, génère le résumé de handoff complet.
```
