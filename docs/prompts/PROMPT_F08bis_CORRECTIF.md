# PROMPT_F08bis_CORRECTIF — Déconnexion manquante + vérification polices

**À utiliser avec** : FRONTEND_CONTEXT.md fourni en contexte.

---

## Prompt

```
Contexte : deux points laissés ouverts par PROMPT_F08bis.

## Correctif 1 — Bouton de déconnexion (PRIORITAIRE)

Actuellement, aucun bouton de la nouvelle coque (AppShell) n'appelle
AuthService.logout() — un utilisateur connecté n'a aucun moyen de se
déconnecter depuis l'interface. Ajoute un menu déroulant sur la zone
profil (initiales utilisateur, topbar) avec au minimum une option
"Se déconnecter" qui appelle AuthService.logout() et redirige vers
/connexion. Traduit via Transloco (scope 'app').

## Correctif 2 — Polices Lora + Work Sans

Vérifie D'ABORD le contenu actuel de src/index.html (section <head>) :
cherche un lien Google Fonts existant pour Lora et/ou Work Sans (ajouté en
PROMPT_F04 pour Vitrine/Espace Parent).

Si le lien existe déjà et couvre les deux polices : ne change rien,
confirme-le dans le résumé.

Si absent ou incomplet : ajoute/complète le lien Google Fonts pour les
deux polices (poids nécessaires pour les titres serif et le corps de
texte de la direction "Institutionnel chaud" — vérifie _cobimag.scss pour
les graisses utilisées).

## VÉRIFICATION

- Un utilisateur connecté peut se déconnecter depuis n'importe quelle page
  de l'app interne, et se retrouve bien sur /connexion ensuite, token
  effacé
- Les titres du dashboard s'affichent bien en Lora (pas une police de
  secours système)

À la fin, résumé court : confirmation des deux correctifs, et l'état
initial trouvé pour les polices (déjà présentes ou non).
```
