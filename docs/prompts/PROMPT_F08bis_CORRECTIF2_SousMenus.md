# PROMPT_F08bis_CORRECTIF2 — Sous-menus manquants dans la sidebar

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md §1 fournis
en contexte. **À lancer avant PROMPT_F09** — sinon les 8 écrans de
Paramétrage n'auront aucun point d'entrée dans le menu.

---

## Prompt

```
Contexte : la nouvelle sidebar (AppShell, PROMPT_F08bis) affiche les
groupes (Scolarité, Finances, Administration...) mais pas leurs
sous-items — "Paramétrage" par exemple est un lien plat au lieu de se
déplier vers ses 8 sous-écrans. C'est une régression par rapport à
app.menu.ts (F08), qui avait la bonne profondeur.

## Correctif

Étends le modèle de navigation d'AppShellComponent (buildNav(role)) pour
supporter un troisième niveau — groupe → section → sous-items — fidèle à
PAGES_ET_NAVIGATION.md §1 dans son intégralité, pas la version simplifiée
actuelle. Chaque section qui a plusieurs enfants dans ce document (Élèves,
Paramétrage, Personnel, Emploi du temps, Résultats, Discipline, Finances,
Paie, Cahier de texte, Communication) doit pouvoir se déplier pour montrer
ses sous-items, chacun avec sa propre route et son propre filtre de rôle.

Comportement d'affichage à toi de choisir (accordéon dans la sidebar,
sous-liste indentée, etc.) — cohérent avec la direction visuelle
"Institutionnel chaud" déjà en place, pas un pattern PrimeNG générique qui
jurerait avec le reste. Section active mise en évidence + son groupe
parent automatiquement déplié à l'arrivée sur une de ses sous-pages
(cohérent avec routerLinkActive déjà utilisé ailleurs).

Sur les breakpoints réduits (icônes seules à 1080px, overlay mobile à
767px, cf. F08bis) : le comportement des sous-menus à ces tailles doit
rester utilisable — vérifie que ça ne casse pas silencieusement sur les
petits écrans (ex. un sous-menu qui s'ouvrirait hors du viewport).

## VÉRIFICATION

- Chaque item de PAGES_ET_NAVIGATION.md §1 est atteignable depuis la
  sidebar, avec la bonne restriction de rôle
- "Paramétrage" (et les autres sections à sous-items) se déplie et montre
  bien tous ses enfants
- Navigation directe vers une URL enfant (ex. /app/parametrage/classes)
  déplie automatiquement le bon groupe parent et le met en évidence
- Comportement correct sur les 3 breakpoints (desktop, tablette icônes
  seules, mobile overlay)

À la fin, résumé court confirmant que la structure complète de
PAGES_ET_NAVIGATION.md §1 est bien représentée dans le menu, item par
item si possible (pas juste "c'est fait").
```
