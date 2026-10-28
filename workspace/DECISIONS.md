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

## 28 octobre 2026 : un jeu d’esquive branché sur les tokens

Un petit jeu d’esquive a été ajouté au catalogue. Un vaisseau se pilote avec les touches gauche et droite, des obstacles tombent de plus en plus vite. Le canvas lit les couleurs des tokens, donc changer un token change le jeu. La logique est dans app/shared/game.ts, sans dépendance au navigateur, pour être testée.

Accessibilité : aucun flash, un triangle et un losange en plus de la couleur, un mode calme (obstacles plus lents, activé d’office si le système demande moins d’animations), un état annoncé en texte.

Preuves : 7 tests unitaires sur la logique, un test navigateur, aucun stockage navigateur utilisé.

Limite connue : le meilleur score n’est gardé que tant que la page reste ouverte, puisque l’outil interdit le stockage navigateur.

## 28 octobre 2026 : une page Nostromo à la place du banc d’essai

Problème : pour la restitution de vendredi, il fallait montrer un projet personnel, interactif, pas seulement le starter.

Décision : la page d’accueil devient un site sur l’équipage du Nostromo (univers Alien, à l’approche d’Halloween), dans un style terminal rétro-futuriste. Un écran d’entrée avec texte de démarrage tapé lettre par lettre, puis une scène avec un œuf en fil de fer 3D dessiné à la main sur un canvas 2D (il suit la souris et s’ouvre quand on approche un bouton), six cartes de personnages inclinées en 3D selon la souris, et un dossier qui s’ouvre avec une animation 3D, une mini-biographie et des jauges. Le jeu d’esquive est conservé, aux couleurs de la page. La musique est synthétisée en direct avec Web Audio : aucun fichier audio, donc aucun droit à gérer, et elle ne démarre qu’après le clic sur ENTER, avec un bouton pour la couper.

Les biographies sont des textes originaux, sans citation ni visuel du film. Les jauges sont fictives. La page porte une mention indiquant que c’est une page de fan et que la marque appartient à 20th Century Studios.

L’atelier d’origine (tokens, diff, historique) reste accessible à l’adresse /#atelier, ce qui conserve les tests existants.

Preuves : build et check passent, 34 tests unitaires, 19 tests navigateur (intro, animation du canvas, inclinaison des cartes, ouverture des six dossiers, focus rendu à la fermeture, bouton son, pilotage du jeu, absence de défilement horizontal à 390 px, atelier toujours accessible).

Limites connues : aucun test avec un lecteur d’écran. Le curseur système est remplacé par un curseur rouge sur les écrans à souris. Le son n’a été vérifié que par le fait que le contexte audio démarre, pas à l’oreille dans un navigateur réel. Les couleurs de la page sont fixées dans sa feuille de style, elles ne suivent pas les tokens de l’atelier, sauf pour le jeu.
