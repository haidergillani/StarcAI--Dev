# Starc Frontend Setup Guide

This README provides the instructions necessary to get the frontend up and running.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Running the frontend

1. First, clone the repository and switch to the `starc-frontend` directory:
   ```
   cd starc-frontend
   ```

2. Start the frontend:
   ```
   npm run dev
   ```

### Running the Tests

To ensure that the front-end components of StarcAI are functioning correctly, we employ a suite of automated tests using Jest and React Testing Library. To run these tests, follow the instructions below:

1. Install all the necessary dependencies, including Jest and React Testing Library, by running:

   ```bash
   npm install
   ```

2. Run the tests using:
    ```
    npm test
    ```

# Starc Frontend Repository Structure

## Frontend Files Overview

- `README.md`: The guide for the project, including setup instructions, contribution guidelines, and more.
- `.env.example`: An example environment configuration file, outlining the necessary variables for local development.
- `.eslintrc.js`: Configuration for ESLint, ensuring code quality and consistency.
- `.gitignore`: Lists files and directories ignored by git, such as dependencies and build outputs.
- `next.config.js`: Custom configuration for Next.js, the React framework used for building the frontend.
- `package.json` & `package-lock.json`: Define the project's dependencies and lock them to specific versions.
- `postcss.config.js` & `tailwind.config.ts`: Configuration for PostCSS and Tailwind CSS, tools used for styling the application.
- `prettier.config.js`: Configuration for Prettier, an opinionated code formatter.
- `tsconfig.json`: Configuration for the TypeScript compiler.

## src Directory

- `assets`: Contains static files like images, fonts, and any other assets used throughout the application.
- `components`:
  - `Content.tsx`: Defines the main content area's structure.
  - `Custom404.tsx`: 404 page for pages without functionality.
  - `DocsBody.tsx`: Serves as a layout for the document viewing section.
  - `DocsContainer.tsx`: Component for displaying document content.
  - `DocsThumbnail.tsx`: Summary of a document, including its title and word count.
  - `Header.tsx`: The application's global header component.
  - `HomeBody.tsx`: Organizes the main content area and sidebar on the home screen.
  - `LoginAdvertisement.tsx`: Presents a promotional video for the login page.
  - `LoginBody.tsx`: Main container for the login page
  - `LoginForm.tsx`: Component for user login functionality.
  - `Menu.tsx`: SideMenu for navigation in the application.
  - `RegisterBody.tsx`: Container for the user registration.
  - `RegisterForm.tsx`: Component for user registration functionality.
  - `ScoreContainer.tsx`: Displays the scores and metrics related to the pitch analysis.
  - `SearchBar.tsx`: Component for searching within the application.
  - `Sidebar.tsx`: Container for the scores and suggestions.
  - `Suggestion.tsx`: Component for displaying suggestions.
  - `SuggestionsContainer.tsx`: Container for grouping multiple suggestion components.
- `pages`:
  - `_app.tsx`: The custom App component that initializes pages.
  - `index.tsx`: The starting page of the application, typically the home page.
  - `login.tsx`: The login page for user authentication.
  - `register.tsx`: The registration page for new users.
- `styles`: Directory containing global stylesheets and utilities for the application.

## Public Directory
- Contains publicly accessible assets like global images, favicons, and manifest files.

## Tests Directory

The `__tests__` directory contains a series of test files corresponding to the various components and features of the application. Each test file is named after the component or feature it is designed to test, ensuring a clear and maintainable testing structure.

- `Content.test.tsx`: Tests for the `Content` component, ensuring it renders correctly and behaves as expected.
- `Custom404.test.tsx`: Ensures that the custom 404 page renders properly when an undefined route is accessed.
- `DocsBody.test.tsx`: Verifies the layout and functionality of the `DocsBody` component, including integration with other components like `Menu` and `DocsContainer`.
- `DocThumbnail.test.tsx`: Tests the `DocThumbnail` component to ensure it displays document information correctly and handles deletion events.
- `LoginAd.test.tsx`: Ensures the `LoginAdvertisement` component properly displays marketing content and handles media playback.
- `LoginForm.test.tsx`: Checks the `LoginForm` component for correct form behavior, including input validation and submission events.
- `ScoreContainer.test.tsx`: Tests the `ScoreContainer` component to validate the display of scoring metrics and their updates.
- `SearchBar.test.tsx`: Ensures the `SearchBar` component functions correctly, allowing users to input search queries and submit them.
- `Sidebar.test.tsx`: Validates the `Sidebar` component's layout and its ability to render child components properly.

- `Suggestion.test.tsx`: Tests for the `Suggestion` component, confirming that it offers suggestions and interacts as expected with user input.

