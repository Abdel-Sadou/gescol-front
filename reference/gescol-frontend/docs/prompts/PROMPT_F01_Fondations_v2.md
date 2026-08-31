# PROMPT_F01 — Fondations frontend (v2, basé sur l'exploration réelle)

**À utiliser avec** : FRONTEND_CONTEXT.md (mis à jour), MASTER_CONTEXT.md
backend, reference/DEMO_DESIGN_SPEC.md, et ce fichier référencé
explicitement. Remplace la version précédente de PROMPT_F01, écrite avant
l'exploration PROMPT_F00 — celle-ci se base sur la vraie structure du
projet (src/app.config.ts, src/app.routes.ts, layout.service.ts, etc.)

---

## Prompt

```
Contexte : projet Poseidon exploré (PROMPT_F00). Structure confirmée :
AppLayout (sidebar+topbar), LandingLayout (marketing+auth par défaut,
glassmorphism bleu, à ne pas réutiliser tel quel), AuthLayout (vide).
Package de theming réel : @primeuix/themes (pas @primeng/themes).

## PARTIE 1 — Preset PrimeNG (application interne uniquement)

Dans src/app.config.ts, remplace la palette 'blue' actuelle du MyPreset
existant par le vert COBIMAG (#008B47), en respectant la structure déjà en
place (semantic.primary, palette 50-950, overlay, colorScheme light/dark)
— ne réécris pas le preset depuis zéro, adapte l'existant. Pour l'instant,
code la couleur en dur (#008B47) ; le chargement dynamique depuis
Etablissement viendra une fois le service Établissement créé (Partie 2),
ne bloque pas cette étape dessus.

## PARTIE 2 — Service Établissement et branding

1. EtablissementService : GET /api/etablissement/courant au démarrage.
2. Une fois chargé, injecte les couleurs en CSS custom properties
   (--color-primary, --color-secondary, --color-accent) pour Vitrine et
   Espace Parent (cf. FRONTEND_CONTEXT §3), ET met à jour dynamiquement le
   preset PrimeNG de la Partie 1 via usePreset/updatePreset (cf.
   FRONTEND_CONTEXT §3bis) pour l'application interne.
3. Valeurs de secours si l'appel échoue : vert #008B47, gris #5F6161,
   accent #E8722C.

## PARTIE 3 — Décision de layout à documenter explicitement

Avant de router quoi que ce soit, décide et DOCUMENTE dans le résumé de fin
(ne suppose pas silencieusement) :
- Espace Parent : utilise AuthLayout (actuellement vide) comme coquille
  minimale, OU crée un layout entièrement nouveau — dis lequel et pourquoi
- Vitrine : réutilise le routing de LandingLayout (chemin d'accès) mais PAS
  son contenu ni son style, ou route complètement en dehors — dis lequel

Dans les deux cas, Vitrine et Espace Parent ne doivent charger AUCUN
composant PrimeNG (ADR-011) — vérifie qu'un layout Poseidon réutilisé
n'importe pas de composants PrimeNG dans son propre template avant de t'en
servir comme simple coquille de routing.

## PARTIE 4 — Authentification

1. AuthService : login() (POST /api/auth/login), refresh() (POST
   /api/auth/refresh), logout() (client seulement, pas d'endpoint dédié).
2. Stockage du token : localStorage, signale les compromis de sécurité.
3. HttpInterceptor : injecte le token, gère le refresh sur 401.
4. Décodage JWT côté client (lecture du rôle/expiration uniquement, jamais
   de vérification de signature côté client).

## PARTIE 5 — Routing à trois zones

1. /vitrine/** (public), /parent/** (guard PARENT), /app/** (guard tout
   rôle sauf PARENT, utilise AppLayout existant), /connexion (public).
2. Redirection post-login selon le rôle décodé (PARENT → /parent, sinon
   → /app).
3. AuthGuard générique + RoleGuard paramétrable.

## PARTIE 6 — Menu de l'application interne

1. Vide entièrement app.menu.ts du contenu de démo existant (Dashboards
   E-Commerce/Banking, Apps Chat/Mail/CMS, UI Kit, Prime Blocks, etc. — cf.
   PROMPT_F00 Partie 1.3, aucun de ces éléments n'est pertinent pour
   GESCOL).
2. Reconstruis-le dynamiquement par rôle (cf. FRONTEND_CONTEXT §5 et §6) :
   pour l'instant, des routes placeholder simples (titre affiché) pour
   chaque module métier à venir, pas les écrans réels.
3. NE SUPPRIME PAS les fichiers de pages de démo existants (uikit/, apps/,
   dashboards/ecommerce, etc.) dans ce prompt — juste le menu qui y pointe.
   Le nettoyage des fichiers inutilisés sera un prompt dédié séparé, pas
   mélangé avec la mise en place des fondations.

## PARTIE 7 — Page de connexion et inscription parent

1. Page de connexion : NE réutilise PAS src/app/pages/auth/login.ts tel
   quel (style glassmorphism bleu + OAuth Google/Apple, incompatible avec
   le design de la démo validée — cf. DEMO_DESIGN_SPEC.md Écran 2). Crée un
   nouveau composant fidèle à DEMO_DESIGN_SPEC.md (fond vert plein #00532B
   avec pattern diagonal, carte blanche centrée, onglets Se connecter/
   Créer un compte, PAS d'OAuth).
2. Formulaire d'inscription parent (POST /api/parent/comptes) : même écran,
   onglet "Créer un compte" (cf. DEMO_DESIGN_SPEC.md).

## TESTS MANUELS (documentés dans le résumé, pas de tests automatisés e2e)

- Branding dynamique visible dans le DOM (variables CSS + preset PrimeNG
  mis à jour depuis l'API)
- Connexion SUPER_ADMIN de test → /app avec menu vide mais fonctionnel
- Connexion PARENT de test → /parent avec le layout choisi en Partie 3
- Accès direct à /app sans connexion → redirection /connexion
- Vérifie qu'aucune classe/component PrimeNG n'apparaît dans le DOM rendu
  de /vitrine ou /parent (inspecte le HTML généré, pas juste le code source)

NE PAS FAIRE à cette étape :
- Construire les écrans métier réels — prompts suivants
- Nettoyer/supprimer les pages de démo Poseidon non utilisées (Partie 6)
- Optimisation de performance avancée

À la fin, génère un résumé de handoff complet (arborescence, choix
techniques, en particulier la décision de la Partie 3, écarts, questions
ouvertes).
```
