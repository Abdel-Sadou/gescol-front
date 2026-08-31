# PROMPT_F04 — Intégration du code Angular réel de la démo (remplace F01-login et F03)

**À utiliser avec** : FRONTEND_CONTEXT.md, ADR-011 (mis à jour — exception
student-record), ADR-012, docs/backend-reference/API_CONTRACT.md fournis en
contexte. **Place d'abord le contenu du zip fourni dans un dossier
`reference/angular-demo/` à la racine du projet** (pas dans `src/` — c'est
du matériel de référence à copier/adapter, pas à exécuter tel quel).

**Portée** : ce prompt remplace le rendu visuel de la page de connexion
(PROMPT_F01) et de la vitrine (PROMPT_F03) par le vrai code Angular fourni
par Claude Design, et construit l'Espace Parent (tableau de bord + reçu)
ainsi qu'une exception côté app interne (fiche élève secrétariat).

---

## Prompt

```
Contexte : un vrai projet Angular 21 autonome (reference/angular-demo/) a
été généré par Claude Design, avec 5 écrans fidèles au design déjà validé :
landing, login, parent-space, receipt, student-record. Ce code remplace
DEMO_DESIGN_SPEC.md comme référence principale pour ces écrans — ne
retraduis pas une description texte, ADAPTE ce vrai code directement.

## RÈGLE GÉNÉRALE DE PORTAGE (s'applique aux 5 écrans)

Pour chaque composant du dossier reference/angular-demo/src/app/pages/,
reprends la structure HTML et les styles en ligne EXACTEMENT tels quels
(couleurs hexadécimales, polices, espacements, disposition) — c'est là
qu'est la fidélité visuelle qu'on cherche à préserver. Adapte uniquement :

1. **Le texte affiché** doit passer par une clé Transloco (scope
   correspondant à la zone), PAS rester en dur comme dans le code source
   fourni. Le code source contient du français en dur (ex.
   `label: 'Accueil'`) — extrais-le vers les scopes i18n déjà existants
   (vitrine, parent) et crée les clés manquantes si besoin, avec leur
   traduction anglaise.
2. **Les données statiques** (school-data.ts : KIDS, STUDENTS, SYSTEM_FR,
   STATS, PRESENTATION, CYCLES, VIE_SCOLAIRE, NEWS, STEPS) : reprends-les
   telles quelles pour l'instant dans des fichiers scopés par zone
   (src/app/data/vitrine.data.ts, src/app/data/parent.data.ts) — PAS encore
   connectées à l'API. Commente clairement chaque bloc avec
   // TODO(API): remplacer par [ServiceExistant].[méthode]() — le service
   réel existe déjà (VitrineService depuis PROMPT_F03) pour la partie
   Vitrine, à créer pour la partie Parent (juste le type/l'interface pour
   l'instant, pas l'appel réel).
3. **Le routing et l'injection des services existants** (AuthService,
   EtablissementService, guards) restent ceux déjà en place — ne les
   recrée pas, connecte juste les nouveaux écrans dessus.
4. **CobimagBase** (reference/angular-demo/src/app/shared/cobimag-base.ts)
   : reprends cette classe de base telle quelle (responsive, navigation) —
   utilitaire propre et réutilisable, aucune raison de le réécrire.

## ÉCRAN 1 — Landing → remplace la Vitrine (PROMPT_F03)

Remplace le contenu de src/app/pages/vitrine/vitrine.ts par une adaptation
fidèle de reference/angular-demo/src/app/pages/landing/. Conserve
l'intégration déjà faite avec VitrineService (getContenu, getActualites,
getEquipePedagogique) pour les sections qui ont un vrai contenu backend
(#ecole, #vie-scolaire, #admissions, #actualites) — remplace juste
l'apparence par celle du nouveau code, pas la logique de récupération de
données déjà fonctionnelle. Pour #formations (toujours statique, cf.
PROMPT_F03), utilise les données CYCLES/SYSTEM_FR/SYSTEM_EN du nouveau
fichier de données.

## ÉCRAN 2 — Login → remplace la page de connexion (PROMPT_F01)

Remplace src/app/pages/connexion/connexion.ts par une adaptation fidèle de
reference/angular-demo/src/app/pages/login/. Conserve l'intégration déjà
faite avec AuthService (login réel, POST /api/parent/comptes) — remplace
l'apparence, pas la logique de soumission déjà fonctionnelle et déjà
alignée sur API_CONTRACT.md (PROMPT_F02_CORRECTIF). Le sélecteur de langue
(LanguageSwitcher, PROMPT_F02bis) doit rester présent, positionné de façon
cohérente avec le nouveau design.

## ÉCRAN 3 — Parent-space → nouvel Espace Parent (tableau de bord)

Nouveau composant dans src/app/pages/parent/dashboard/, sous ParentLayout,
route /parent. Adapte fidèlement parent-space.component. Le sélecteur
d'enfant, les cartes scolarité/résultats/discipline, l'historique de
versements : structure et style identiques au code source.

Crée ParentDashboardService (ou étends un service existant) avec les
mêmes signatures de retour que les données actuellement statiques
(KIDS), en prévision du branchement réel : GET /api/parent/mes-enfants,
GET /api/parent/eleves/{id}/suivi (cf. API_CONTRACT.md pour le détail
exact) — mais n'appelle PAS encore ces endpoints dans ce prompt, garde les
données statiques avec le TODO comme indiqué en règle générale.

## ÉCRAN 4 — Receipt → aperçu de quittance côté parent

Nouveau composant dans src/app/pages/parent/quittance/, sous ParentLayout.
Adapte fidèlement receipt.component (y compris le web component
<doc-page>, à copier depuis reference/angular-demo/src/assets/doc-page.js
vers src/assets/, chargé en script dans index.html).

IMPORTANT — distinction à respecter : cet écran est un APERÇU visuel côté
navigateur, pas le document officiel. Le vrai PDF de quittance (avec QR
code réel, code-barre, mise en page double bloc) est déjà généré côté
backend (GET /api/finances/quittances/{id}/pdf, PROMPT_05 et PROMPT_10).
Ajoute un bouton "Télécharger le PDF officiel" qui appellera cet endpoint
(TODO commenté, pas branché dans ce prompt) — ne fais pas passer le rendu
<doc-page> côté client pour LE document officiel, ce n'en est qu'un aperçu.

## ÉCRAN 5 — Student-record → Fiche élève (app interne, EXCEPTION ADR-011)

Nouveau composant dans src/app/pages/app/fiche-eleve/ (ou emplacement
cohérent avec la structure déjà en place pour l'app interne), route sous
/app, protégée par le guard existant (rôles SUPER_ADMIN/SECRETARIAT/
ECONOMAT/ENSEIGNANT). Adapte fidèlement student-record.component — CSS
custom conservé, PAS de composants PrimeNG (exception actée dans
ADR-011). Ajoute-le au menu de l'application interne (scope de traduction
'app', clé menu.eleves.fiche ou équivalent cohérent avec les clés déjà
existantes).

## TESTS MANUELS (documentés dans le résumé)

- Les 5 écrans s'affichent fidèlement au nouveau design (comparaison
  visuelle avec reference/angular-demo/ à faire par l'utilisateur, pas par
  toi)
- Bascule FR/EN fonctionne sur les écrans qui ont un sélecteur de langue
- Aucun texte français en dur ne subsiste dans les 5 nouveaux/modifiés
  fichiers (même grep de vérification que PROMPT_F02bis)
- La logique déjà fonctionnelle (login réel, récupération de contenu
  Vitrine réel) continue de fonctionner après le changement d'apparence
- Fiche élève (student-record) : zéro composant PrimeNG dans le DOM,
  comme Vitrine/Parent

NE PAS FAIRE à cette étape :
- Brancher parent-space et receipt sur les vraies données API — reste sur
  les données statiques avec TODO, ce sera un prompt dédié séparé
- Reconstruire la fiche élève en PrimeNG — exception actée, CSS custom
  gardé pour cet écran précis
- Toucher à la logique déjà fonctionnelle de connexion/vitrine, seulement
  son apparence

À la fin, génère le résumé de handoff complet, en particulier la liste des
clés de traduction créées/déplacées et la confirmation du grep de
vérification sur les 5 fichiers concernés.
```
