# FitLog

A minimalist gym workout tracker built as a Progressive Web App (PWA). Track your exercises, monitor progress, and build consistency with weekly streaks.

## Features

- **Workout Tracking** - Log exercises with sets, reps, and weight. Supports gym machines, free weights, and cardio.
- **Progress Charts** - Visualize weight progression over time for each exercise.
- **Templates** - Save workouts as templates to quickly repeat your routines.
- **Weekly Streaks** - Stay motivated with streak tracking and weekly goals.
- **Calendar View** - See your workout history at a glance.
- **Import/Export** - Back up and restore your data as JSON.
- **Offline Support** - Works offline as an installable PWA. An unfinished workout is kept if the app closes.
- **Bilingual** - English and Spanish support.

## Tech Stack

- **SvelteKit 5** with Svelte 5 runes
- **Tailwind CSS** for styling
- **localStorage** for data, nothing leaves the device
- **Vite** for building

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production (static SPA in build/)
npm run build
```
