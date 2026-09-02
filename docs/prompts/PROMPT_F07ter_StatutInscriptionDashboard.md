# PROMPT_F07ter — Affichage du statut d'inscription sur le dashboard

**À utiliser avec** : FRONTEND_CONTEXT.md, docs/backend-reference/API_CONTRACT.md
(mis à jour avec statutInscription dans EnfantResponse, cf. PROMPT_21
backend — vérifie qu'elle y est avant de lancer ce prompt).

---

## Prompt

```
Contexte : GET /api/parent/mes-enfants retourne désormais un champ
statutInscription (RESERVEE, CONFIRMEE, ANNULEE, ou null). Affiche-le
visuellement sur le tableau de bord parent.

## Correctif

1. Mets à jour l'interface EnfantResponse (parent-dashboard.service.ts ou
   équivalent) avec le nouveau champ statutInscription.
2. Dans le sélecteur d'enfant du dashboard, ajoute un badge/étiquette
   visuelle à côté du nom de chaque enfant :
   - RESERVEE : badge orange/ambre, texte "En attente de confirmation"
   - CONFIRMEE ou null (liaison ancienne sans Inscription) : pas de badge,
     ou un badge discret "Inscrit" si tu préfères une confirmation visuelle
     positive — à toi de juger ce qui est le plus cohérent avec le style
     déjà établi (cartes, couleurs de la démo)
   - ANNULEE : ne devrait normalement pas apparaître dans la liste
     (cas théorique), mais si présent, badge rouge/gris "Annulée"
3. Si l'enfant sélectionné a le statut RESERVEE, ajoute un message discret
   au-dessus du tableau de bord (solde/résultats/discipline) du type
   "L'inscription de [prénom] est en attente de confirmation — certaines
   informations peuvent être incomplètes." — sans bloquer l'accès aux
   données (le parent garde accès au solde/suivi normalement, cf. décision
   actée : pas de restriction fonctionnelle, juste une indication visuelle).
4. Ajoute les clés de traduction correspondantes (scope 'parent', FR + EN).

## VÉRIFICATION

- Un enfant RESERVEE affiche le badge et le message discret
- Un enfant CONFIRMEE (ou null) ne les affiche pas
- Le changement de sélection d'enfant met à jour le badge/message
  correctement

À la fin, résumé court (fichiers modifiés, choix de style retenu pour le
badge).
```
