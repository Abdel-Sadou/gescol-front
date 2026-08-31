# ADR-010 — Identifiants générés côté client pour le cahier de texte (hors connexion)

**Statut** : Adopté

## Contexte
Le cahier de texte doit fonctionner hors connexion (cahier des charges §5.2) :
un enseignant saisit ses entrées sur son téléphone, potentiellement sans
réseau, et elles se synchronisent plus tard. Partout ailleurs dans le
projet, les identifiants sont générés côté serveur (`@GeneratedValue`,
MASTER_CONTEXT §2). Ce mécanisme ne fonctionne pas ici : si l'ID n'existe
qu'après la synchronisation, impossible de distinguer une resynchronisation
(retry réseau, redémarrage de l'app) d'une nouvelle création — risque de
doublons.

## Décision
`CahierTexte` est la seule entité du projet dont l'identifiant est fourni
par le client (généré côté application mobile/web au moment de la saisie
hors connexion, avant tout contact réseau), pas par `@GeneratedValue`.
L'endpoint de synchronisation traite cet identifiant comme clé
d'idempotence : si une entrée avec cet id existe déjà, la tentative est
ignorée silencieusement plutôt que de créer un doublon.

## Conséquences
- Cette exception est strictement bornée à `CahierTexte` — ne pas
  généraliser ce pattern à d'autres entités sans une raison aussi forte
  (besoin réel de fonctionnement hors connexion).
- Le format de l'identifiant (UUID v4 généré côté client) doit être
  garanti globalement unique — un simple compteur local serait insuffisant.
- La synchronisation par lot doit traiter chaque entrée dans sa propre
  transaction (`REQUIRES_NEW`, même principe que le retry de matricule/
  numéro de quittance) : l'échec d'une entrée du lot ne doit jamais faire
  perdre les autres entrées valides du même lot.
