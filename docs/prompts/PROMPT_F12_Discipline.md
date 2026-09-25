# PROMPT_F12 — Discipline (sanctions, bons de sortie, règles d'escalade)

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md,
docs/backend-reference/API_CONTRACT.md, docs/backend-reference/MASTER_CONTEXT.md,
DESIGN_SYSTEM.md fournis en contexte.

**Nouvelle cadence** : un seul bloc, auto-vérification en fin de prompt.

---

## Prompt

```
Contexte : F08-F11 ont posé tous les patterns nécessaires
(GescolTableComponent, DeleteConfirmDialogComponent, dialog compact pour
entités simples, page dédiée + rail pour formulaires complexes, ADR-013).
Ce module est plus simple que Résultats — PAS de restriction équivalente à
R12 sur les sanctions. Vérifie les champs exacts dans API_CONTRACT.md
avant de coder.

## PARTIE 1 — Sanctions

1. **Saisie** (/app/discipline/sanctions) : formulaire simple — recherche
   élève (réutilise le service de recherche déjà existant depuis F08),
   typeSanction (select depuis l'enum global), motif (texte), date.
   IMPORTANT : ouvert à TOUT ENSEIGNANT sans aucune restriction de classe/
   matière (contrairement à Résultats, R12 ne s'applique PAS ici — ne
   reproduis pas ce filtre par erreur, cf. MASTER_CONTEXT).
2. **Historique** : par élève (GET .../sanctions/eleve/{id}) et par classe
   (GET .../sanctions/classe/{id}) — liste chronologique. Une sanction
   générée automatiquement par escalade (champ genereParEscalade côté
   backend, R5/R15) doit être visuellement distinguée (badge "Générée
   automatiquement") d'une sanction saisie manuellement.

## PARTIE 2 — Bons de sortie / entrée

1. **Créer un bon de sortie** (/app/discipline/bons-sortie) : élève,
   motif, date de sortie. Écriture réservée SECRETARIAT/SUPER_ADMIN
   (contrairement aux sanctions).
2. **Liste par élève** avec action "Valider le retour" (PUT .../entree)
   visible uniquement si le bon est encore au statut SORTI — masquée ou
   désactivée si déjà RENTRE, pas un bouton qui échouerait silencieusement.

## PARTIE 3 — Règles d'escalade (/app/discipline/regles)

Entité simple (typeSanctionDeclencheur, seuilDeclenchement,
sanctionResultante) — utilise le pattern dialog compact établi en F09
(GescolTableComponent + dialog), PAS une page dédiée. Écriture réservée
SUPER_ADMIN.

## SÉCURITÉ UI

Cohérent avec PAGES_ET_NAVIGATION.md §1 : Sanctions ouvertes à ENSEIGNANT/
SECRETARIAT/SUPER_ADMIN sans restriction de classe ; Bons de sortie
SECRETARIAT/SUPER_ADMIN ; Règles SUPER_ADMIN uniquement. Rappel : masquage
UI uniquement, le backend reste la seule vraie barrière.

## i18n

Scope 'app', FR + EN, ADR-012.

## AUTO-VÉRIFICATION (documente le résultat en tête du handoff)

1. Champs conformes à API_CONTRACT.md pour tous les endpoints utilisés
2. Un ENSEIGNANT peut saisir une sanction pour un élève même sans lien
   d'emploi du temps avec sa classe — vérifie explicitement qu'aucun
   filtre R12 n'a été appliqué par erreur (erreur facile après avoir vu
   ce pattern plusieurs fois en F11)
3. Sanction générée par escalade visuellement distincte d'une sanction
   manuelle dans l'historique
4. Bouton "Valider le retour" absent/désactivé sur un bon déjà RENTRE
5. Règles d'escalade en dialog compact, pas en page dédiée (cohérence
   avec la convention F09 pour les entités simples)
6. Aucun texte français en dur
7. Routes conformes à PAGES_ET_NAVIGATION.md §2

À la fin, un seul résumé de handoff avec le résultat de
l'auto-vérification en premier.
```
