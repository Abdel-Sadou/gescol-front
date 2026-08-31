# PROMPT_F05 — Handoff : Correctif page article

**Prompt source** : `PROMPT_F05_CorrectifArticle.md`  
**Statut** : ✅ Terminé.

---

## Objectif

Remplacer le contournement F04 (récupération de 100 actualités + filtrage côté client + contenu fictif `ARTICLES`) par l'appel direct `GET /api/vitrine/actualites/{id}` désormais disponible dans le backend.

---

## Fichiers modifiés

```
src/app/core/services/vitrine.service.ts    ajout getActualiteById(id)
src/app/pages/vitrine/article/article.ts    réécriture complète
src/app/pages/vitrine/vitrine.ts            import ARTICLES retiré, lien statique → noop
src/app/data/vitrine.data.ts                ARTICLES supprimé, champ id retiré de NEWS
src/assets/i18n/vitrine/fr.json             ajout article.erreur.*
src/assets/i18n/vitrine/en.json             ajout article.erreur.*
```

---

## Ce qui a changé dans article.ts

### Avant (F04 — contournement)

```typescript
// Récupération de la liste complète (max 100) + filtrage côté client
private allActualites = toSignal(
    this.vitrineService.getActualites(0, 100).pipe(catchError(() => of(null)))
);
readonly article = computed(() => {
    const all = this.allActualites();
    const apiItem = all?.content.find(a => a.id === id);
    return apiItem ?? ARTICLES.find(a => a.id === id) ?? null; // ← contenu fictif
});
```

### Après (F05 — correct)

```typescript
type ArticleState =
    | { kind: 'found'; data: ActualiteResponse }
    | { kind: 'notFound' }
    | { kind: 'error' };

readonly state = toSignal<ArticleState>(
    this.route.paramMap.pipe(
        map(p => p.get('id') ?? ''),
        switchMap(id =>
            this.vitrineService.getActualiteById(id).pipe(
                map(data => ({ kind: 'found' as const, data })),
                catchError((err: HttpErrorResponse) => of(
                    err.status === 404
                        ? { kind: 'notFound' as const }
                        : { kind: 'error' as const }
                ))
            )
        )
    )
    // Pas d'initialValue → undefined = chargement
);
```

---

## États affichés

| État | Déclencheur | Affichage |
|---|---|---|
| `undefined` | Chargement en cours | Spinner centré |
| `notFound` | 404 (inexistant ou dépublié) | "Cet article est introuvable ou n'est plus disponible." + lien retour |
| `error` | Erreur réseau / 5xx | "Contenu temporairement indisponible. Réessayez dans quelques instants." |
| `found` | 200 OK | Hero + corps + articles liés |

> 404 et dépublié sont indistinguables côté frontend — comportement voulu, cf. API_CONTRACT.md §Actualités.

---

## Articles liés

Appel séparé `getActualites(0, 4)` avec filtrage côté client pour exclure l'article courant. La section est masquée si le backend est indisponible (tableau vide, pas de fallback fictif).

---

## Contenu fictif retiré

- `ARTICLES` (3 articles inventés) supprimé de `vitrine.data.ts`.
- Champ `id` retiré de `NEWS` (les items statiques ne correspondent à aucun ID backend).
- Bloc `@else` de la vitrine (fallback sans backend) : lien "Lire la suite" remplacé par `noop($event)` avec `opacity:0.45` — visuellement inactif, aucune navigation vers une page qui retournerait 404.

---

## Clés i18n ajoutées

**Scope `vitrine`** (`fr.json` + `en.json`) :

| Clé | FR | EN |
|---|---|---|
| `article.erreur.titre` | Contenu temporairement indisponible. | Content temporarily unavailable. |
| `article.erreur.description` | Réessayez dans quelques instants. | Please try again in a few moments. |
| `article.introuvable` | *(texte enrichi)* | *(texte enrichi)* |

---

## Vérification attendue

- Chargement d'un article existant et publié → contenu réel affiché, **un seul appel réseau**.
- Chargement d'un ID inexistant ou dépublié → état "Article introuvable".
- Backend indisponible → état "Contenu temporairement indisponible".
- Fallback statique vitrine → "Lire la suite" grisé, aucune navigation.
- Aucune occurrence de `ARTICLES` dans le code source (hors commentaire de section HTML).
