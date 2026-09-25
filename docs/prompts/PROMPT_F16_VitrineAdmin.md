# PROMPT_F16 — Back-office Vitrine (actualités, calendrier, contenu, équipe pédagogique)

**À utiliser avec** : FRONTEND_CONTEXT.md, PAGES_ET_NAVIGATION.md,
docs/backend-reference/API_CONTRACT.md, DESIGN_SYSTEM.md fournis en
contexte.

**Nouvelle cadence** : un seul bloc, auto-vérification en fin de prompt.

---

## Prompt

```
Contexte : dernier module CRUD classique de l'app interne (F15, Cahier de
texte, sera différent — vraie logique offline, traité séparément). Ce
prompt construit le back-office qui alimente la Vitrine publique (F04) —
relis src/app/pages/vitrine/vitrine.ts pour connaître exactement les clés
ContenuVitrine réellement consommées par le site public avant de coder la
Partie 3, ne suppose pas une liste toi-même.

Vérifie les champs exacts de chaque endpoint dans API_CONTRACT.md avant de
coder.

## PARTIE 1 — Actualités (/app/communication/actualites)

Le champ contenu (texte long) dépasse ce qu'un dialog compact peut bien
accueillir — utilise une page dédiée (comme Élève/Personnel/Barèmes),
pas un dialog. Champs : titre, contenu, datePublication, imageUrl (texte
— PAS un vrai upload de fichier, cf. note Partie 3), publie (toggle —
dépublier n'efface pas l'actualité, cf. backend). Liste via
GescolTableComponent avec colonne statut (Publié/Brouillon).

## PARTIE 2 — Calendrier scolaire (/app/communication/calendrier)

Entité simple (libellé, description, dateDebut, dateFin) — dialog compact
(pattern F09), CRUD standard.

## PARTIE 3 — Contenu du site (/app/communication/contenu)

IMPORTANT : ce N'EST PAS une liste libre où on crée des entrées à volonté
— ce sont des clés FIXES que le code de la Vitrine publique lit par leur
nom exact (getContenu('MOT_FONDATEUR') etc.). Récupère la liste exacte des
clés utilisées en lisant vitrine.ts (F04) — n'invente aucune clé
supplémentaire, ne permets pas la création d'une clé arbitraire.

Présente un écran listant CHAQUE clé connue (une carte ou une ligne par
clé) avec :
- Le nom de la clé (lecture seule, ex. "MOT_FONDATEUR")
- Un texte explicatif de ce à quoi elle correspond sur le site (ex. "Mot
  du fondateur — section École")
- Le contenu actuel (zone de texte large, éditable)
- fichierUrl si pertinent pour cette clé (ex. règlement intérieur
  téléchargeable) : champ TEXTE pour coller une URL, PAS un vrai
  composant d'upload de fichier — aucun endpoint backend d'upload
  n'existe dans ce projet, ne le simule pas et ne laisse pas croire à
  l'utilisateur qu'un fichier est vraiment téléversé.
- Bouton "Enregistrer" par clé, appelant PUT /api/vitrine/contenu/{cle}

Si une clé n'a pas encore de valeur en base (contenu vide côté backend) :
affiche clairement "Pas encore renseigné" — ET utilise le texte fictif
correspondant de la démo Claude Design (reference/angular-demo ou
reference/angular-dashboard, selon où il se trouve) comme **placeholder
HTML natif** du textarea (attribut `placeholder`, jamais comme valeur
initiale du champ) : ça montre à l'admin le ton/la longueur attendus,
sans jamais risquer qu'il soit envoyé au backend par erreur si l'admin
n'y touche pas. Ne préremplis JAMAIS le champ avec ce texte comme valeur
réelle — un placeholder disparaît dès la première frappe et n'est jamais
soumis avec le formulaire, contrairement à une valeur initiale.

## PARTIE 4 — Équipe pédagogique (/app/communication/equipe)

Entité simple (nom, fonction, photoUrl, ordre) — dialog compact (F09).
Même remarque que Partie 1 : photoUrl est un champ texte pour une URL,
pas un upload réel. Le champ ordre détermine l'affichage trié côté
Vitrine publique — rends ça explicite dans le libellé du champ (ex.
"Ordre d'affichage (les plus petits nombres apparaissent en premier)").

## PARTIE 5 — Nettoyage des replis statiques risqués (vitrine.data.ts)

Certains blocs de données statiques utilisés en repli par vitrine.ts (F04)
contiennent des affirmations factuelles inventées et propres à COBIMAG —
risqués s'ils s'affichent un jour à un vrai visiteur. D'autres décrivent
juste la structure générale du système éducatif camerounais, pas une
affirmation vérifiable sur COBIMAG — moins risqués.

**À retirer du repli, remplacer par le même pattern "Bientôt disponible"
déjà utilisé pour les 404 ContenuVitrine (F04/F05)** :
- `STATS` (chiffres précis inventés : "35 ans", "1 350 élèves", "96%"...)
- `PRESENTATION` (Historique/Mission/Vision/Valeurs — dont une date de
  fondation précise inventée)
- `NEWS` (actualités entièrement fictives avec dates et résultats
  d'examens inventés — même si actuellement affiché seulement en cas de
  panne backend selon le commentaire existant, le risque reste réel : une
  panne peut arriver en production, mieux vaut un message générique
  "temporairement indisponible" qu'une fausse actualité plausible)
- `STEPS` (faux processus d'inscription, déjà identifié précédemment)
- `VIE_SCOLAIRE` (horaires/cantine/transport présentés comme des faits
  précis propres à l'établissement)

**À conserver en repli, MAIS ajoute un commentaire clair dans le code
signalant que l'exactitude doit être vérifiée avec l'établissement** :
- `SYSTEM_FR` / `SYSTEM_EN` / `CYCLES` — décrivent la structure du
  système éducatif camerounais en général (BEPC, Bac, GCE, cycles), pas
  une affirmation vérifiable spécifique à COBIMAG. Risque faible, mais
  vérifie quand même que les noms de classes correspondent à
  l'organisation réelle de l'établissement — signale-le comme point
  ouvert dans le résumé de fin si tu ne peux pas le confirmer toi-même.

Pour chaque bloc retiré : vérifie D'ABORD comment vitrine.ts l'utilise
réellement aujourd'hui (uniquement en repli sur erreur réseau, ou encore
affiché sans condition faute d'être branché sur l'API) avant de corriger
— certains semblent, d'après les commentaires TODO(API) existants,
peut-être pas encore réellement connectés à un appel API du tout malgré
le commentaire qui le suggère. Documente ce que tu trouves.

## SÉCURITÉ UI

Écriture réservée SUPER_ADMIN/COMMUNICATION sur tout le module, cohérent
avec PAGES_ET_NAVIGATION.md §1.

## i18n

Scope 'app', FR + EN, ADR-012.

## AUTO-VÉRIFICATION (documente le résultat en tête du handoff)

1. Champs conformes à API_CONTRACT.md pour tous les endpoints
2. Liste des clés ContenuVitrine (Partie 3) dérivée de la lecture réelle
   de vitrine.ts — liste-les explicitement dans le résumé de fin, avec
   confirmation qu'aucune clé n'a été inventée
2bis. Le texte de démo utilisé comme aide sur les clés vides est bien un
   `placeholder` HTML, jamais une valeur initiale du champ — vérifie en
   confirmant qu'un champ vide envoie bien une chaîne vide (ou rien) au
   backend si l'admin ne le modifie pas, pas le texte de démo
3. Aucune tentative de simuler un upload de fichier — imageUrl/photoUrl/
   fichierUrl sont des champs texte simples partout
4. Actualités : contenu dépublié reste visible dans la liste admin
   (juste marqué Brouillon), jamais supprimé silencieusement
5. Ordre d'affichage de l'équipe pédagogique explicité dans le formulaire
6. Aucun texte français en dur
7. Routes conformes à PAGES_ET_NAVIGATION.md §2
8. STATS/PRESENTATION/NEWS/STEPS/VIE_SCOLAIRE ne s'affichent plus jamais
   comme repli permanent — remplacés par "Bientôt disponible" ; état réel
   de leur branchement API documenté (déjà connecté ou pas encore)
9. SYSTEM_FR/SYSTEM_EN/CYCLES conservés avec le commentaire de
   vérification ajouté

À la fin, un seul résumé de handoff avec le résultat de
l'auto-vérification en premier — c'est le dernier module CRUD classique
de la feuille de route, seul F15 (Cahier de texte) restera après celui-ci.
```
