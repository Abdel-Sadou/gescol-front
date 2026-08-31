# PROMPT_F05 — Correctif page article (vrai endpoint, retrait du contenu inventé)

**À utiliser avec** : FRONTEND_CONTEXT.md, docs/backend-reference/API_CONTRACT.md
(mis à jour avec la nouvelle entrée GET /api/vitrine/actualites/{id}, cf.
PROMPT_18 backend — vérifie qu'elle y est avant de lancer ce prompt).

**Contexte** : PROMPT_F04 avait construit la page article avec un
contournement (récupération de 100 actualités, filtrage côté client) faute
d'endpoint dédié. L'endpoint existe maintenant.

---

## Prompt

```
Contexte : correctif de la page article (src/app/pages/vitrine/article/
article.ts), suite à l'ajout de GET /api/vitrine/actualites/{id} côté
backend (cf. API_CONTRACT.md pour le détail exact).

## Correctif 1 — Vraie récupération par id

1. Ajoute VitrineService.getActualiteById(id) → GET /api/vitrine/actualites/{id}.
2. Remplace dans article.ts la logique actuelle (récupération de la liste
   complète + filtrage côté client) par un appel direct à cette nouvelle
   méthode.
3. Si l'API retourne 404 : affiche un état "Article introuvable" clair
   (avec un lien de retour vers la liste des actualités), PAS un contenu
   de substitution inventé.

## Correctif 2 — Retrait du contenu inventé (ARTICLES statiques)

Le tableau ARTICLES (contenu d'articles fictifs, créé en PROMPT_F04 comme
solution de repli) doit être retiré. Ce contenu n'a jamais été validé par
l'établissement — le laisser en production risquerait d'afficher de
fausses informations à de vrais parents.

Remplace-le par : si l'API est indisponible (erreur réseau, pas un 404
normal), affiche un état d'erreur générique ("Contenu temporairement
indisponible, réessayez plus tard") plutôt qu'un faux contenu de secours.

## VÉRIFICATION

- Chargement d'un article existant et publié → contenu réel affiché,
  un seul appel réseau (pas de récupération de liste complète)
- Chargement d'un id inexistant ou dépublié → état "Article introuvable"
- Aucune trace du tableau ARTICLES (contenu inventé) dans le code final

À la fin, résumé court : confirmation que le contournement a été retiré et
qu'aucun contenu inventé ne subsiste dans article.ts.
```
