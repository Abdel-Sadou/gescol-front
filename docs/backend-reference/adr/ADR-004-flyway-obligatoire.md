# ADR-004 — Migrations Flyway obligatoires, jamais `ddl-auto: update`

**Statut** : Adopté

## Contexte
Le schéma va évoluer sur de nombreuses sessions Claude Code, parfois en
parallèle sur des modules différents (ex. Paramétrage et Personnel). Sans
migrations versionnées, le schéma dérive silencieusement entre les
environnements et devient impossible à reproduire ou à auditer.

## Décision
Toute évolution de schéma passe par un fichier de migration Flyway versionné.
`ddl-auto` est réglé sur `validate` (jamais `update` ni `create`) dans tous les
environnements, y compris en développement local.

## Conséquences
- Chaque prompt Claude Code touchant le schéma doit produire son fichier
  `V{n}__description.sql`.
- Légèrement plus lent à itérer qu'avec l'auto-génération de schéma, mais
  reproductibilité totale, historique clair, rollback possible.
