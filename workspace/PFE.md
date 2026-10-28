# Mon projet

Nostromo : un petit site interactif sur l’équipage du cargo Nostromo, dans l’univers de la saga Alien, réalisé pour un exercice de design interactif.

Page de fan, non officielle. Alien et ses personnages appartiennent à 20th Century Studios. Les textes sont originaux. Les portraits sont des images tirées des films, gardées en local pour une présentation privée, non publiées dans le dépôt.

## Ce que fait le site

- Un écran d’entrée façon terminal, avec un texte de démarrage qui s’écrit lettre par lettre.
- Une scène d’accueil avec un œuf en fil de fer 3D, dessiné sur un canvas 2D, qui suit la souris.
- Six cartes de personnages qui s’inclinent en 3D selon la souris, et un dossier qui s’ouvre avec une mini-biographie et des jauges fictives.
- Un détecteur de mouvement : un radar en éventail avec balayage, des contacts cachés qui s’approchent de la sonde, un bip qui accélère quand on s’approche et une impulsion qui révèle tout. Rester trop longtemps collé à un contact fait perdre la partie.
- Un jeu dans le terminal MU/TH/UR : six messages pour convaincre la Compagnie d’envoyer de l’aide. On répond en cliquant sur des phrases, et pour deux messages on peut aussi écrire le sien, que la Compagnie analyse. Trois phrases toutes faites sont proposées à chaque fois, pour ne jamais rester bloqué. Gagné si elle accepte, perdu sinon, avec six fins différentes.
- Des œufs à ouvrir : un nouvel œuf toutes les 10 minutes, dix au maximum. Chaque œuf cache une carte parmi 24, de cinq raretés (commune, peu commune, rare, super rare, légendaire). Une page collection montre les cartes obtenues, les doublons et les cartes encore verrouillées.
- Un faux scan de l’équipage au démarrage, avant le bouton ENTER.
- Un plan du Nostromo en fil de fer : six salles, chacune avec un petit récit, quatre qui ouvrent une partie du site (pont : terminal, infirmerie : dossiers, cale : détecteur, sas : œufs).
- Un journal de bord : MU/TH/UR écrit seule des phrases selon la section, et réagit à certaines actions. Il se coupe avec un bouton.
- Un fond animé : un couloir du vaisseau en fil de fer qui avance quand on défile, s’étire et se penche quand on défile vite, et dérive doucement à l’arrêt. L’œuf de l’accueil s’ouvre en grand, tourne plus vite et s’efface quand on descend. Chaque section est une scène plein écran : le défilement fait avancer dans le couloir, la scène courante fonce vers nous et s’efface, un vide laisse défiler le couloir seul, puis la suivante surgit du fond, et les contenus longs se lisent sur place, et les titres se révèlent en entrant à l’écran.
- De petits sons d’interaction discrets au survol et au clic.
- Une musique d’ambiance rétro-futuriste synthétisée dans le navigateur, qu’on peut couper avec les sons.

## Publics et contraintes

- Public : les personnes qui regardent la restitution, sur ordinateur et sur mobile.
- Aucun flash, mouvements réduits si le système le demande, navigation au clavier, textes lisibles.
- Aucune donnée n’est envoyée nulle part. Seule la collection de cartes est enregistrée dans le navigateur de la personne, avec un bouton pour tout effacer.

## Ce que je veux montrer vendredi

- Une interface qui réagit à la souris : inclinaison 3D des cartes, œuf qui s’ouvre, dossiers animés.
- Un résultat testé : tests unitaires, tests navigateur, absence de défilement horizontal sur mobile.
- Ce qui reste hors de portée : le son n’a pas été comparé à d’autres ambiances, et aucun test avec un lecteur d’écran n’a été fait.
