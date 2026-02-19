# Manchester United Calendar App ⚽

A Manchester United-themed calendar application built with Next.js that displays a week view and tracks all MUFC fixtures for the 2025-26 season.

## Features

- **Week View**: Display a full week with hourly time slots (6am-11pm)
- **Manchester United Branding**: Official MUFC colors (Red #DA291C, Black, Gold #FFD700)
- **MUFC Fixtures**: Pre-loaded with all Manchester United 2025-26 Premier League fixtures
- **Event Management**: Create, view, and delete events with confirmation
- **Database Storage**: Events are persisted in SQLite database using Prisma ORM
- **Navigation**: Navigate between weeks with Previous/Next buttons or jump to today
- **Responsive Design**: Built with Tailwind CSS for a modern, responsive interface
- **REST API**: Full CRUD operations via Next.js API routes
- **Timezone Support**: All times automatically adjust to your local timezone

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the calendar.

## Usage

- **Create an Event**: Click on any time slot in the calendar or use the "+ New Event" button
- **Delete an Event**: Hover over any event and click the × button that appears
- **Navigate Weeks**: Use the "Previous" and "Next" buttons to move between weeks
- **Go to Today**: Click the "Today" button to jump back to the current week
- **View MUFC Fixtures**: All Manchester United Premier League matches are pre-loaded in red
- **View Events**: Events appear as red blocks in their scheduled time slots with title and time

## Technology Stack

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Prisma 7**: Modern ORM for database management
- **SQLite**: Lightweight database with LibSQL adapter
- **REST API**: Next.js API routes for backend operations

## Project Structure

```
app/
├── api/
│   └── events/
│       ├── route.ts      # GET/POST event endpoints
│       └── [id]/
│           └── route.ts  # DELETE event endpoint
├── components/
│   ├── WeekView.tsx      # Week calendar grid component
│   └── EventForm.tsx     # Event creation form modal
├── generated/
│   └── prisma/           # Generated Prisma client
├── lib/
│   └── prisma.ts         # Prisma client singleton
├── types.ts              # TypeScript type definitions
└── page.tsx              # Main application page

prisma/
├── migrations/           # Database migration history
├── schema.prisma         # Database schema definition
└── dev.db               # SQLite database file
```

## Database

The app uses Prisma ORM with SQLite for data persistence. The database schema includes:

- **Event** table with fields: id, title, date, startTime, endTime, description, createdAt, updatedAt

To reset the database:
```bash
npx prisma migrate reset
```

To view the database:
```bash
npx prisma studio
```

## Manchester United Fixtures

The calendar comes pre-loaded with all Manchester United Premier League fixtures for the 2025-26 season. To re-seed the fixtures:

```bash
npm run seed:matches
```

This will:
- Clear existing MUFC fixtures
- Add all upcoming Premier League matches
- Automatically adjust times to your local timezone

Current fixtures include matches against: Tottenham, West Ham, Everton, Crystal Palace, Newcastle, Aston Villa, Bournemouth, Leeds, Chelsea, Brentford, Liverpool, Sunderland, Nottingham Forest, and Brighton.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
