# HANDOFF — PROMPT_F02bis : Internationalisation FR/EN (Transloco)

## Résumé d'exécution

Build final : **zéro erreur, zéro warning.** `@jsverse/transloco` 8.4.0.

---

## Fichiers créés

| Fichier | Rôle |
|---|---|
| `src/assets/i18n/fr.json` + `en.json` | Fichiers globaux vides (requis par le loader) |
| `src/assets/i18n/vitrine/fr.json` + `en.json` | Scope vitrine — 6 sections + nav + footer |
| `src/assets/i18n/parent/fr.json` + `en.json` | Scope parent — page connexion/inscription |
| `src/assets/i18n/app/fr.json` + `en.json` | Scope app — menu de l'application interne |
| `src/app/core/transloco-loader.ts` | `TranslocoHttpLoader` — résout `/assets/i18n/{scope}/{lang}.json` |
| `src/app/core/services/language.service.ts` | Service singleton — persistence localStorage, préchargement des 3 scopes |
| `src/app/shared/components/language-switcher/language-switcher.ts` | Composant FR\|EN — HTML natif pur, 3 variants (light, dark, app) |

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/app.config.ts` | `provideTransloco()` + `APP_INITIALIZER` enrichi pour précharger les scopes |
| `src/app/pages/connexion/connexion.ts` | `*transloco="let t; scope: 'parent'"` + `LanguageSwitcher` |
| `src/app/layout/components/app.menu.ts` | `TranslocoService.translate()` + `toSignal(langChanges$)` pour réactivité |
| `src/app/pages/vitrine/vitrine.ts` | `*transloco="let t; scope: 'vitrine'"` + `LanguageSwitcher` dans nav et footer |
| `src/app/layout/components/app.topbar.ts` | `LanguageSwitcher` ajouté dans `topbar-right` |
| `src/app/layout/components/app.parentlayout.ts` | Mini-barre fixed top-right avec `LanguageSwitcher` |

---

## Architecture i18n

### Loader
`TranslocoHttpLoader.getTranslation(lang)` reçoit soit `'fr'` / `'en'` (scope global) soit `'vitrine/fr'` / `'parent/en'` etc. (scope+lang) → requête `/assets/i18n/{lang}.json`.

### Préchargement
`APP_INITIALIZER` appelle `LanguageService.preload(currentLang)` qui charge les 3 scopes en parallèle (`Promise.all`). Résultat : zéro flash de contenu non traduit au premier rendu.

### Changement de langue
`LanguageService.setLang(lang)` :
1. Met à jour `currentLang` signal
2. Écrit `gescol_lang` dans `localStorage`
3. `translocoService.setActiveLang(lang)` — déclenche `langChanges$`
4. Lance le chargement des 3 scopes de la nouvelle langue (Transloco met en cache)

### Réactivité dans les templates
- Vitrine / Connexion : `*transloco="let t; scope: '...'"` — Transloco re-rend automatiquement quand la langue change
- Menu App interne : `toSignal(translocoService.langChanges$)` dans le `computed()` → `buildMenu()` recalculé à chaque changement de langue

---

## Structure des clés de traduction

### `vitrine/{lang}.json`
```
nav.{ecole, formations, vieScolaire, actualites, admissions, espaceParent}
accueil.{region, mot1, mot2, mot3, description, cta.inscrire, cta.decouvrir, scroller}
ecole.{titre, organigramme, equipe.titre, equipe.vide}
formations.{titre, description, francophone.{titre, sousTitre, maternelle, primaire, college, lycee}, anglophone.{titre, sousTitre, nursery, primary, secondary, upperSixth}}
vieScolaire.{titre, horaires.{titre, vide}, activites.{titre, vide}}
actualites.{titre, vide}
admissions.{titre, texteDefaut, cta}
footer.{droits, espaceParent}
```

### `parent/{lang}.json`
```
connexion.{espace, sousTitre, onglet.{seConnecter, creerCompte}, champ.{identifiant, motDePasse, nom, prenom, email}, lien.motDePasseOublie, bouton.{seConnecter, connexionEnCours, creerCompte, creationEnCours}, force.{label, faible, moyen, bon, fort}, message.{compteCreé, erreurIdentifiants, erreurGenerale}}
```

### `app/{lang}.json`
```
menu.{tableauDeBord, eleves.{label, liste, inscriptions}, finances.{label, scolarite, quittances, moratoires}, paie.{label, baremes, bulletins}, personnel, parametrage.{label, classes, taux, matieres, emploisDuTemps}, emploiDuTemps, resultats.{label, saisie, bulletins}, discipline, cahierDeTexte, communication.{label, actualites, vitrine}}
```

---

## Sélecteur de langue — placement

| Zone | Composant hôte | Variant |
|---|---|---|
| Vitrine | nav sticky (desktop) + menu burger mobile (bas) + footer | `light` / `dark` |
| Page Connexion | overlay top-right sur fond sombre | `dark` |
| Espace Parent | `ParentLayout` barre fixed top-right | `light` |
| Application interne | `AppTopbar` `topbar-right` | `app` |

---

## Grep de vérification

**`connexion.ts`** : accents trouvés uniquement dans des commentaires TS/HTML (`// Zéro...`, `<!-- Sélecteur...`). Aucun texte visible utilisateur en dur. ✅

**`app.menu.ts`** : accents uniquement dans des commentaires TS. Tous les libellés passent par `translocoService.translate('app.menu.xxx')`. ✅

**`vitrine.ts`** : accents dans des commentaires HTML/TS (non visibles) + les noms officiels des niveaux scolaires dans les `@for` (`'6ème'`, `'5ème'`, `'Crèche'`, `'3ème → BEPC'`, etc.). Ces noms sont des codes officiels du MINESEC/GCE Board — ils sont identiques en français et en anglais (les parents anglophones les connaissent sous ces appellations). **Décision actée** : ces codes ne sont pas traduits. Les libellés de section qui les accompagnent (`t('formations.francophone.college')` → "Collège — 1er cycle" / "Lower Secondary") sont bien dans les fichiers i18n. ✅

---

## Tests manuels à effectuer

- [ ] Bouton FR|EN visible dans la nav de la Vitrine → tous les textes de l'interface changent instantanément
- [ ] Bouton FR|EN visible sur la page Connexion (overlay top-right) → onglets, placeholders, boutons, messages d'erreur changent
- [ ] Rechargement de page → langue précédemment choisie est restaurée (localStorage `gescol_lang`)
- [ ] Connexion en tant que SECRETARIAT → menu affiché en FR par défaut, basculable en EN
- [ ] Vérifier dans DevTools → aucun texte de clé (`menu.tableauDeBord`, `connexion.espace`...) ne s'affiche à la place du texte traduit

---

## Décision à documenter (ADR)

La règle ADR-012 s'applique désormais à tous les prompts suivants : **tout texte affiché à l'utilisateur doit utiliser une clé Transloco** dans le scope correspondant à sa zone. Cette contrainte est à ajouter dans `CLAUDE.md` lors de la prochaine mise à jour.

---

## Prochain prompt

**PROMPT_F04 — Espace Parent** : layout, tableau de bord (solde, quittances récentes), page quittances avec PDF A5 (DEMO_DESIGN_SPEC.md Écran 4). Le scope `parent` est déjà créé avec les clés connexion — ajouter les clés du dashboard et des quittances dans ce même scope.
