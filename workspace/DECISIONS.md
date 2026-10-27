# Journal de décisions du projet

## V1 : Starter

React permet d’employer exactement les mêmes composants dans le catalogue et
le viewport isolé. Le backend HTTP Node utilise la bibliothèque standard ; Zod
valide les entrées et les fichiers. Vite compile le frontend. Pas d’Electron,
base distante, Figma ou LLM obligatoire.

Codex propose du JSON sans outils ; le contrôleur est l’unique auteur des changements
locaux validés. Claude et Gemini ne sont pas activés sans qualification.

## 26 octobre 2026 : Checkpoint dans le starter

Problème : le starter est livré avec l’exemple fictif Lisière, qui ne dit rien de mon projet.

Options explorées : garder Lisière pour l’atelier, ou remplacer les textes de démonstration et les tokens par ceux de Checkpoint.

Décision : remplacer les textes de l’aperçu (Clair Obscur: Expedition 33, Baldur’s Gate 3, navigation Un jeu, Trouver, Mon profil) et saisir dans les tokens les couleurs, la police Atkinson Hyperlegible Next, la taille de corps de 16 et le rayon de 8. Les tests e2e ont été alignés sur les nouveaux libellés. Le fichier de tokens de départ du dossier workspace garde les valeurs Lisière, parce que les tests dépendent de la valeur de départ.

Preuves : build, check et tests unitaires passent ; la boucle proposer, diff, valider, annuler a été jouée sur color.brand.

Limite connue : DS-Studio ne contient que 18 tokens plats. Les modes Clair et Contraste élevé, l’échelle d’espacement complète et les styles de texte restent dans le fichier Figma, qui est la référence. Aucune synchronisation Figma n’existe.

## À compléter

Audit du design system Checkpoint, en attente de la consigne de l’enseignant.
