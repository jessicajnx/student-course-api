# Documentation Technique

## Présentation du projet

StudentCourseAPI est une API permettant de gérer les étudiants et les cours sans base de données externe (données en mémoire). Elle offre des routes pour :

- Créer, lire, mettre à jour et supprimer des étudiants et des cours.
- Gérer l’inscription et la désinscription des étudiants aux cours.

L’API est documentée via OpenAPI 3.0 et utilise Swagger UI pour visualiser les endpoints.

## Lancer le projet

Prérequis <br>
Node.js >= 16 <br>
npm

`git clone https://github.com/amine-el-amrani/student-course-api `

`cd student-course-api`

`npm install`

`npm run dev` <br>

Puis l'API est disponible avec localhost:3000/api-docs

### Commandes utiles

`npm run dev` Démarre le serveur en mode développement <br>
`npm run test` Lance tous les tests unitaires et d’intégration <br>
`npm run lint`Vérifie la qualité du code avec ESLint <br>
`npm run format`Formate le code avec Prettier

## Utilité des outils

Linting : ESLint + Prettier sont configurés pour assurer un code propre et cohérent. <br>

Tests : Tests unitaires pour storage et contrôleurs (studentsController et coursesController) + tests d’intégration avec Supertest. <br>

Pull request template pour uniformiser les PR :

- Description du changement
- Vérification de la CI et de Codacy
- Tests associés

## Intégration CI

- GitHub Actions : <br>
  Analyse du code avec Codacy sur chaque push ou pull request <br>
  Lancement des tests unitaires et d’intégration <br>

- Codacy : <br>
  Dashboard disponible pour suivre la qualité du code. <br>
  Analyse statique du code pour détecter : <br>

1. Problèmes ESLint
2. Problèmes de Prettier
3. Complexité du code
4. Doublons et mauvaises pratiques <br>
