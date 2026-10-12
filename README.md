# CodeCraftHub

A beginner-friendly personal learning goal tracker API for managing courses and tracking learning progress.

## Technologies

- Node.js
- Express
- JSON file storage

## Features

- Create a new course
- View all courses
- View a course by ID
- Update course information
- Delete a course
- Search courses by name or description
- View course statistics
- Automatically create `courses.json` if it does not exist

## Installation

1. Install Node.js and npm.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

## Start the Application

Run:

```bash
npm start
```

For development, you can run:

```bash
npm run dev
```

The API runs at:

http://localhost:5000

## Course Fields

Each course contains:

- `id` — Automatically generated unique ID
- `name` — Course name (required)
- `description` — Course description (required)
- `target_date` — Target completion date in `YYYY-MM-DD` format (required)
- `status` — One of `Not Started`, `In Progress`, or `Completed` (required)
- `created_at` — Automatically generated creation timestamp

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/courses` | Create a course |
| GET | `/api/courses` | Get all courses |
| GET | `/api/courses/:id` | Get a specific course |
| PUT | `/api/courses/:id` | Update a course |
| DELETE | `/api/courses/:id` | Delete a course |
| GET | `/api/courses/stats` | View course statistics |
| GET | `/api/courses/search?q=python` | Search courses |

## Data Storage

Course data is stored in `courses.json`. No database or authentication is required for this exercise.