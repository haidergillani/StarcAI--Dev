# Overall Scores & Metrics Component

The "Overall Scores & Metrics" component is designed to display user-specific metrics in a visually engaging manner using circular progress bars. This component fetches data from the backend using an API call and dynamically displays the scores.

## Features

- Dynamic Data Fetching: The component fetches scores based on the provided rewrite ID.
- Error Handling: Includes user-friendly error messages and a retry mechanism for failed requests.
- Customizable Styling: Utilizes Tailwind CSS for styling, allowing easy customization.

## Implementation

The main file for this component is ScoreContainer.tsx, located in src/pages/components.

## Usage:

```
<ScoreContainer rewriteId={rewriteId} />
```

- `rewriteId` (string): The ID for which scores are fetched from the backend.

## State Management:

- `useState` for handling scores, loading, and error states.
- `useEffect` for fetching data on component mount or when rewriteId changes.

## Styling:

This component uses Tailwind CSS for styling. The progress bars' colors are mapped to specific score types, making it visually intuitive.

## Backend Interaction

The component makes an API call to fetch scores. 

TODO: Ensure the backend URL is set in your .env.local file: `NEXT_PUBLIC_BACKEND_API=https://your-backend-url.com`

## Error Handling

Error handling is built into the component. It displays a user-friendly error message and a retry button in case of a failed API request.

## Dependencies

- `axios` for making HTTP requests.
- `react-circular-progressbar` for displaying the scores.
