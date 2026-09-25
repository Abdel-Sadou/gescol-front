# PROMPT_F14 — Paie (barèmes, bulletins, ordres de virement)

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md,
docs/backend-reference/API_CONTRACT.md, docs/backend-reference/MASTER_CONTEXT.md
(règles R6, R17, R19), DESIGN_SYSTEM.md fournis en contexte.

**Nouvelle cadence** : un seul bloc, auto-vérification en fin de prompt.

---

## Prompt

```
Contexte : F08-F13 ont posé tous les patterns nécessaires. Vérifie les
champs exacts dans API_CONTRACT.md avant de coder.

## PARTIE 1 — Barèmes de paie (/app/paie/baremes)

BaremePaie a environ 12 champs (typeContrat + taux IRPP, centimes
additionnels, taxe communale, crédit foncier salarial/patronal, redevance
audiovisuelle, FNE, pension vieillesse salariale/patronale, allocations
familiales patronales, accident travail patronal) — dépasse largement le
seuil de 6 champs qui impose un regroupement (DESIGN_SYSTEM §5). Ce n'est
PAS une entité Paramétrage simple typique malgré son classement dans le
menu. Deux options : dialog PrimeNG large avec sections internes
(identité contrat + retenues salariales + charges patronales), ou page
dédiée courte si le dialog devient ingérable. Choisis, documente ton
choix dans le résumé de fin plutôt que de forcer un dialog compact
inadapté. Écriture réservée SUPER_ADMIN.

## PARTIE 2 — Génération de bulletin (/app/paie/bulletins)

1. Formulaire : recherche personnel (réutilise le service existant depuis
   F10), période (mois/année), modePaiement (p-selectbutton BILLETAGE/
   VIREMENT_BANCAIRE, cf. DESIGN_SYSTEM). Le champ heuresEffectuees
   n'apparaît QUE si le personnel sélectionné a typeContrat = VACATAIRE
   (masqué sinon, pas juste désactivé — même logique que le champ
   Matières du formulaire Personnel en F10).
2. Gère explicitement le rejet R19 (VIREMENT_BANCAIRE demandé mais
   personnel sans coordonnées bancaires) : message clair, avec un lien
   direct vers l'édition de ce personnel (/app/personnel/{id}/editer,
   déjà construit en F10) pour compléter l'information plutôt que de
   laisser l'utilisateur deviner où corriger ça.
3. Après génération réussie : affiche un résumé (montant brut, montant
   net) puis propose le téléchargement du bulletin PDF, et si
   modePaiement = VIREMENT_BANCAIRE, propose AUSSI le téléchargement de
   l'ordre de virement PDF (deux boutons distincts, pas un seul).

## PARTIE 3 — Historique des bulletins par personnel

Recherche personnel, liste de ses bulletins générés (période, montant
net, mode de paiement). Actions par ligne : télécharger bulletin PDF,
télécharger ordre de virement PDF (visible uniquement si ce bulletin est
en VIREMENT_BANCAIRE — pas de bouton mort pour un bulletin BILLETAGE).

## SÉCURITÉ UI

Tout ce module réservé SUPER_ADMIN/ECONOMAT — jamais SECRETARIAT (cf.
PAGES_ET_NAVIGATION.md §1, données plus sensibles que la scolarité).
Barèmes : SUPER_ADMIN seul en écriture.

## i18n

Scope 'app', FR + EN, ADR-012.

## AUTO-VÉRIFICATION (documente le résultat en tête du handoff)

1. Champs conformes à API_CONTRACT.md pour tous les endpoints
2. Choix documenté pour le formulaire Barèmes (dialog sectionné vs page
   dédiée) avec justification
3. Champ heuresEffectuees absent du DOM si typeContrat ≠ VACATAIRE
4. Rejet R19 affiche un message clair avec lien vers l'édition du
   personnel concerné
5. Téléchargement de l'ordre de virement proposé uniquement pour les
   bulletins VIREMENT_BANCAIRE, jamais pour BILLETAGE
6. SECRETARIAT n'a accès à aucun écran de ce module (vérifie que le menu
   et les routes le confirment, pas seulement le menu)
7. Aucun texte français en dur
8. Routes conformes à PAGES_ET_NAVIGATION.md §2

À la fin, un seul résumé de handoff avec le résultat de
l'auto-vérification en premier.
```
