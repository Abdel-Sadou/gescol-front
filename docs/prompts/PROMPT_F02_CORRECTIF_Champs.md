# PROMPT_F02_CORRECTIF — Alignement des champs sur API_CONTRACT.md

**À utiliser avec** : FRONTEND_CONTEXT.md + docs/backend-reference/API_CONTRACT.md
fournis en contexte.

**Contexte** : `API_CONTRACT.md` confirme les vrais noms de champs. Deux
corrections à apporter, aucune autre logique à toucher.

---

## Prompt

```
Contexte : correctif suite à API_CONTRACT.md (backend). Deux champs mal
nommés dans le code existant (PROMPT_F01).

## Correctif 1 — AuthService.login()

Le payload envoyé à POST /api/auth/login doit être { email, motDePasse } —
pas { username, password }. Vérifie AuthService.login() et corrige le nom
des champs envoyés dans le corps de la requête.

IMPORTANT : ne touche PAS au texte affiché à l'écran dans connexion.ts — le
label visuel "Nom d'utilisateur" reste tel quel (fidèle à
DEMO_DESIGN_SPEC.md, déjà validé par l'établissement). Seul le nom du champ
JSON envoyé à l'API change, pas ce que voit l'utilisateur. L'input reste de
type texte standard, il collecte juste une adresse email dans les faits.

## Correctif 2 — Formulaire d'inscription parent (connexion.ts, onglet
"Créer un compte")

Le payload envoyé à POST /api/parent/comptes doit être exactement : email,
motDePasse, nom, prenom, telephone (optionnel) — cf. API_CONTRACT.md.
Vérifie que le formulaire actuel envoie bien ces noms de champs exacts
(probablement déjà correct pour nom/prenom/email, à vérifier surtout pour
motDePasse qui remplaçait probablement "password").

## VÉRIFICATION

Après correction, relis API_CONTRACT.md pour les deux endpoints concernés
et confirme, champ par champ, que ce qui est envoyé correspond exactement.

À la fin, résumé court (pas besoin du format complet de handoff pour un
correctif aussi ciblé) : quels fichiers modifiés, confirmation que les deux
payloads correspondent maintenant exactement à API_CONTRACT.md.
```
