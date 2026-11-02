# Chaptr

Journal de lecture de mangas et manhwas, **100 % local**. Vous notez où vous en êtes (série, dernier chapitre lu, un mot sur ce qu'il s'est passé) et l'application vous le rappelle d'un coup d'œil grâce au sceau rouge sur chaque couverture.

Aucun compte, aucun serveur, aucune requête réseau : vos données vivent dans **un fichier `.json` qui vous appartient**, plus une copie de travail dans votre navigateur.

## Fonctionnement des données

À l'ouverture, la page vous demande de charger vos données :

| Choix | Ce qu'il fait |
| --- | --- |
| **Rouvrir *mon-fichier.json*** | Chrome / Edge mémorisent le dernier fichier ouvert et peuvent y réécrire directement (bouton *Enregistrer*). |
| **Ouvrir une sauvegarde** | Choisit un fichier `.json` ou `.txt` exporté par Chaptr, y compris ceux de l'ancienne version. Vous pouvez aussi le déposer n'importe où sur la page. |
| **Reprendre la copie de ce navigateur** | Continue avec la copie gardée en local (IndexedDB) si vous n'avez pas le fichier sous la main. |
| **Nouvelle bibliothèque** | Part de zéro ; vous l'enregistrez quand vous voulez. |

Ensuite :

- Chaque modification est gardée automatiquement dans le navigateur.
- Le bouton **Enregistrer** écrit dans votre fichier (Chrome / Edge) ou télécharge une sauvegarde (Firefox / Safari). Un point rouge signale des modifications pas encore enregistrées, et la page vous prévient si vous la quittez sans enregistrer.
- Les couvertures sont réduites et stockées dans le fichier lui-même : il reste lisible hors connexion et transportable d'un appareil à l'autre.

Format du fichier (`version: 2`) :

```json
{
  "app": "chaptr",
  "version": 2,
  "exportedAt": "2026-11-02T10:00:00.000Z",
  "mangas": [
    {
      "id": "…",
      "addedAt": 1761990000000,
      "title": "Dandadan",
      "aliases": ["ダンダダン"],
      "cover": "data:image/jpeg;base64,…",
      "banner": "",
      "description": "…",
      "chapters": [{ "num": 178, "name": "", "date": 1762070000000, "memo": "…" }]
    }
  ]
}
```

Les anciens exports (un simple tableau de séries) sont acceptés tels quels.

## AniList (facultatif)

Dans le formulaire d'une série, le bouton **AniList** à côté du titre ouvre une recherche sur l'[API publique AniList](https://docs.anilist.co) (GraphQL, sans clé, ~90 requêtes/minute). Choisir un résultat préremplit la fiche : titre, autres graphies, couverture, bannière, synopsis, statut de publication et nombre total de chapitres. Les images sont converties en local quand le serveur l'autorise ; sinon l'URL est gardée et signalée.

Rien n'est envoyé tant que ce bouton n'est pas cliqué : l'application reste entièrement utilisable hors connexion. AniList ne fournit pas les titres de chapitres, qui restent à saisir.

## Hors connexion

Le site est une PWA : après une première visite, il se charge sans connexion et peut être installé comme une application (menu du navigateur → *Installer* / *Ajouter à l'écran d'accueil*). Aucune police ni aucun script n'est chargé depuis l'extérieur.

## Tester sans serveur : `chaptr.html`

```bash
npm run build:single   # → dist-single/chaptr.html
```

Ce fichier unique embarque tout (code, styles, police, icône). Ouvrez-le par double-clic : il fonctionne hors connexion, garde vos données dans le navigateur et, sous Chrome / Edge, sait écrire directement dans votre fichier de sauvegarde. Seule différence avec la version hébergée : pas d'installation en tant qu'application (le service worker exige une adresse `http(s)`).

## Développement

```bash
npm install
npm run dev        # serveur de développement
npm run build      # vérification TypeScript + site construit dans docs/
npm run build:single  # version un seul fichier dans dist-single/chaptr.html
npm run preview    # sert docs/ en local
```

Stack : React 18, TypeScript strict, Vite 6, Tailwind CSS 4, lucide-react, police Bricolage Grotesque auto-hébergée, `vite-plugin-pwa`.

## Mettre en ligne sur GitHub Pages

Le site construit est déjà dans le dossier `docs/` : rien à installer, rien à compiler.

1. Créez un dépôt sur GitHub et envoyez-y **tout le contenu** de ce dossier (y compris `docs/`), par glisser-déposer sur la page du dépôt (*Add file → Upload files*) ou avec GitHub Desktop.
2. *Settings → Pages → Build and deployment → Source : Deploy from a branch → Branch : `main`, dossier : `/docs` → Save*.
3. Une minute plus tard, le site est à `https://VOTRE_PSEUDO.github.io/NOM_DU_DEPOT/`.

Si vous modifiez le code, `npm run build` régénère `docs/` ; il ne reste qu'à renvoyer le dossier.

## Raccourcis

- `/` : chercher
- `Échap` : fermer une fenêtre, revenir à la bibliothèque
- Glisser le doigt sur le rail de lettres pour filtrer par initiale
