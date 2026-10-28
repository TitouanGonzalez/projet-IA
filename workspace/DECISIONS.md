# Journal de décisions du projet

## V1 : Starter

React permet d’employer exactement les mêmes composants dans le catalogue et
le viewport isolé. Le backend HTTP Node utilise la bibliothèque standard ; Zod
valide les entrées et les fichiers. Vite compile le frontend. Pas d’Electron,
base distante, Figma ou LLM obligatoire.

Codex propose du JSON sans outils ; le contrôleur est l’unique auteur des changements
locaux validés. Claude et Gemini ne sont pas activés sans qualification.

## 27 octobre 2026 : un token de plus

Un token color.warning a été ajouté, avec une valeur par défaut dans le schéma pour qu’un état enregistré avant l’ajout reste lisible sans migration à la main. Le fichier de tokens de départ le contient aussi.

## 28 octobre 2026 : une page Nostromo à la place du banc d’essai

Problème : pour la restitution de vendredi, il fallait montrer un projet personnel, interactif, pas seulement le starter.

Décision : la page d’accueil devient un site sur l’équipage du Nostromo (univers Alien, à l’approche d’Halloween), dans un style terminal rétro-futuriste. Un écran d’entrée avec texte de démarrage tapé lettre par lettre, puis une scène avec un œuf en fil de fer 3D dessiné à la main sur un canvas 2D (il suit la souris et s’ouvre quand on approche un bouton), six cartes de personnages inclinées en 3D selon la souris, et un dossier qui s’ouvre avec une animation 3D, une mini-biographie et des jauges. Un jeu d’esquive essayé d’abord a été retiré de la page (il reste dans l’historique Git). La musique et les petits sons d’interaction (survol, clic, ouverture et fermeture d’un dossier) sont synthétisés en direct avec Web Audio : aucun fichier audio, donc aucun droit à gérer. Ils ne démarrent qu’après le clic sur ENTER, et le bouton SOUND les coupe ensemble. La couleur d’accent est un vert acide, #4F8A39, avec une lueur sur le curseur, le focus, les boutons, le fil de fer et les cartes, et une brume verte qui dérive très lentement (animation lente, sans clignotement, arrêtée si le système demande moins de mouvement). Les portraits des personnages sont facultatifs : une image déposée dans app/client/alien/images/ remplace l’icône de la carte, en tons verts. Ces images sont tirées des films : elles restent en local (ignorées par Git) et ne sont pas publiées.

Les biographies sont des textes originaux, sans citation du film. Les jauges sont fictives. La page porte une mention indiquant que c’est une page de fan et que la marque appartient à 20th Century Studios.

L’atelier d’origine (tokens, diff, historique) reste accessible à l’adresse /#atelier, ce qui conserve les tests existants.

Preuves : build et check passent, 27 tests unitaires, 19 tests navigateur (intro, animation du canvas, inclinaison des cartes, ouverture des six dossiers, focus rendu à la fermeture, bouton son, sons d’interaction sans erreur, absence du jeu retiré, absence de défilement horizontal à 390 px, atelier toujours accessible).

Limites connues : le vert #4F8A39 seul sur fond noir fait environ 4,5:1 de contraste, donc le texte vert est éclairci un peu pour rester lisible. Aucun test avec un lecteur d’écran. Le curseur système est remplacé par un curseur vert sur les écrans à souris. Le son n’a été vérifié que par le fait que le contexte audio démarre et que les sons ne produisent aucune erreur, pas à l’oreille dans un navigateur réel. Les couleurs de la page sont fixées dans sa feuille de style, elles ne suivent pas les tokens de l’atelier.
